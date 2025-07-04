# 🧬 Sperm Analyzer AI

## Complete AI-Powered Sperm Analysis Application

A comprehensive, production-ready application for automated sperm analysis using computer vision and deep learning. Built with modern technologies including YOLOv8, FastAPI, React, and advanced CASA (Computer Assisted Sperm Analysis) metrics.

![Sperm Analyzer AI](https://img.shields.io/badge/Status-Production%20Ready-green) ![AI Model](https://img.shields.io/badge/AI-YOLOv8%20%2B%20DeepSORT-blue) ![Backend](https://img.shields.io/badge/Backend-FastAPI-009688) ![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB)

## 🌟 Features

### 🤖 AI-Powered Analysis
- **YOLOv8 Object Detection**: Real-time sperm detection with high accuracy
- **DeepSORT Tracking**: Advanced multi-object tracking for motion analysis
- **CASA Metrics**: Complete implementation of WHO-standard sperm analysis metrics
- **Real-time Processing**: Live camera feed analysis and batch video processing

### 📊 Advanced Analytics
- **VCL, VSL, VAP**: Velocity measurements (Curvilinear, Straight Line, Average Path)
- **LIN, STR, WOB**: Kinematic parameters (Linearity, Straightness, Wobble)
- **ALH, BCF**: Head displacement and beat frequency analysis
- **Motility Classification**: Progressive, non-progressive, and immotile classification
- **WHO Standards Compliance**: Automatic assessment against WHO 2021 guidelines

### 📱 Mobile-First Design
- **PWA Support**: Install as native app on mobile devices
- **Camera Integration**: Real-time video capture and photo analysis
- **Responsive UI**: Optimized for all screen sizes
- **Offline Capability**: Local processing and storage
- **Arabic/RTL Support**: Full internationalization

### 📈 Data Visualization
- **Interactive Charts**: Real-time graphs and statistics
- **Export Options**: PDF, CSV, JSON export capabilities
- **Trend Analysis**: Historical data tracking and comparison
- **Detailed Reports**: Comprehensive analysis reports

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Models     │
│   (React PWA)   │◄──►│   (FastAPI)     │◄──►│   (YOLOv8)      │
│                 │    │                 │    │                 │
│ • Camera UI     │    │ • Analysis API  │    │ • Detection     │
│ • File Upload   │    │ • Model Service │    │ • Tracking      │
│ • Results View  │    │ • CASA Metrics  │    │ • Training      │
│ • Graph Display │    │ • Export Tools  │    │ • Inference     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** with pip
- **Node.js 20+** with npm/bun
- **CUDA-compatible GPU** (optional, for faster processing)
- **Modern browser** with camera access

### 1. Backend Setup

```bash
# Clone and navigate to backend
cd sperm-analyzer-ai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
bun install

# Start development server
bun dev
```

The frontend will be available at `http://localhost:5173`

### 3. AI Model Setup

```bash
# Navigate to backend and run model training
cd ../backend

# Train the YOLOv8 model (optional - will use pre-trained model otherwise)
python train_model.py --synthetic --num-synthetic 1000

# Process microscopy videos for training data (if you have real data)
python utils/data_preparation.py --video your_video.mp4 --output training_data
```

## 📁 Project Structure

```
sperm-analyzer-ai/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Main application entry
│   ├── routes/                # API endpoints
│   │   ├── analysis.py        # Analysis endpoints
│   │   ├── export.py          # Export functionality
│   │   └── health.py          # Health checks
│   ├── services/              # Business logic
│   │   ├── model_service.py   # AI model management
│   │   ├── analysis_service.py # Analysis workflow
│   │   ├── casa_calculator.py # CASA metrics
│   │   └── export_service.py  # Report generation
│   ├── models/                # Data models
│   ├── utils/                 # Utilities
│   ├── train_model.py         # Model training script
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Container setup
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── pages/             # Application pages
│   │   │   ├── HomePage.tsx   # Main dashboard
│   │   │   ├── AnalyzePage.tsx # Analysis interface
│   │   │   ├── ResultsPage.tsx # Results viewer
│   │   │   ├── GraphsPage.tsx # Data visualization
│   │   │   └── SettingsPage.tsx # Settings
│   │   ├── components/        # UI components
│   │   ├── backend/           # API integration
│   │   └── App.tsx           # Main application
│   ├── public/               # Static assets
│   └── package.json          # Dependencies
└── README.md                 # This file
```

## 🔧 Configuration

### Backend Configuration

Create `.env` file in the backend directory:

```env
# Environment
ENV=development
LOG_LEVEL=INFO

# Model Configuration
MODEL_PATH=models/sperm_yolov8.pt
CONFIDENCE_THRESHOLD=0.25
IOU_THRESHOLD=0.45

# Processing
MAX_FILE_SIZE=100MB
UPLOAD_DIR=uploads
RESULTS_DIR=results
EXPORTS_DIR=exports

# Database (optional)
DATABASE_URL=sqlite:///./sperm_analyzer.db
```

### Frontend Configuration

The frontend automatically connects to the backend API. For production deployment, update the API_BASE_URL in `src/backend/api.ts`.

## 🧪 API Usage

### Start Analysis

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -F "file=@sample_video.mp4" \
  -F "analysis_type=video"
```

### Check Status

```bash
curl "http://localhost:8000/api/v1/analysis/{analysis_id}/status"
```

### Get Results

```bash
curl "http://localhost:8000/api/v1/analysis/{analysis_id}/results"
```

### Export Data

```bash
# Export as CSV
curl "http://localhost:8000/api/v1/export/{analysis_id}/csv" -o results.csv

# Export as PDF report
curl "http://localhost:8000/api/v1/export/{analysis_id}/report?format=pdf" -o report.pdf
```

## 📊 CASA Metrics Explained

### Velocity Parameters
- **VCL (Curvilinear Velocity)**: Total distance traveled divided by time
- **VSL (Straight Line Velocity)**: Straight-line distance divided by time  
- **VAP (Average Path Velocity)**: Smoothed path distance divided by time

### Kinematic Parameters
- **LIN (Linearity)**: VSL/VCL × 100 - measures path straightness
- **STR (Straightness)**: VSL/VAP × 100 - measures trajectory deviation
- **WOB (Wobble)**: VAP/VCL × 100 - measures path oscillation
- **ALH (Amplitude Lateral Head)**: Mean lateral head displacement
- **BCF (Beat Cross Frequency)**: Frequency of head crossing the average path

### WHO Reference Values (2021)
- **Concentration**: ≥15 million/ml
- **Progressive Motility**: ≥32%
- **Total Motility**: ≥40%
- **Normal Forms**: ≥4%

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Containers

```bash
# Build backend
docker build -t sperm-analyzer-backend ./backend

# Run backend
docker run -p 8000:8000 sperm-analyzer-backend

# Build frontend (for production)
docker build -t sperm-analyzer-frontend ./frontend
```

## 📱 Mobile App (APK Build)

### Using Capacitor

```bash
# Install Capacitor
npm install -g @capacitor/cli

# Add Android platform
cd frontend
npx cap add android

# Build and sync
npm run build
npx cap sync

# Open in Android Studio
npx cap open android
```

### Alternative: PWA Installation

The app can be installed directly from the browser as a Progressive Web App:

1. Visit the deployed app URL
2. Click "Add to Home Screen" in browser menu
3. The app will install as a native-like application

## 🔬 Model Training

### Training with Custom Data

```bash
# Prepare your dataset
python utils/data_preparation.py --video your_videos/ --output dataset/

# Train the model
python train_model.py --epochs 100 --batch 16 --data dataset/dataset.yaml

# Validate the model
python train_model.py --validate
```

### Dataset Format

Follow YOLO format for training data:

```
dataset/
├── train/
│   ├── images/
│   └── labels/
├── val/
│   ├── images/
│   └── labels/
└── dataset.yaml
```

## 🧪 Testing

### Backend Tests

```bash
# Run backend tests
cd backend
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

### Frontend Tests

```bash
# Run frontend tests
cd frontend
bun test

# Run with coverage
bun test --coverage
```

## 🚀 Production Deployment

### Backend (FastAPI)

```bash
# Using Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Using Docker
docker run -p 8000:8000 sperm-analyzer-backend
```

### Frontend (React)

```bash
# Build for production
bun run build

# Serve static files
serve -s dist -l 3000

# Or deploy to Vercel/Netlify
vercel deploy
```

## 🔧 Troubleshooting

### Common Issues

1. **Camera not working**: Ensure HTTPS or localhost for camera access
2. **Model not loading**: Check CUDA availability and model path
3. **Analysis fails**: Verify file format and size limits
4. **API connection issues**: Check backend URL and CORS settings

### Debug Mode

```bash
# Backend debug mode
uvicorn main:app --reload --log-level debug

# Frontend debug mode
VITE_DEBUG=true bun dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for all React components
- Add tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WHO Laboratory Manual** for reference standards
- **Ultralytics YOLOv8** for object detection capabilities
- **DeepSORT** for multi-object tracking
- **FastAPI** for modern API development
- **React** and **shadcn/ui** for beautiful UI components

## 📞 Support

For support and questions:

- 📧 Email: support@sperm-analyzer-ai.com
- 📖 Documentation: [docs.sperm-analyzer-ai.com](https://docs.sperm-analyzer-ai.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/sperm-analyzer-ai/issues)

---

**Built with ❤️ for advancing reproductive health research and clinical applications.**