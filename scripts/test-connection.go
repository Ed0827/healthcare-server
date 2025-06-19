package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️ Warning: Could not load .env file: %v", err)
	}

	// Get database configuration
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "root")
	password := getEnv("DB_PASSWORD", "")
	database := getEnv("DB_NAME", "healthcare_saver")
	ssl := getEnv("DB_SSL", "false")

	if password == "" {
		log.Fatal("❌ DB_PASSWORD environment variable is required")
	}

	// Build connection string
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		user, password, host, port, database)

	if ssl == "true" {
		dsn += "&tls=true"
	}

	log.Printf("🔌 Testing connection to: %s:%s", host, port)
	log.Printf("📊 Database: %s", database)
	log.Printf("👤 User: %s", user)

	// Test connection
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("❌ Failed to open database: %v", err)
	}
	defer db.Close()

	// Test ping
	if err := db.Ping(); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	log.Println("✅ Database connection successful!")

	// Test basic query
	var version string
	err = db.QueryRow("SELECT VERSION()").Scan(&version)
	if err != nil {
		log.Fatalf("❌ Failed to query database: %v", err)
	}

	log.Printf("📋 MySQL Version: %s", version)

	// Test if database exists
	var dbName string
	err = db.QueryRow("SELECT DATABASE()").Scan(&dbName)
	if err != nil {
		log.Fatalf("❌ Failed to get current database: %v", err)
	}

	log.Printf("🗄️ Current Database: %s", dbName)

	log.Println("🎉 All connection tests passed!")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
