"""
Model service for YOLOv8 sperm detection and tracking
"""

import torch
import cv2
import numpy as np
from ultralytics import YOLO
from deep_sort_realtime import DeepSort
from pathlib import Path
import asyncio
from typing import List, Tuple, Dict, Any, Optional
import os
import json

from utils.logger import setup_logger
from models.analysis_models import SpermDetection, SpermTrack

logger = setup_logger()

class ModelService:
    """Service for managing YOLOv8 model and tracking"""
    
    def __init__(self):
        self.model = None
        self.tracker = None
        self.model_path = "models/sperm_yolov8.pt"
        self.confidence_threshold = 0.25
        self.iou_threshold = 0.45
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize model and tracker"""
        try:
            logger.info("Initializing Model Service...")
            
            # Create models directory
            models_dir = Path("models")
            models_dir.mkdir(exist_ok=True)
            
            # Load or create YOLOv8 model
            await self._load_or_create_model()
            
            # Initialize DeepSORT tracker
            self._initialize_tracker()
            
            self.is_initialized = True
            logger.info("Model Service initialized successfully!")
            
        except Exception as e:
            logger.error(f"Failed to initialize Model Service: {str(e)}")
            raise
    
    async def _load_or_create_model(self):
        """Load existing model or create/train new one"""
        try:
            if os.path.exists(self.model_path):
                logger.info(f"Loading existing model from {self.model_path}")
                self.model = YOLO(self.model_path)
            else:
                logger.info("Creating new YOLOv8 model for sperm detection")
                await self._create_and_train_model()
                
        except Exception as e:
            logger.error(f"Model loading failed: {str(e)}")
            # Fallback to pre-trained YOLOv8 model
            logger.info("Falling back to base YOLOv8 model")
            self.model = YOLO('yolov8n.pt')
    
    async def _create_and_train_model(self):
        """Create and train YOLOv8 model for sperm detection"""
        logger.info("Training new sperm detection model...")
        
        # Start with pre-trained YOLOv8
        self.model = YOLO('yolov8n.pt')
        
        # Create dataset configuration
        await self._create_dataset_config()
        
        # Train the model (this is a simplified training setup)
        # In production, you would have a proper dataset
        try:
            # If we have training data, train the model
            dataset_config = "models/sperm_dataset.yaml"
            if os.path.exists(dataset_config):
                logger.info("Starting model training...")
                results = self.model.train(
                    data=dataset_config,
                    epochs=50,
                    imgsz=640,
                    batch=16,
                    name='sperm_detection',
                    device='cuda' if torch.cuda.is_available() else 'cpu'
                )
                
                # Save trained model
                self.model.save(self.model_path)
                logger.info(f"Model trained and saved to {self.model_path}")
            else:
                logger.warning("No training dataset found, using base model")
                
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            logger.info("Using base YOLOv8 model")
    
    async def _create_dataset_config(self):
        """Create dataset configuration for training"""
        config = {
            "path": "datasets/sperm",
            "train": "train/images",
            "val": "val/images",
            "test": "test/images",
            "names": {
                0: "sperm"
            },
            "nc": 1  # number of classes
        }
        
        config_path = "models/sperm_dataset.yaml"
        with open(config_path, 'w') as f:
            import yaml
            yaml.dump(config, f)
        
        logger.info(f"Dataset configuration created: {config_path}")
    
    def _initialize_tracker(self):
        """Initialize DeepSORT tracker"""
        try:
            self.tracker = DeepSort(
                max_age=30,
                n_init=3,
                nms_max_overlap=1.0,
                max_cosine_distance=0.2,
                nn_budget=None,
                override_track_class=None,
                embedder="mobilenet",
                half=True,
                bgr=True,
                embedder_gpu=torch.cuda.is_available(),
                embedder_model_name=None,
                embedder_wts=None,
                polygon=False,
                today=None
            )
            logger.info("DeepSORT tracker initialized")
        except Exception as e:
            logger.error(f"Tracker initialization failed: {str(e)}")
            self.tracker = None
    
    def detect_sperm(self, frame: np.ndarray) -> List[SpermDetection]:
        """Detect sperm in a single frame"""
        if not self.model:
            return []
        
        try:
            # Run inference
            results = self.model(frame, conf=self.confidence_threshold, iou=self.iou_threshold)
            
            detections = []
            for r in results:
                boxes = r.boxes
                if boxes is not None:
                    for i, box in enumerate(boxes):
                        # Extract detection data
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        
                        # Calculate center point
                        x_center = (x1 + x2) / 2
                        y_center = (y1 + y2) / 2
                        
                        detection = SpermDetection(
                            id=i,
                            x=float(x_center),
                            y=float(y_center),
                            confidence=float(confidence),
                            frame_number=0,  # Will be set by caller
                            timestamp=0.0    # Will be set by caller
                        )
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Detection failed: {str(e)}")
            return []
    
    def update_tracker(self, detections: List[SpermDetection], frame: np.ndarray) -> List[Dict]:
        """Update tracker with new detections"""
        if not self.tracker or not detections:
            return []
        
        try:
            # Convert detections to format expected by DeepSORT
            detection_list = []
            for det in detections:
                # Convert center point to bbox
                bbox_width = 20  # Estimated sperm width
                bbox_height = 15  # Estimated sperm height
                
                x1 = det.x - bbox_width/2
                y1 = det.y - bbox_height/2
                x2 = det.x + bbox_width/2
                y2 = det.y + bbox_height/2
                
                detection_list.append([x1, y1, x2, y2, det.confidence])
            
            # Update tracker
            tracks = self.tracker.update_tracks(detection_list, frame=frame)
            
            # Convert tracks to our format
            track_results = []
            for track in tracks:
                if not track.is_confirmed():
                    continue
                
                bbox = track.to_ltrb()
                track_results.append({
                    'track_id': track.track_id,
                    'bbox': bbox,
                    'confidence': track.get_det_conf() if hasattr(track, 'get_det_conf') else 1.0
                })
            
            return track_results
            
        except Exception as e:
            logger.error(f"Tracking failed: {str(e)}")
            return []
    
    async def process_video(self, video_path: str) -> Dict[str, Any]:
        """Process entire video for sperm detection and tracking"""
        if not self.is_initialized:
            raise RuntimeError("Model service not initialized")
        
        logger.info(f"Processing video: {video_path}")
        
        try:
            # Open video
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {video_path}")
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = total_frames / fps if fps > 0 else 0
            
            logger.info(f"Video properties: {width}x{height}, {fps} fps, {total_frames} frames, {duration:.2f}s")
            
            # Process frames
            all_tracks = {}
            frame_detections = []
            frame_number = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                timestamp = frame_number / fps if fps > 0 else frame_number
                
                # Detect sperm in current frame
                detections = self.detect_sperm(frame)
                
                # Update detections with frame info
                for det in detections:
                    det.frame_number = frame_number
                    det.timestamp = timestamp
                
                # Update tracker
                tracks = self.update_tracker(detections, frame)
                
                # Store results
                frame_detections.append({
                    'frame_number': frame_number,
                    'timestamp': timestamp,
                    'detection_count': len(detections),
                    'tracks': tracks
                })
                
                # Update track history
                for track in tracks:
                    track_id = track['track_id']
                    if track_id not in all_tracks:
                        all_tracks[track_id] = []
                    
                    # Convert bbox to center point
                    bbox = track['bbox']
                    x_center = (bbox[0] + bbox[2]) / 2
                    y_center = (bbox[1] + bbox[3]) / 2
                    
                    all_tracks[track_id].append({
                        'frame_number': frame_number,
                        'timestamp': timestamp,
                        'x': x_center,
                        'y': y_center,
                        'confidence': track['confidence']
                    })
                
                frame_number += 1
                
                # Log progress every 100 frames
                if frame_number % 100 == 0:
                    logger.info(f"Processed {frame_number}/{total_frames} frames")
            
            cap.release()
            
            # Prepare results
            results = {
                'video_properties': {
                    'width': width,
                    'height': height,
                    'fps': fps,
                    'total_frames': total_frames,
                    'duration': duration
                },
                'frame_detections': frame_detections,
                'tracks': all_tracks,
                'summary': {
                    'total_tracks': len(all_tracks),
                    'frames_processed': frame_number,
                    'average_detections_per_frame': np.mean([fd['detection_count'] for fd in frame_detections]) if frame_detections else 0
                }
            }
            
            logger.info(f"Video processing complete: {len(all_tracks)} tracks found")
            return results
            
        except Exception as e:
            logger.error(f"Video processing failed: {str(e)}")
            raise
    
    async def process_image(self, image_path: str) -> Dict[str, Any]:
        """Process single image for sperm detection"""
        if not self.is_initialized:
            raise RuntimeError("Model service not initialized")
        
        logger.info(f"Processing image: {image_path}")
        
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            height, width = image.shape[:2]
            
            # Detect sperm
            detections = self.detect_sperm(image)
            
            # Update detections with image info
            for i, det in enumerate(detections):
                det.id = i
                det.frame_number = 0
                det.timestamp = 0.0
            
            # Prepare results
            results = {
                'image_properties': {
                    'width': width,
                    'height': height
                },
                'detections': [det.dict() for det in detections],
                'summary': {
                    'total_detections': len(detections),
                    'detection_density': len(detections) / (width * height) * 1000000  # per megapixel
                }
            }
            
            logger.info(f"Image processing complete: {len(detections)} detections found")
            return results
            
        except Exception as e:
            logger.error(f"Image processing failed: {str(e)}")
            raise