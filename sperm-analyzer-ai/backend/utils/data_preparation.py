"""
Data preparation utilities for sperm microscopy images
Includes image preprocessing, annotation tools, and quality assessment
"""

import cv2
import numpy as np
from pathlib import Path
import json
from typing import List, Dict, Tuple, Optional
import matplotlib.pyplot as plt
from scipy import ndimage, stats
from skimage import measure, filters, morphology, segmentation
import pandas as pd

from utils.logger import setup_logger

logger = setup_logger()

class MicroscopyImageProcessor:
    """Processor for microscopy images to enhance sperm visibility"""
    
    def __init__(self):
        self.default_params = {
            'blur_kernel': 3,
            'adaptive_block_size': 15,
            'adaptive_c': 2,
            'morph_kernel_size': 3,
            'min_contour_area': 20,
            'max_contour_area': 1000,
            'aspect_ratio_min': 1.5,
            'aspect_ratio_max': 8.0
        }
    
    def preprocess_image(self, image: np.ndarray, enhance_contrast: bool = True) -> np.ndarray:
        """Preprocess microscopy image for better sperm detection"""
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (self.default_params['blur_kernel'], 
                                          self.default_params['blur_kernel']), 0)
        
        if enhance_contrast:
            # Enhance contrast using CLAHE
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(blurred)
        else:
            enhanced = blurred
        
        return enhanced
    
    def detect_potential_sperm(self, image: np.ndarray) -> List[Dict]:
        """Detect potential sperm objects using classical computer vision"""
        
        processed = self.preprocess_image(image)
        
        # Apply adaptive thresholding
        binary = cv2.adaptiveThreshold(
            processed,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            self.default_params['adaptive_block_size'],
            self.default_params['adaptive_c']
        )
        
        # Morphological operations to clean up
        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (self.default_params['morph_kernel_size'], self.default_params['morph_kernel_size'])
        )
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detections = []
        height, width = image.shape[:2]
        
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Filter by area
            if (area < self.default_params['min_contour_area'] or 
                area > self.default_params['max_contour_area']):
                continue
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Calculate aspect ratio
            aspect_ratio = max(w, h) / min(w, h) if min(w, h) > 0 else 0
            
            # Filter by aspect ratio (sperm are elongated)
            if (aspect_ratio < self.default_params['aspect_ratio_min'] or 
                aspect_ratio > self.default_params['aspect_ratio_max']):
                continue
            
            # Calculate normalized coordinates
            center_x = (x + w/2) / width
            center_y = (y + h/2) / height
            norm_w = w / width
            norm_h = h / height
            
            # Calculate confidence based on shape characteristics
            confidence = self._calculate_shape_confidence(contour, area, aspect_ratio)
            
            detections.append({
                'x': center_x,
                'y': center_y,
                'width': norm_w,
                'height': norm_h,
                'confidence': confidence,
                'area': area,
                'aspect_ratio': aspect_ratio,
                'bbox': [x, y, w, h]
            })
        
        # Sort by confidence
        detections.sort(key=lambda x: x['confidence'], reverse=True)
        
        return detections
    
    def _calculate_shape_confidence(self, contour: np.ndarray, area: float, aspect_ratio: float) -> float:
        """Calculate confidence score based on shape characteristics"""
        
        # Ideal sperm characteristics
        ideal_area_range = (50, 300)
        ideal_aspect_ratio_range = (2.5, 5.0)
        
        # Area score
        area_score = 1.0
        if area < ideal_area_range[0]:
            area_score = area / ideal_area_range[0]
        elif area > ideal_area_range[1]:
            area_score = ideal_area_range[1] / area
        
        # Aspect ratio score
        ar_score = 1.0
        if aspect_ratio < ideal_aspect_ratio_range[0]:
            ar_score = aspect_ratio / ideal_aspect_ratio_range[0]
        elif aspect_ratio > ideal_aspect_ratio_range[1]:
            ar_score = ideal_aspect_ratio_range[1] / aspect_ratio
        
        # Solidity (how convex the shape is)
        hull = cv2.convexHull(contour)
        hull_area = cv2.contourArea(hull)
        solidity = area / hull_area if hull_area > 0 else 0
        
        # Extent (ratio of contour area to bounding rectangle area)
        x, y, w, h = cv2.boundingRect(contour)
        rect_area = w * h
        extent = area / rect_area if rect_area > 0 else 0
        
        # Combine scores
        confidence = (area_score * 0.3 + ar_score * 0.4 + solidity * 0.2 + extent * 0.1)
        
        return min(confidence, 1.0)
    
    def generate_yolo_annotations(self, detections: List[Dict], 
                                 confidence_threshold: float = 0.3) -> List[str]:
        """Generate YOLO format annotations from detections"""
        
        annotations = []
        for detection in detections:
            if detection['confidence'] >= confidence_threshold:
                # YOLO format: class_id x_center y_center width height
                annotation = f"0 {detection['x']:.6f} {detection['y']:.6f} {detection['width']:.6f} {detection['height']:.6f}"
                annotations.append(annotation)
        
        return annotations
    
    def visualize_detections(self, image: np.ndarray, detections: List[Dict], 
                           save_path: Optional[str] = None) -> np.ndarray:
        """Visualize detections on image"""
        
        vis_image = image.copy()
        if len(vis_image.shape) == 2:
            vis_image = cv2.cvtColor(vis_image, cv2.COLOR_GRAY2BGR)
        
        height, width = image.shape[:2]
        
        for i, detection in enumerate(detections):
            # Convert normalized coordinates back to pixels
            x = int((detection['x'] - detection['width']/2) * width)
            y = int((detection['y'] - detection['height']/2) * height)
            w = int(detection['width'] * width)
            h = int(detection['height'] * height)
            
            # Color based on confidence
            confidence = detection['confidence']
            if confidence > 0.7:
                color = (0, 255, 0)  # Green for high confidence
            elif confidence > 0.4:
                color = (0, 255, 255)  # Yellow for medium confidence
            else:
                color = (0, 0, 255)  # Red for low confidence
            
            # Draw bounding box
            cv2.rectangle(vis_image, (x, y), (x + w, y + h), color, 2)
            
            # Draw confidence score
            label = f"{confidence:.2f}"
            cv2.putText(vis_image, label, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        if save_path:
            cv2.imwrite(save_path, vis_image)
        
        return vis_image


class DatasetValidator:
    """Validate and assess dataset quality"""
    
    def __init__(self):
        self.metrics = {}
    
    def validate_dataset(self, dataset_path: str) -> Dict:
        """Validate dataset structure and quality"""
        
        dataset_path = Path(dataset_path)
        
        validation_results = {
            'structure_valid': True,
            'image_stats': {},
            'annotation_stats': {},
            'quality_issues': []
        }
        
        # Check directory structure
        required_dirs = ['train/images', 'train/labels', 'val/images', 'val/labels']
        for dir_name in required_dirs:
            if not (dataset_path / dir_name).exists():
                validation_results['structure_valid'] = False
                validation_results['quality_issues'].append(f"Missing directory: {dir_name}")
        
        if not validation_results['structure_valid']:
            return validation_results
        
        # Analyze images and annotations
        for split in ['train', 'val']:
            images_dir = dataset_path / split / 'images'
            labels_dir = dataset_path / split / 'labels'
            
            image_files = list(images_dir.glob('*.jpg')) + list(images_dir.glob('*.png'))
            label_files = list(labels_dir.glob('*.txt'))
            
            # Image statistics
            validation_results['image_stats'][split] = {
                'count': len(image_files),
                'formats': {},
                'sizes': []
            }
            
            # Annotation statistics
            validation_results['annotation_stats'][split] = {
                'count': len(label_files),
                'objects_per_image': [],
                'bbox_sizes': []
            }
            
            # Process files
            for img_file in image_files[:100]:  # Sample first 100 images
                try:
                    img = cv2.imread(str(img_file))
                    if img is not None:
                        h, w = img.shape[:2]
                        validation_results['image_stats'][split]['sizes'].append((w, h))
                        
                        ext = img_file.suffix.lower()
                        validation_results['image_stats'][split]['formats'][ext] = \
                            validation_results['image_stats'][split]['formats'].get(ext, 0) + 1
                except Exception as e:
                    validation_results['quality_issues'].append(f"Error reading image {img_file}: {str(e)}")
            
            # Process annotations
            for label_file in label_files[:100]:  # Sample first 100 labels
                try:
                    with open(label_file, 'r') as f:
                        lines = f.readlines()
                    
                    num_objects = len(lines)
                    validation_results['annotation_stats'][split]['objects_per_image'].append(num_objects)
                    
                    for line in lines:
                        parts = line.strip().split()
                        if len(parts) >= 5:
                            _, x, y, w, h = map(float, parts[:5])
                            validation_results['annotation_stats'][split]['bbox_sizes'].append((w, h))
                
                except Exception as e:
                    validation_results['quality_issues'].append(f"Error reading label {label_file}: {str(e)}")
        
        # Calculate summary statistics
        for split in ['train', 'val']:
            if validation_results['image_stats'][split]['sizes']:
                sizes = validation_results['image_stats'][split]['sizes']
                validation_results['image_stats'][split]['avg_size'] = np.mean(sizes, axis=0).tolist()
                validation_results['image_stats'][split]['std_size'] = np.std(sizes, axis=0).tolist()
            
            if validation_results['annotation_stats'][split]['objects_per_image']:
                objects = validation_results['annotation_stats'][split]['objects_per_image']
                validation_results['annotation_stats'][split]['avg_objects'] = np.mean(objects)
                validation_results['annotation_stats'][split]['std_objects'] = np.std(objects)
        
        return validation_results
    
    def generate_dataset_report(self, validation_results: Dict, output_path: str):
        """Generate dataset validation report"""
        
        report_lines = [
            "# Dataset Validation Report",
            f"Generated: {pd.Timestamp.now()}",
            "",
            "## Structure Validation",
            f"Valid structure: {'✅' if validation_results['structure_valid'] else '❌'}",
            ""
        ]
        
        if validation_results['quality_issues']:
            report_lines.extend([
                "## Quality Issues",
                ""
            ])
            for issue in validation_results['quality_issues']:
                report_lines.append(f"- {issue}")
            report_lines.append("")
        
        # Image statistics
        report_lines.extend([
            "## Image Statistics",
            ""
        ])
        
        for split in ['train', 'val']:
            if split in validation_results['image_stats']:
                stats = validation_results['image_stats'][split]
                report_lines.extend([
                    f"### {split.title()} Split",
                    f"- Image count: {stats['count']}",
                    f"- Average size: {stats.get('avg_size', 'N/A')}",
                    f"- Size std dev: {stats.get('std_size', 'N/A')}",
                    f"- Formats: {stats.get('formats', {})}",
                    ""
                ])
        
        # Annotation statistics
        report_lines.extend([
            "## Annotation Statistics",
            ""
        ])
        
        for split in ['train', 'val']:
            if split in validation_results['annotation_stats']:
                stats = validation_results['annotation_stats'][split]
                report_lines.extend([
                    f"### {split.title()} Split",
                    f"- Label files: {stats['count']}",
                    f"- Avg objects per image: {stats.get('avg_objects', 'N/A'):.2f}",
                    f"- Objects std dev: {stats.get('std_objects', 'N/A'):.2f}",
                    ""
                ])
        
        # Write report
        with open(output_path, 'w') as f:
            f.write('\n'.join(report_lines))
        
        logger.info(f"Dataset validation report saved to {output_path}")


def process_microscopy_video(video_path: str, output_dir: str, 
                           frame_interval: int = 30) -> Dict:
    """Process microscopy video to extract training frames"""
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    processor = MicroscopyImageProcessor()
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    extracted_frames = []
    frame_number = 0
    saved_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Extract frame at intervals
        if frame_number % frame_interval == 0:
            # Detect potential sperm
            detections = processor.detect_potential_sperm(frame)
            
            if len(detections) > 0:  # Only save frames with detections
                # Save frame
                frame_filename = f"frame_{saved_count:06d}.jpg"
                frame_path = output_path / frame_filename
                cv2.imwrite(str(frame_path), frame)
                
                # Generate annotations
                annotations = processor.generate_yolo_annotations(detections)
                
                # Save annotations
                label_filename = f"frame_{saved_count:06d}.txt"
                label_path = output_path / label_filename
                with open(label_path, 'w') as f:
                    f.write('\n'.join(annotations))
                
                # Save visualization
                vis_image = processor.visualize_detections(frame, detections)
                vis_path = output_path / f"vis_{saved_count:06d}.jpg"
                cv2.imwrite(str(vis_path), vis_image)
                
                extracted_frames.append({
                    'frame_number': frame_number,
                    'timestamp': frame_number / fps,
                    'detections': len(detections),
                    'filename': frame_filename
                })
                
                saved_count += 1
        
        frame_number += 1
        
        if frame_number % 1000 == 0:
            logger.info(f"Processed {frame_number}/{total_frames} frames")
    
    cap.release()
    
    # Save extraction summary
    summary = {
        'video_path': video_path,
        'total_frames': total_frames,
        'extracted_frames': saved_count,
        'frame_interval': frame_interval,
        'fps': fps,
        'frames': extracted_frames
    }
    
    summary_path = output_path / 'extraction_summary.json'
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    logger.info(f"Video processing complete: {saved_count} frames extracted")
    
    return summary


if __name__ == "__main__":
    # Example usage
    import argparse
    
    parser = argparse.ArgumentParser(description='Process microscopy data for training')
    parser.add_argument('--video', type=str, help='Input video file')
    parser.add_argument('--output', type=str, default='extracted_frames', help='Output directory')
    parser.add_argument('--interval', type=int, default=30, help='Frame extraction interval')
    parser.add_argument('--validate', type=str, help='Dataset directory to validate')
    
    args = parser.parse_args()
    
    if args.video:
        summary = process_microscopy_video(args.video, args.output, args.interval)
        print(f"Extracted {summary['extracted_frames']} frames")
    
    if args.validate:
        validator = DatasetValidator()
        results = validator.validate_dataset(args.validate)
        validator.generate_dataset_report(results, f"{args.validate}_validation_report.md")
        print(f"Validation complete. Report saved.")