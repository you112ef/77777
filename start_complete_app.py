#!/usr/bin/env python3
"""
Sperm Analyzer AI - Complete Application Starter
Starts all components and ensures proper integration
"""

import os
import sys
import time
import signal
import subprocess
import threading
import requests
from pathlib import Path
import json

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class SpermAnalyzerAppManager:
    def __init__(self):
        self.processes = {}
        self.project_root = Path(__file__).parent
        self.backend_port = 8000
        self.frontend_port = 5173
        self.mobile_port = 3000
        
    def print_colored(self, message, color=Colors.ENDC):
        print(f"{color}{message}{Colors.ENDC}")
        
    def print_header(self, title):
        self.print_colored(f"\n{'='*60}", Colors.CYAN)
        self.print_colored(f"  {title}", Colors.BOLD + Colors.CYAN)
        self.print_colored(f"{'='*60}", Colors.CYAN)
        
    def check_prerequisites(self):
        """Check if all required tools are installed"""
        self.print_header("🔍 CHECKING PREREQUISITES")
        
        requirements = {
            'Python 3.8+': self.check_python,
            'Node.js': self.check_node,
            'Package Manager (npm/bun)': self.check_package_manager,
            'Python Dependencies': self.check_python_deps,
        }
        
        all_good = True
        for name, check_func in requirements.items():
            if check_func():
                self.print_colored(f"✅ {name}: OK", Colors.GREEN)
            else:
                self.print_colored(f"❌ {name}: MISSING", Colors.FAIL)
                all_good = False
        
        if not all_good:
            self.print_colored("\n⚠️  Some prerequisites are missing. Please install them first.", Colors.WARNING)
            return False
            
        self.print_colored("\n🎉 All prerequisites are satisfied!", Colors.GREEN)
        return True
    
    def check_python(self):
        try:
            result = subprocess.run([sys.executable, '--version'], 
                                  capture_output=True, text=True)
            version = result.stdout.strip()
            return "Python 3." in version and int(version.split('.')[1]) >= 8
        except:
            return False
    
    def check_node(self):
        try:
            subprocess.run(['node', '--version'], 
                          capture_output=True, check=True)
            return True
        except:
            return False
    
    def check_package_manager(self):
        for manager in ['bun', 'npm']:
            try:
                subprocess.run([manager, '--version'], 
                              capture_output=True, check=True)
                self.package_manager = manager
                return True
            except:
                continue
        return False
    
    def check_python_deps(self):
        try:
            import numpy, cv2, tensorflow, ultralytics
            return True
        except ImportError:
            return False
    
    def install_python_dependencies(self):
        """Install Python dependencies for the backend"""
        self.print_header("📦 INSTALLING PYTHON DEPENDENCIES")
        
        backend_dir = self.project_root / "sperm-analyzer-ai"
        requirements_file = backend_dir / "requirements.txt"
        
        if not requirements_file.exists():
            self.print_colored(f"❌ Requirements file not found: {requirements_file}", Colors.FAIL)
            return False
        
        try:
            self.print_colored("Installing Python packages...", Colors.BLUE)
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
            ], check=True, cwd=backend_dir)
            
            self.print_colored("✅ Python dependencies installed successfully!", Colors.GREEN)
            return True
        except subprocess.CalledProcessError as e:
            self.print_colored(f"❌ Failed to install Python dependencies: {e}", Colors.FAIL)
            return False
    
    def install_frontend_dependencies(self):
        """Install frontend dependencies"""
        self.print_header("🎨 INSTALLING FRONTEND DEPENDENCIES")
        
        frontend_dir = self.project_root / "sperm-analyzer-frontend"
        
        if not frontend_dir.exists():
            self.print_colored(f"❌ Frontend directory not found: {frontend_dir}", Colors.FAIL)
            return False
        
        try:
            self.print_colored(f"Installing frontend packages with {self.package_manager}...", Colors.BLUE)
            subprocess.run([
                self.package_manager, "install"
            ], check=True, cwd=frontend_dir)
            
            self.print_colored("✅ Frontend dependencies installed successfully!", Colors.GREEN)
            return True
        except subprocess.CalledProcessError as e:
            self.print_colored(f"❌ Failed to install frontend dependencies: {e}", Colors.FAIL)
            return False
    
    def install_mobile_dependencies(self):
        """Install mobile app dependencies"""
        self.print_header("📱 INSTALLING MOBILE DEPENDENCIES")
        
        mobile_dir = self.project_root / "sperm-analyzer-mobile"
        
        if not mobile_dir.exists():
            self.print_colored(f"❌ Mobile directory not found: {mobile_dir}", Colors.FAIL)
            return False
        
        try:
            self.print_colored("Installing mobile app packages...", Colors.BLUE)
            subprocess.run([
                "npm", "install"
            ], check=True, cwd=mobile_dir)
            
            self.print_colored("✅ Mobile dependencies installed successfully!", Colors.GREEN)
            return True
        except subprocess.CalledProcessError as e:
            self.print_colored(f"❌ Failed to install mobile dependencies: {e}", Colors.FAIL)
            return False
    
    def start_backend(self):
        """Start the FastAPI backend"""
        self.print_header("🚀 STARTING AI BACKEND")
        
        backend_dir = self.project_root / "sperm-analyzer-ai" / "backend"
        
        if not (backend_dir / "main.py").exists():
            self.print_colored(f"❌ Backend main.py not found in {backend_dir}", Colors.FAIL)
            return False
        
        try:
            env = os.environ.copy()
            env['PYTHONPATH'] = str(backend_dir)
            
            self.processes['backend'] = subprocess.Popen([
                sys.executable, "-m", "uvicorn", "main:app",
                "--host", "0.0.0.0",
                "--port", str(self.backend_port),
                "--reload"
            ], cwd=backend_dir, env=env)
            
            self.print_colored(f"Backend starting on port {self.backend_port}...", Colors.BLUE)
            
            # Wait for backend to be ready
            if self.wait_for_service(f"http://localhost:{self.backend_port}/api/v1/status", "Backend API"):
                self.print_colored("✅ Backend is running!", Colors.GREEN)
                return True
            else:
                return False
                
        except Exception as e:
            self.print_colored(f"❌ Failed to start backend: {e}", Colors.FAIL)
            return False
    
    def start_frontend(self):
        """Start the React frontend"""
        self.print_header("🎨 STARTING REACT FRONTEND")
        
        frontend_dir = self.project_root / "sperm-analyzer-frontend"
        
        if not (frontend_dir / "package.json").exists():
            self.print_colored(f"❌ Frontend package.json not found in {frontend_dir}", Colors.FAIL)
            return False
        
        try:
            if self.package_manager == 'bun':
                cmd = ["bun", "dev", "--host", "0.0.0.0", "--port", str(self.frontend_port)]
            else:
                cmd = ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", str(self.frontend_port)]
            
            self.processes['frontend'] = subprocess.Popen(
                cmd, cwd=frontend_dir
            )
            
            self.print_colored(f"Frontend starting on port {self.frontend_port}...", Colors.BLUE)
            
            # Wait for frontend to be ready
            if self.wait_for_service(f"http://localhost:{self.frontend_port}", "Frontend"):
                self.print_colored("✅ Frontend is running!", Colors.GREEN)
                return True
            else:
                return False
                
        except Exception as e:
            self.print_colored(f"❌ Failed to start frontend: {e}", Colors.FAIL)
            return False
    
    def start_mobile(self):
        """Start the mobile app server"""
        self.print_header("📱 STARTING MOBILE APP")
        
        mobile_dir = self.project_root / "sperm-analyzer-mobile"
        
        if not (mobile_dir / "www").exists():
            self.print_colored(f"❌ Mobile www directory not found in {mobile_dir}", Colors.FAIL)
            return False
        
        try:
            self.processes['mobile'] = subprocess.Popen([
                "npm", "run", "serve"
            ], cwd=mobile_dir)
            
            self.print_colored(f"Mobile app starting on port {self.mobile_port}...", Colors.BLUE)
            
            # Wait for mobile to be ready
            if self.wait_for_service(f"http://localhost:{self.mobile_port}", "Mobile App"):
                self.print_colored("✅ Mobile app is running!", Colors.GREEN)
                return True
            else:
                return False
                
        except Exception as e:
            self.print_colored(f"❌ Failed to start mobile app: {e}", Colors.FAIL)
            return False
    
    def wait_for_service(self, url, service_name, max_attempts=30):
        """Wait for a service to be ready"""
        for attempt in range(max_attempts):
            try:
                response = requests.get(url, timeout=2)
                if response.status_code < 500:  # Accept any non-server-error response
                    return True
            except requests.RequestException:
                pass
            
            print(".", end="", flush=True)
            time.sleep(1)
        
        print()  # New line
        self.print_colored(f"❌ {service_name} failed to start after {max_attempts} seconds", Colors.FAIL)
        return False
    
    def display_success_info(self):
        """Display success information and URLs"""
        self.print_header("🎉 SPERM ANALYZER AI IS RUNNING!")
        
        print(f"""
{Colors.GREEN}🌐 Application URLs:{Colors.ENDC}
┌─────────────────────────────────────────────────────────┐
│ {Colors.CYAN}📱 Mobile App:{Colors.ENDC}      http://localhost:{self.mobile_port}              │
│ {Colors.CYAN}🎨 React Frontend:{Colors.ENDC}  http://localhost:{self.frontend_port}              │
│ {Colors.CYAN}🤖 AI Backend:{Colors.ENDC}      http://localhost:{self.backend_port}              │
│ {Colors.CYAN}📚 API Docs:{Colors.ENDC}        http://localhost:{self.backend_port}/docs        │
└─────────────────────────────────────────────────────────┘

{Colors.GREEN}🔧 Features Available:{Colors.ENDC}
• ✅ Real YOLOv8-based sperm detection
• ✅ Live camera and file upload analysis  
• ✅ Interactive charts and graphs
• ✅ Arabic RTL interface support
• ✅ Export functionality (CSV, charts)
• ✅ Mobile-responsive design

{Colors.WARNING}📝 Usage Instructions:{Colors.ENDC}
1. Open the Mobile App URL for the main interface
2. Use "تحليل عينة" to analyze sperm samples
3. View results in "الرسوم البيانية" (Charts)
4. Export data using the export buttons

{Colors.BLUE}🛑 Press Ctrl+C to stop all services{Colors.ENDC}
        """)
    
    def monitor_services(self):
        """Monitor running services"""
        try:
            while True:
                # Check if any process has died
                for name, process in self.processes.items():
                    if process.poll() is not None:
                        self.print_colored(f"\n❌ {name.capitalize()} service stopped unexpectedly", Colors.FAIL)
                        self.stop_all_services()
                        return False
                
                time.sleep(5)
                
        except KeyboardInterrupt:
            self.print_colored(f"\n\n{Colors.WARNING}🛑 Stopping all services...{Colors.ENDC}")
            self.stop_all_services()
            return True
    
    def stop_all_services(self):
        """Stop all running services"""
        for name, process in self.processes.items():
            if process.poll() is None:  # Process is still running
                self.print_colored(f"Stopping {name}...", Colors.BLUE)
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
        
        self.processes.clear()
        self.print_colored("✅ All services stopped.", Colors.GREEN)
    
    def run(self):
        """Main run method"""
        self.print_header("🧬 SPERM ANALYZER AI - COMPLETE SETUP")
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, lambda s, f: self.stop_all_services())
        signal.signal(signal.SIGTERM, lambda s, f: self.stop_all_services())
        
        try:
            # Check prerequisites
            if not self.check_prerequisites():
                # Try to install missing dependencies
                self.install_python_dependencies()
                self.install_frontend_dependencies()
                self.install_mobile_dependencies()
            
            # Start all services
            if not self.start_backend():
                return 1
            
            if not self.start_frontend():
                self.stop_all_services()
                return 1
            
            if not self.start_mobile():
                self.stop_all_services()
                return 1
            
            # Display success info
            self.display_success_info()
            
            # Monitor services
            success = self.monitor_services()
            return 0 if success else 1
            
        except Exception as e:
            self.print_colored(f"❌ Unexpected error: {e}", Colors.FAIL)
            self.stop_all_services()
            return 1

if __name__ == "__main__":
    manager = SpermAnalyzerAppManager()
    exit_code = manager.run()
    sys.exit(exit_code)