#!/bin/bash

echo "🔍 Checking Aurora Database Status..."
echo "====================================="

# Load environment variables
source ../.env

echo "📋 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

echo ""
echo "🔌 Testing DNS resolution..."

# Test DNS resolution
if nslookup $DB_HOST > /dev/null 2>&1; then
    echo "✅ DNS resolution successful"
else
    echo "❌ DNS resolution failed - database may still be creating"
    echo "   This is normal if the database is still in 'Configuring enhanced monitoring' status"
    exit 1
fi

echo ""
echo "🔌 Testing database connection..."

# Test database connection using Go
cd scripts
go run -c 'package main

import (
    "database/sql"
    "fmt"
    "log"
    "os"
    "github.com/joho/godotenv"
    _ "github.com/go-sql-driver/mysql"
)

func main() {
    godotenv.Load("../.env")
    
    host := os.Getenv("DB_HOST")
    port := os.Getenv("DB_PORT")
    user := os.Getenv("DB_USER")
    password := os.Getenv("DB_PASSWORD")
    database := os.Getenv("DB_NAME")
    
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
        user, password, host, port, database)
    
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal("❌ Failed to open database: ", err)
    }
    defer db.Close()
    
    if err := db.Ping(); err != nil {
        log.Fatal("❌ Failed to connect: ", err)
    }
    
    fmt.Println("✅ Database connection successful!")
    fmt.Println("🎉 Your Aurora database is ready!")
}
' 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database is ready! You can now run:"
    echo "   ./scripts/simple-ingest"
else
    echo ""
    echo "⏳ Database is still being configured..."
    echo "   Please wait a few more minutes and try again"
fi 