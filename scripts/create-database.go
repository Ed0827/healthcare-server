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
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using system environment variables")
	}

	// Get database connection details
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	database := os.Getenv("DB_NAME")

	if host == "" || port == "" || user == "" || password == "" || database == "" {
		log.Fatal("Missing required environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME")
	}

	// Connect to MySQL server (without specifying database)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/?parseTime=true&tls=false", user, password, host, port)

	log.Printf("Connecting to MySQL server at %s:%s...", host, port)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to MySQL server: %v", err)
	}
	defer db.Close()

	// Test the connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping MySQL server: %v", err)
	}

	log.Printf("Successfully connected to MySQL server")

	// Create the database
	log.Printf("Creating database '%s'...", database)

	createDBQuery := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", database)

	_, err = db.Exec(createDBQuery)
	if err != nil {
		log.Fatalf("Failed to create database: %v", err)
	}

	log.Printf("Database '%s' created successfully!", database)

	// Verify the database exists by connecting to it
	dsnWithDB := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&tls=false", user, password, host, port, database)

	dbWithDB, err := sql.Open("mysql", dsnWithDB)
	if err != nil {
		log.Fatalf("Failed to connect to created database: %v", err)
	}
	defer dbWithDB.Close()

	if err := dbWithDB.Ping(); err != nil {
		log.Fatalf("Failed to ping created database: %v", err)
	}

	log.Printf("Successfully connected to database '%s'", database)
	log.Printf("Database creation completed successfully!")
}
