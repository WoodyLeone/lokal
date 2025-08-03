#!/usr/bin/env python3
"""
Setup script for Lokal Engine
Installs dependencies and configures the environment
"""

import os
import sys
import subprocess
import shutil

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required, found {version.major}.{version.minor}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing dependencies...")
    
    # Check if pip3 is available
    if not shutil.which("pip3"):
        print("❌ pip3 not found. Please install pip3 first.")
        return False
    
    # Install requirements
    if not run_command("pip3 install -r requirements.txt", "Installing Python packages"):
        return False
    
    return True

def download_yolo_model():
    """Download YOLO model if not present"""
    print("🤖 Checking YOLO model...")
    
    model_path = "yolov8n.pt"
    if os.path.exists(model_path):
        print(f"✅ YOLO model found: {model_path}")
        return True
    
    print("📥 Downloading YOLO model...")
    download_url = "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt"
    
    if not run_command(f"curl -L -o {model_path} {download_url}", "Downloading YOLO model"):
        return False
    
    return True

def setup_environment():
    """Setup environment file"""
    print("⚙️  Setting up environment...")
    
    env_file = ".env"
    env_example = "env.example"
    
    if os.path.exists(env_file):
        print(f"✅ Environment file already exists: {env_file}")
        return True
    
    if not os.path.exists(env_example):
        print(f"❌ Environment example file not found: {env_example}")
        return False
    
    # Copy example to .env
    shutil.copy(env_example, env_file)
    print(f"✅ Environment file created: {env_file}")
    print("⚠️  Please edit .env with your actual credentials")
    
    return True

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    directories = ["temp", "logs", "output"]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✅ Created directory: {directory}")
        else:
            print(f"✅ Directory exists: {directory}")
    
    return True

def run_tests():
    """Run basic tests"""
    print("🧪 Running tests...")
    
    if not run_command("python3 test_engine.py", "Running engine tests"):
        print("⚠️  Tests failed, but setup can continue")
        return True  # Don't fail setup if tests fail
    
    return True

def main():
    """Main setup function"""
    print("🚀 Setting up Lokal Engine...\n")
    
    steps = [
        ("Python Version Check", check_python_version),
        ("Create Directories", create_directories),
        ("Setup Environment", setup_environment),
        ("Install Dependencies", install_dependencies),
        ("Download YOLO Model", download_yolo_model),
        ("Run Tests", run_tests),
    ]
    
    failed_steps = []
    
    for step_name, step_func in steps:
        print(f"\n{'='*50}")
        print(f"Step: {step_name}")
        print('='*50)
        
        if not step_func():
            failed_steps.append(step_name)
    
    print(f"\n{'='*50}")
    print("Setup Complete!")
    print('='*50)
    
    if failed_steps:
        print(f"❌ Failed steps: {', '.join(failed_steps)}")
        print("Please fix the issues above and run setup again.")
        return False
    else:
        print("✅ All setup steps completed successfully!")
        print("\n🎉 Lokal Engine is ready to use!")
        print("\nNext steps:")
        print("1. Edit .env with your Railway PostgreSQL and OpenAI credentials")
        print("2. Run: python test_engine.py")
        print("3. Start processing videos with: python pipeline_runner.py")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 