#!/usr/bin/env python3
"""
Sperm Analyzer AI - Application Launcher
Starts both backend and frontend services with proper monitoring
"""

import os
import sys
import time
import signal
import subprocess
import requests
from pathlib import Path
import threading
from typing import Optional

class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    BLUE = '\033[0;34m'
    YELLOW = '\033[1;33m'
    NC = '\033[0m'  # No Color

class ServiceManager:
    def __init__(self):
        self.backend_process: Optional[subprocess.Popen] = None
        self.frontend_process: Optional[subprocess.Popen] = None
        self.project_root = Path(__file__).parent
        self.logs_dir = self.project_root / "logs"
        self.logs_dir.mkdir(exist_ok=True)
        
    def print_colored(self, message: str, color: str = Colors.NC):
        """Print colored message to console"""
        print(f"{color}{message}{Colors.NC}")
        
    def check_prerequisites(self) -> bool:
        """Check if all required tools are installed"""
        self.print_colored("📋 Checking prerequisites...", Colors.BLUE)
        
        required_tools = {
            'python3': 'Python 3',
            'pip': 'pip',
            'node': 'Node.js'
        }
        
        for tool, name in required_tools.items():
            if not self.command_exists(tool):
                self.print_colored(f"✗ {name} is not installed", Colors.RED)
                return False
                
        # Check for package manager
        if self.command_exists('bun'):
            self.package_manager = 'bun'
        elif self.command_exists('npm'):
            self.package_manager = 'npm'
        else:
            self.print_colored("✗ Neither bun nor npm is installed", Colors.RED)
            return False
            
        self.print_colored("✓ All prerequisites are installed", Colors.GREEN)
        return True
        
    def command_exists(self, command: str) -> bool:
        """Check if a command exists in PATH"""
        try:
            subprocess.run([command, '--version'], 
                         capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
            
    def port_in_use(self, port: int) -> bool:
        """Check if a port is in use"""
        try:
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(('localhost', port)) == 0
        except:
            return False
            
    def wait_for_service(self, url: str, service_name: str, max_attempts: int = 30) -> bool:
        """Wait for a service to be ready"""
        self.print_colored(f"Waiting for {service_name} to be ready...", Colors.YELLOW)
        
        for attempt in range(max_attempts):
            try:
                response = requests.get(url, timeout=1)
                if response.status_code == 200:
                    self.print_colored(f"✓ {service_name} is ready!", Colors.GREEN)
                    return True
            except requests.RequestException:
                pass
                
            print(".", end="", flush=True)
            time.sleep(1)
            
        print()  # New line after dots
        self.print_colored(f"✗ {service_name} failed to start after {max_attempts} seconds", Colors.RED)
        return False
        
    def start_backend(self) -> bool:
        """Start the FastAPI backend"""
        self.print_colored("🚀 Starting backend server...", Colors.BLUE)
        
        backend_dir = self.project_root / "backend"
        if not backend_dir.exists():
            self.print_colored("✗ Backend directory not found", Colors.RED)
            return False
            
        # Check virtual environment
        venv_dir = backend_dir / "venv"
        if not venv_dir.exists():
            self.print_colored("Creating Python virtual environment...", Colors.YELLOW)
            try:
                subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], 
                             check=True, cwd=backend_dir)
            except subprocess.CalledProcessError:
                self.print_colored("✗ Failed to create virtual environment", Colors.RED)
                return False
                
        # Determine Python executable in venv
        if os.name == 'nt':  # Windows
            python_exe = venv_dir / "Scripts" / "python.exe"
            pip_exe = venv_dir / "Scripts" / "pip.exe"
        else:  # Unix-like
            python_exe = venv_dir / "bin" / "python"
            pip_exe = venv_dir / "bin" / "pip"
            
        # Install dependencies
        self.print_colored("Installing backend dependencies...", Colors.YELLOW)
        try:
            subprocess.run([str(pip_exe), "install", "-r", "requirements.txt"], 
                         check=True, cwd=backend_dir, 
                         capture_output=True)
        except subprocess.CalledProcessError as e:
            self.print_colored(f"✗ Failed to install dependencies: {e}", Colors.RED)
            return False
            
        # Start backend server
        backend_log = self.logs_dir / "backend.log"
        try:
            with open(backend_log, 'w') as log_file:
                self.backend_process = subprocess.Popen([
                    str(python_exe), "-m", "uvicorn", "main:app",
                    "--host", "0.0.0.0", "--port", "8000", "--reload"
                ], cwd=backend_dir, stdout=log_file, stderr=log_file)
                
            self.print_colored(f"✓ Backend server started (PID: {self.backend_process.pid})", Colors.GREEN)
            
            # Wait for backend to be ready
            if self.wait_for_service("http://localhost:8000/api/v1/status", "Backend API"):
                return True
            else:
                self.stop_backend()
                return False
                
        except Exception as e:
            self.print_colored(f"✗ Failed to start backend: {e}", Colors.RED)
            return False
            
    def start_frontend(self) -> bool:
        """Start the React frontend"""
        self.print_colored("🎨 Starting frontend application...", Colors.BLUE)
        
        frontend_dir = self.project_root / "frontend"
        if not frontend_dir.exists():
            self.print_colored("✗ Frontend directory not found", Colors.RED)
            return False
            
        # Install dependencies
        self.print_colored("Installing frontend dependencies...", Colors.YELLOW)
        try:
            subprocess.run([self.package_manager, "install"], 
                         check=True, cwd=frontend_dir, 
                         capture_output=True)
        except subprocess.CalledProcessError as e:
            self.print_colored(f"✗ Failed to install frontend dependencies: {e}", Colors.RED)
            return False
            
        # Start frontend server
        frontend_log = self.logs_dir / "frontend.log"
        try:
            with open(frontend_log, 'w') as log_file:
                if self.package_manager == 'bun':
                    cmd = ["bun", "dev", "--host", "0.0.0.0", "--port", "5173"]
                else:
                    cmd = ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
                    
                self.frontend_process = subprocess.Popen(
                    cmd, cwd=frontend_dir, 
                    stdout=log_file, stderr=log_file
                )
                
            self.print_colored(f"✓ Frontend server started (PID: {self.frontend_process.pid})", Colors.GREEN)
            
            # Wait for frontend to be ready
            if self.wait_for_service("http://localhost:5173", "Frontend"):
                return True
            else:
                self.stop_frontend()
                return False
                
        except Exception as e:
            self.print_colored(f"✗ Failed to start frontend: {e}", Colors.RED)
            return False
            
    def stop_backend(self):
        """Stop the backend service"""
        if self.backend_process:
            self.backend_process.terminate()
            try:
                self.backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()
            self.backend_process = None
            
    def stop_frontend(self):
        """Stop the frontend service"""
        if self.frontend_process:
            self.frontend_process.terminate()
            try:
                self.frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.frontend_process.kill()
            self.frontend_process = None
            
    def stop_all(self):
        """Stop all services"""
        self.print_colored("🛑 Stopping all services...", Colors.YELLOW)
        self.stop_backend()
        self.stop_frontend()
        
    def monitor_services(self):
        """Monitor running services"""
        self.print_colored("🔍 Monitoring services... (Press Ctrl+C to stop)", Colors.BLUE)
        
        try:
            while True:
                # Check backend
                if self.backend_process and self.backend_process.poll() is not None:
                    self.print_colored("✗ Backend service stopped unexpectedly", Colors.RED)
                    self.stop_all()
                    return False
                    
                # Check frontend
                if self.frontend_process and self.frontend_process.poll() is not None:
                    self.print_colored("✗ Frontend service stopped unexpectedly", Colors.RED)
                    self.stop_all()
                    return False
                    
                time.sleep(5)
                
        except KeyboardInterrupt:
            self.print_colored("\\n🛑 Received stop signal", Colors.YELLOW)
            self.stop_all()
            return True
            
    def display_success_info(self):
        """Display success information"""
        self.print_colored("""
🎉 Sperm Analyzer AI is now running!

📱 Frontend (Mobile App): http://localhost:5173
🔧 Backend API:          http://localhost:8000
📖 API Documentation:    http://localhost:8000/docs
📊 Health Check:         http://localhost:8000/api/v1/status

📋 Logs:
   Backend:  logs/backend.log
   Frontend: logs/frontend.log

🛑 Press Ctrl+C to stop all services
        """, Colors.GREEN)
        
    def run(self):
        """Main run method"""
        self.print_colored("🧬 Starting Sperm Analyzer AI Application...", Colors.BLUE)
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, lambda s, f: self.stop_all())
        signal.signal(signal.SIGTERM, lambda s, f: self.stop_all())
        
        try:
            # Check prerequisites
            if not self.check_prerequisites():
                return 1
                
            # Check ports
            if self.port_in_use(8000):
                self.print_colored("⚠ Port 8000 is already in use. Backend might already be running.", Colors.YELLOW)
                
            if self.port_in_use(5173):
                self.print_colored("⚠ Port 5173 is already in use. Frontend might already be running.", Colors.YELLOW)
                
            # Start services
            if not self.start_backend():
                return 1
                
            if not self.start_frontend():
                self.stop_backend()
                return 1
                
            # Display success info
            self.display_success_info()
            
            # Monitor services
            self.monitor_services()
            
            return 0
            
        except Exception as e:
            self.print_colored(f"✗ Unexpected error: {e}", Colors.RED)
            self.stop_all()
            return 1

if __name__ == "__main__":
    manager = ServiceManager()
    exit_code = manager.run()
    sys.exit(exit_code)