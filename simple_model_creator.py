#!/usr/bin/env python3
"""
Simple Model Creator - Creates a dummy TensorFlow Lite model for testing
This creates a placeholder model file without requiring heavy dependencies
"""

import os
import json
import struct

def create_dummy_tflite_model(output_path):
    """Create a dummy TensorFlow Lite model file for testing purposes"""
    
    # TensorFlow Lite magic number and basic structure
    # This is a minimal valid TFLite file structure
    tflite_data = bytearray()
    
    # TFLite file identifier
    tflite_data.extend(b'TFL3')
    
    # Add some dummy data to make it look like a real model
    # This won't be functional but will pass basic file checks
    dummy_model_data = b'\x00' * 1024 * 50  # 50KB dummy model
    
    # Simple TFLite-like structure
    tflite_data.extend(struct.pack('<I', len(dummy_model_data)))  # Length
    tflite_data.extend(dummy_model_data)
    
    # Write to file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(tflite_data)
    
    print(f"Created dummy TFLite model: {output_path} ({len(tflite_data)} bytes)")

def create_model_files():
    """Create all necessary model files for the app"""
    
    # Create directories
    models_dir = "sperm-analyzer-mobile/www/assets/models"
    os.makedirs(models_dir, exist_ok=True)
    
    # Create dummy TFLite model
    model_path = os.path.join(models_dir, "sperm_detector.tflite")
    create_dummy_tflite_model(model_path)
    
    # Model metadata (already exists)
    metadata_path = os.path.join(models_dir, "model_metadata.json")
    if os.path.exists(metadata_path):
        print(f"Model metadata already exists: {metadata_path}")
    
    # Model info (already exists)
    info_path = os.path.join(models_dir, "model_info.json")
    if os.path.exists(info_path):
        print(f"Model info already exists: {info_path}")
    
    print("\nModel files created successfully!")
    print("Note: This is a dummy model for testing. In production, use a real trained model.")

if __name__ == "__main__":
    create_model_files()