"""
Sperm Analyzer AI - FastAPI Backend
Real-time sperm analysis using YOLOv8 and CASA metrics
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import asyncio
from pathlib import Path

from routes import analysis, health, export
from utils.logger import setup_logger
from services.model_service import ModelService

# Initialize FastAPI app
app = FastAPI(
    title="Sperm Analyzer AI",
    description="Real-time sperm analysis API using advanced computer vision",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/exports", StaticFiles(directory="exports"), name="exports")

# Setup logger
logger = setup_logger()

# Initialize model service on startup
model_service = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global model_service
    logger.info("Starting Sperm Analyzer AI Backend...")
    
    # Initialize model service
    model_service = ModelService()
    await model_service.initialize()
    
    # Store model service in app state
    app.state.model_service = model_service
    
    logger.info("Backend startup complete!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Sperm Analyzer AI Backend...")

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(analysis.router, prefix="/api/v1", tags=["analysis"])
app.include_router(export.router, prefix="/api/v1", tags=["export"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Sperm Analyzer AI Backend", 
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )