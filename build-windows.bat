@echo off
echo Setting up environment for building Symphony...

REM Set Python path (adjust this path to where your Python is installed)
set PYTHON=python
set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311;C:\Python311

echo Cleaning previous build...
cargo clean

echo Building project...
cargo build

echo Done!
pause 