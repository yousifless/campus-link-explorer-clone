@echo off
echo Starting DistilGPT-2 Icebreaker Generator Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH! Please install Python 3.8 or later.
    goto :end
)

REM Display Python version
python --version
echo.

REM Check for required packages
echo Checking for required packages...
python -c "import transformers, torch, flask, flask_cors" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing required packages...
    pip install transformers torch flask flask-cors
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install required packages. Please install them manually.
        echo pip install transformers torch flask flask-cors
        goto :end
    )
)

REM Create cache directory if it doesn't exist
if not exist "model_cache" (
    echo Creating model cache directory...
    mkdir model_cache
)

REM Start the server
echo.
echo Starting server on http://localhost:5000
echo.
echo The model will be downloaded on first use (approximately 300MB)
echo This may take a few minutes the first time...
echo.
echo Press Ctrl+C to stop the server
echo.
python transformers_generator.py --serve --port 5000

:end
pause 