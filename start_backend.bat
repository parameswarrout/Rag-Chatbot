@echo off
setlocal EnableDelayedExpansion

echo ====================================
echo RAG Chatbot Backend Startup Script
echo ====================================
echo.

:: Check if Ollama is installed
echo [1/4] Checking if Ollama is installed...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not installed or not in PATH!
    echo.
    echo Please install Ollama from https://ollama.com
    echo The backend API requires Ollama to be available.
    echo.
    pause
    exit /b 1
)
echo [OK] Ollama is installed.
echo.

:: Check if Ollama is already running
echo [2/4] Checking if Ollama is running...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama is already running.
    echo.
    goto check_venv
)

echo [INFO] Ollama is not running. Starting Ollama...
echo.

:: Start Ollama in a new window
start "Ollama Server" ollama serve

:: Wait for Ollama to start (max 30 seconds)
set count=0

:wait_loop
timeout /t 2 /nobreak >nul
curl -s http://localhost:11434/api/tags >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Ollama started successfully.
    echo.
    goto check_venv
)

set /a count+=1
if !count! lss 15 (
    echo Still waiting for Ollama to start... [!count!/15]
    goto wait_loop
)

:: If we reach here, Ollama failed to start
echo [ERROR] Ollama failed to start within 30 seconds!
echo Please check if there are any issues with Ollama.
echo.
pause
exit /b 1

:check_venv
:: Check if virtual environment exists
echo [3/4] Checking Python virtual environment...
if not exist ".venv\Scripts\activate.bat" (
    echo [WARNING] Virtual environment not found!
    echo Please create it first with: python -m venv .venv
    echo Then install requirements: pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo [OK] Virtual environment found.
echo.

:: Activate virtual environment and start backend
echo [4/4] Starting FastAPI backend...
echo.
echo ====================================
echo Backend server is starting...
echo API will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo ====================================
echo.

call .venv\Scripts\activate.bat
uvicorn app.main:app --reload

:: This line will only execute if the backend stops
echo.
echo Backend server stopped.
pause
