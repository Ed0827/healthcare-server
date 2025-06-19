#!/bin/bash

echo "🚀 Simple Healthcare Data Ingestion Tool"
echo "========================================"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Error: Go is not installed. Please install Go first."
    exit 1
fi

echo "✅ Go is installed"

# Build the simple ingestion tool
echo "🔨 Building simple ingestion tool..."
go build -o simple-ingest simple-ingest.go

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build the tool"
    exit 1
fi

echo "✅ Tool built successfully"

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found in parent directory"
    echo "Please create a .env file with your database credentials:"
    echo "DB_HOST=your-aurora-endpoint"
    echo "DB_PORT=3306"
    echo "DB_USER=admin"
    echo "DB_PASSWORD=your-password"
    echo "DB_NAME=healthcare_saver"
    echo "DB_SSL=true"
    exit 1
fi

echo "✅ .env file found"

# Check if JSON file exists
if [ ! -f "simple-mock-data.json" ]; then
    echo "❌ Error: simple-mock-data.json not found"
    exit 1
fi

echo "✅ JSON data file found"

# Run the tool
echo "🎯 Running simple ingestion tool..."
./simple-ingest

echo "🎉 Done!" 