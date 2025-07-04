"""
YOLOv8 Model Training Script for Sperm Detection
Includes data preparation, augmentation, and training pipeline
"""

import os
import yaml
import shutil
import numpy as np
import cv2
from pathlib import Path
from ultralytics import YOLO
import albumentations as A
from typing import List, Dict, Tuple
import json
import argparse

from utils.logger import setup_logger

logger = setup_logger()

class SpermDatasetPreparator:
    """Prepare dataset for YOLOv8 training"""
    
    def __init__(self, base_dir: str = "datasets/sperm"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # Create directory structure
        for split in ['train', 'val', 'test']:
            (self.base_dir / split / 'images').mkdir(parents=True, exist_ok=True)
            (self.base_dir / split / 'labels').mkdir(parents=True, exist_ok=True)
        
        # Data augmentation pipeline
        self.augmentation_pipeline = A.Compose([
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
            A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=10, p=0.5),
            A.GaussianBlur(blur_limit=3, p=0.3),
            A.MotionBlur(blur_limit=3, p=0.3),
            A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
            A.RandomRotate90(p=0.5),
            A.Flip(p=0.5),
            A.ElasticTransform(alpha=1, sigma=50, alpha_affine=50, p=0.3),
        ], bbox_params=A.BboxParams(format='yolo', label_fields=['class_labels']))
    
    def create_synthetic_data(self, num_samples: int = 1000):
        """Create synthetic sperm-like data for initial training"""
        logger.info(f"Generating {num_samples} synthetic training samples...")
        
        for i in range(num_samples):
            # Create synthetic image
            img = self._generate_synthetic_image()
            
            # Generate annotations
            annotations = self._generate_synthetic_annotations(img.shape[:2])
            
            # Determine split (80% train, 15% val, 5% test)
            if i < num_samples * 0.8:
                split = 'train'
            elif i < num_samples * 0.95:
                split = 'val'
            else:
                split = 'test'
            
            # Save image and labels
            img_path = self.base_dir / split / 'images' / f"synthetic_{i:06d}.jpg"
            label_path = self.base_dir / split / 'labels' / f"synthetic_{i:06d}.txt"
            
            cv2.imwrite(str(img_path), img)
            
            with open(label_path, 'w') as f:
                for ann in annotations:
                    f.write(f"0 {ann['x']} {ann['y']} {ann['w']} {ann['h']}\n")
        
        logger.info("Synthetic data generation complete!")
    
    def _generate_synthetic_image(self, width: int = 640, height: int = 480) -> np.ndarray:
        """Generate synthetic microscopy-like image"""
        # Create base background
        img = np.random.randint(20, 60, (height, width, 3), dtype=np.uint8)
        
        # Add microscopy-like background texture
        noise = np.random.normal(0, 15, (height, width, 3))
        img = np.clip(img + noise, 0, 255).astype(np.uint8)
        
        # Add some debris and artifacts
        for _ in range(np.random.randint(5, 15)):
            x = np.random.randint(0, width)
            y = np.random.randint(0, height)
            size = np.random.randint(3, 10)
            cv2.circle(img, (x, y), size, (np.random.randint(0, 100),) * 3, -1)
        
        return img
    
    def _generate_synthetic_annotations(self, img_shape: Tuple[int, int]) -> List[Dict]:
        """Generate synthetic sperm-like object annotations"""
        height, width = img_shape
        annotations = []
        
        # Random number of sperm objects
        num_objects = np.random.randint(10, 50)
        
        for _ in range(num_objects):
            # Sperm are roughly elliptical, small objects
            center_x = np.random.uniform(0.1, 0.9)
            center_y = np.random.uniform(0.1, 0.9)
            
            # Sperm dimensions in normalized coordinates
            w = np.random.uniform(0.01, 0.03)  # Width: 1-3% of image
            h = np.random.uniform(0.005, 0.015)  # Height: 0.5-1.5% of image
            
            annotations.append({
                'x': center_x,
                'y': center_y,
                'w': w,
                'h': h
            })
        
        return annotations
    
    def augment_existing_data(self, source_dir: str, multiplier: int = 3):
        """Augment existing annotated data"""
        logger.info(f"Augmenting existing data with {multiplier}x multiplier...")
        
        source_path = Path(source_dir)
        if not source_path.exists():
            logger.warning(f"Source directory {source_dir} does not exist")
            return
        
        # Process existing images and labels
        image_files = list((source_path / 'images').glob('*.jpg')) + list((source_path / 'images').glob('*.png'))
        
        for img_file in image_files:
            label_file = source_path / 'labels' / f"{img_file.stem}.txt"
            
            if not label_file.exists():
                continue
            
            # Load image and annotations
            img = cv2.imread(str(img_file))
            if img is None:
                continue
            
            # Load YOLO format annotations
            bboxes, class_labels = self._load_yolo_annotations(label_file, img.shape[:2])
            
            # Apply augmentations
            for aug_idx in range(multiplier):
                try:
                    augmented = self.augmentation_pipeline(
                        image=img,
                        bboxes=bboxes,
                        class_labels=class_labels
                    )
                    
                    aug_img = augmented['image']
                    aug_bboxes = augmented['bboxes']
                    aug_labels = augmented['class_labels']
                    
                    # Save augmented data
                    aug_img_path = self.base_dir / 'train' / 'images' / f"{img_file.stem}_aug_{aug_idx}.jpg"
                    aug_label_path = self.base_dir / 'train' / 'labels' / f"{img_file.stem}_aug_{aug_idx}.txt"
                    
                    cv2.imwrite(str(aug_img_path), aug_img)
                    
                    with open(aug_label_path, 'w') as f:
                        for bbox, label in zip(aug_bboxes, aug_labels):
                            f.write(f"{label} {bbox[0]} {bbox[1]} {bbox[2]} {bbox[3]}\n")
                
                except Exception as e:
                    logger.error(f"Augmentation failed for {img_file}: {str(e)}")
        
        logger.info("Data augmentation complete!")
    
    def _load_yolo_annotations(self, label_file: Path, img_shape: Tuple[int, int]) -> Tuple[List, List]:
        """Load YOLO format annotations"""
        bboxes = []
        class_labels = []
        
        with open(label_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    class_id = int(parts[0])
                    x, y, w, h = map(float, parts[1:5])
                    
                    bboxes.append([x, y, w, h])
                    class_labels.append(class_id)
        
        return bboxes, class_labels
    
    def create_dataset_config(self):
        """Create YOLO dataset configuration file"""
        config = {
            'path': str(self.base_dir.absolute()),
            'train': 'train/images',
            'val': 'val/images',
            'test': 'test/images',
            'names': {
                0: 'sperm'
            },
            'nc': 1
        }
        
        config_path = self.base_dir / 'dataset.yaml'
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        logger.info(f"Dataset configuration saved to {config_path}")
        return str(config_path)


class SpermModelTrainer:
    """YOLOv8 model trainer for sperm detection"""
    
    def __init__(self, dataset_config: str, model_name: str = 'yolov8n.pt'):
        self.dataset_config = dataset_config
        self.model_name = model_name
        self.model = None
    
    def train(self, 
              epochs: int = 100,
              imgsz: int = 640,
              batch: int = 16,
              device: str = 'auto',
              project: str = 'runs/detect',
              name: str = 'sperm_detection'):
        """Train YOLOv8 model for sperm detection"""
        
        logger.info(f"Starting training with {epochs} epochs...")
        
        try:
            # Initialize model
            self.model = YOLO(self.model_name)
            
            # Train the model
            results = self.model.train(
                data=self.dataset_config,
                epochs=epochs,
                imgsz=imgsz,
                batch=batch,
                device=device,
                project=project,
                name=name,
                patience=10,
                save=True,
                cache=True,
                optimizer='AdamW',
                lr0=0.01,
                weight_decay=0.0005,
                warmup_epochs=3.0,
                box=7.5,
                cls=0.5,
                dfl=1.5,
                mosaic=1.0,
                mixup=0.1,
                copy_paste=0.1,
                degrees=0.0,
                translate=0.1,
                scale=0.5,
                shear=0.0,
                perspective=0.0,
                flipud=0.0,
                fliplr=0.5,
                hsv_h=0.015,
                hsv_s=0.7,
                hsv_v=0.4
            )
            
            logger.info("Training completed successfully!")
            
            # Save final model
            model_path = Path("models/sperm_yolov8.pt")
            model_path.parent.mkdir(exist_ok=True)
            shutil.copy(results.save_dir / 'weights' / 'best.pt', model_path)
            
            logger.info(f"Best model saved to {model_path}")
            
            return results
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            raise
    
    def validate(self):
        """Validate trained model"""
        if self.model is None:
            logger.error("No model loaded for validation")
            return None
        
        logger.info("Running model validation...")
        results = self.model.val()
        return results
    
    def export_model(self, format: str = 'onnx'):
        """Export model to different formats"""
        if self.model is None:
            logger.error("No model loaded for export")
            return None
        
        logger.info(f"Exporting model to {format} format...")
        try:
            path = self.model.export(format=format)
            logger.info(f"Model exported to {path}")
            return path
        except Exception as e:
            logger.error(f"Export failed: {str(e)}")
            return None


def main():
    """Main training pipeline"""
    parser = argparse.ArgumentParser(description='Train YOLOv8 model for sperm detection')
    parser.add_argument('--epochs', type=int, default=100, help='Number of training epochs')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--imgsz', type=int, default=640, help='Image size')
    parser.add_argument('--device', type=str, default='auto', help='Device (auto, cpu, cuda)')
    parser.add_argument('--synthetic', action='store_true', help='Generate synthetic data')
    parser.add_argument('--num-synthetic', type=int, default=1000, help='Number of synthetic samples')
    parser.add_argument('--augment-source', type=str, help='Source directory for data augmentation')
    
    args = parser.parse_args()
    
    logger.info("Starting Sperm Detection Model Training Pipeline")
    
    # Prepare dataset
    preparator = SpermDatasetPreparator()
    
    if args.synthetic:
        preparator.create_synthetic_data(args.num_synthetic)
    
    if args.augment_source:
        preparator.augment_existing_data(args.augment_source)
    
    # Create dataset configuration
    dataset_config = preparator.create_dataset_config()
    
    # Train model
    trainer = SpermModelTrainer(dataset_config)
    
    try:
        results = trainer.train(
            epochs=args.epochs,
            batch=args.batch,
            imgsz=args.imgsz,
            device=args.device
        )
        
        # Validate model
        trainer.validate()
        
        # Export model
        trainer.export_model('onnx')
        
        logger.info("Training pipeline completed successfully!")
        
    except Exception as e:
        logger.error(f"Training pipeline failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()