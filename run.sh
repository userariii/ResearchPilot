#!/usr/bin/env bash
set -e

# Add workspace node to PATH if present
if [ -d "./.tools/node/bin" ]; then
    export PATH="$(pwd)/.tools/node/bin:$PATH"
fi

echo "=========================================================="
echo "          ResearchPilot - Autonomous Research Agent        "
echo "=========================================================="

# Check venv
if [ ! -d "./venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install -r backend/requirements.txt
fi

# Ensure frontend is built
if [ ! -d "./frontend/dist" ]; then
    echo "Building frontend Single Page Application..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

echo "Starting ResearchPilot full-stack server on http://localhost:8000 ..."
PYTHONPATH=. ./venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

