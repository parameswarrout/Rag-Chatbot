@echo off
setlocal

echo ====================================
echo Installing GPU-enabled PyTorch
echo ====================================
echo.

:: Check environment
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please create it first.
    pause
    exit /b 1
)

echo [1/3] Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo [2/3] Uninstalling current PyTorch (CPU version)...
pip uninstall -y torch torchvision torchaudio

echo.
echo [3/3] Installing PyTorch with CUDA 12.1 support...
:: Using the stable URL for Windows + CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

echo.
echo ====================================
echo Verifying Installation...
echo ====================================
python -c "import torch; print('Torch: ' + torch.__version__); print('CUDA Available: ' + str(torch.cuda.is_available())); print('Device: ' + (torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'))"

echo.
echo Done. You can now run start_backend.bat
pause
