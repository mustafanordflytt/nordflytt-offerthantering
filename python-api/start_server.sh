#!/bin/bash
# Start the GPT RAG API server

echo "🚀 Starting Nordflytt GPT RAG API Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r ../requirements.txt

# Copy .env.example if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Supabase credentials!"
fi

# Run database migrations info
echo ""
echo "📊 Database Setup Required:"
echo "1. Run the SQL migrations in your Supabase SQL editor"
echo "2. Files are in python-api/migrations/"
echo ""

# Start the server
echo "Starting server on http://localhost:8000"
echo "API documentation available at http://localhost:8000/docs"
echo ""
python main.py