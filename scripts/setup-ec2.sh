#!/bin/bash

echo "🚀 Setting up Healthcare Data Ingestion on EC2"
echo "=============================================="

# Configuration
GITHUB_REPO="your-username/healthcare-saver"  # Replace with your actual repo
DB_HOST="example.cluster-ckrc4kwgypo0.us-east-1.rds.amazonaws.com"
DB_USER="admin"
DB_PASSWORD="medreveal5"
DB_NAME="healthcare_saver"

echo "📋 Configuration:"
echo "   GitHub Repo: $GITHUB_REPO"
echo "   Database: $DB_HOST"
echo ""

# Step 1: Update system and install Go
echo "🔧 Step 1: Installing Go..."
sudo yum update -y
sudo yum install golang git -y

# Step 2: Clone the repository
echo "📥 Step 2: Cloning repository..."
cd ~
git clone https://github.com/$GITHUB_REPO.git
cd healthcare-saver

# Step 3: Create .env file
echo "⚙️ Step 3: Creating .env file..."
cat > .env << EOF
DB_HOST=$DB_HOST
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_SSL=true
EOF

# Step 4: Build and run the simple ingestion tool
echo "🔨 Step 4: Building Go tool..."
cd scripts
go mod tidy
go build -o simple-ingest simple-ingest.go

# Step 5: Run the ingestion
echo "🎯 Step 5: Running data ingestion..."
./simple-ingest

echo "�� Setup complete!" 