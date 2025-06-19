package main

import (
	"bufio"
	"compress/gzip"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

// Database configuration
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
	SSL      string
}

// Insurance data structures
type NegotiatedPrice struct {
	NegotiatedType string   `json:"negotiated_type"`
	NegotiatedRate float64  `json:"negotiated_rate"`
	ExpirationDate string   `json:"expiration_date"`
	ServiceCode    []string `json:"service_code"`
	BillingClass   string   `json:"billing_class"`
}

type NegotiatedRate struct {
	ProviderReferences []int             `json:"provider_references"`
	NegotiatedPrices   []NegotiatedPrice `json:"negotiated_prices"`
}

type InsuranceService struct {
	NegotiationArrangement string           `json:"negotiation_arrangement"`
	Name                   string           `json:"name"`
	BillingCodeType        string           `json:"billing_code_type"`
	BillingCodeTypeVersion string           `json:"billing_code_type_version"`
	BillingCode            string           `json:"billing_code"`
	Description            string           `json:"description"`
	NegotiatedRates        []NegotiatedRate `json:"negotiated_rates"`
}

// DataIngestionService handles database operations
type DataIngestionService struct {
	db     *sql.DB
	config *DBConfig
}

// NewDataIngestionService creates a new ingestion service
func NewDataIngestionService(config *DBConfig) (*DataIngestionService, error) {
	// Build connection string
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&multiStatements=true",
		config.User, config.Password, config.Host, config.Port, config.Database)

	if config.SSL == "true" {
		dsn += "&tls=true"
	}

	// Connect to database
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	return &DataIngestionService{
		db:     db,
		config: config,
	}, nil
}

// CreateTables creates the necessary database tables
func (s *DataIngestionService) CreateTables() error {
	log.Println("🏗️ Creating database tables...")

	createServicesTable := `
	CREATE TABLE IF NOT EXISTS insurance_services (
		id INT AUTO_INCREMENT PRIMARY KEY,
		negotiation_arrangement VARCHAR(50) NOT NULL,
		name VARCHAR(500) NOT NULL,
		billing_code_type VARCHAR(20) NOT NULL,
		billing_code_type_version VARCHAR(20) NOT NULL,
		billing_code VARCHAR(50) NOT NULL,
		description TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_billing_code (billing_code),
		INDEX idx_name (name),
		INDEX idx_negotiation_arrangement (negotiation_arrangement)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`

	createNegotiatedRatesTable := `
	CREATE TABLE IF NOT EXISTS negotiated_rates (
		id INT AUTO_INCREMENT PRIMARY KEY,
		service_id INT NOT NULL,
		provider_references JSON NOT NULL,
		negotiated_type ENUM('percentage', 'negotiated') NOT NULL,
		negotiated_rate DECIMAL(15,2) NOT NULL,
		expiration_date DATE NOT NULL,
		service_codes JSON NOT NULL,
		billing_class ENUM('professional', 'institutional') NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (service_id) REFERENCES insurance_services(id) ON DELETE CASCADE,
		INDEX idx_service_id (service_id),
		INDEX idx_negotiated_type (negotiated_type),
		INDEX idx_billing_class (billing_class),
		INDEX idx_expiration_date (expiration_date)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`

	if _, err := s.db.Exec(createServicesTable); err != nil {
		return fmt.Errorf("failed to create services table: %v", err)
	}

	if _, err := s.db.Exec(createNegotiatedRatesTable); err != nil {
		return fmt.Errorf("failed to create negotiated rates table: %v", err)
	}

	log.Println("✅ Database tables created successfully")
	return nil
}

// ProcessFile processes a single file (supports both .json and .json.gz)
func (s *DataIngestionService) ProcessFile(filePath string, workers int) error {
	log.Printf("📁 Processing file: %s", filePath)

	// Open file
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	// Create reader based on file extension
	var reader io.Reader = file
	if strings.HasSuffix(filePath, ".gz") {
		gzReader, err := gzip.NewReader(file)
		if err != nil {
			return fmt.Errorf("failed to create gzip reader: %v", err)
		}
		defer gzReader.Close()
		reader = gzReader
	}

	// Create scanner for line-by-line processing
	scanner := bufio.NewScanner(reader)

	// Increase buffer size for large lines
	const maxCapacity = 1024 * 1024 // 1MB
	buf := make([]byte, maxCapacity)
	scanner.Buffer(buf, maxCapacity)

	// Channel for processing services
	serviceChan := make(chan InsuranceService, workers*2)

	// Wait group for workers
	var wg sync.WaitGroup

	// Start workers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go s.worker(&wg, serviceChan)
	}

	// Process file line by line
	lineCount := 0
	processedCount := 0

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		lineCount++

		// Try to parse as JSON array or single object
		var services []InsuranceService

		// First, try to parse as array
		if err := json.Unmarshal([]byte(line), &services); err != nil {
			// If that fails, try as single object
			var service InsuranceService
			if err := json.Unmarshal([]byte(line), &service); err != nil {
				log.Printf("⚠️ Failed to parse line %d: %v", lineCount, err)
				continue
			}
			services = []InsuranceService{service}
		}

		// Send services to workers
		for _, service := range services {
			serviceChan <- service
			processedCount++
		}

		// Log progress every 1000 lines
		if lineCount%1000 == 0 {
			log.Printf("📊 Processed %d lines, %d services", lineCount, processedCount)
		}
	}

	// Close channel and wait for workers
	close(serviceChan)
	wg.Wait()

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading file: %v", err)
	}

	log.Printf("🎉 Successfully processed %d lines, %d services from %s", lineCount, processedCount, filePath)
	return nil
}

// worker processes services from the channel
func (s *DataIngestionService) worker(wg *sync.WaitGroup, serviceChan <-chan InsuranceService) {
	defer wg.Done()

	// Prepare statements
	insertServiceStmt, err := s.db.Prepare(`
		INSERT INTO insurance_services 
		(negotiation_arrangement, name, billing_code_type, billing_code_type_version, billing_code, description)
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		log.Printf("❌ Failed to prepare service statement: %v", err)
		return
	}
	defer insertServiceStmt.Close()

	insertRateStmt, err := s.db.Prepare(`
		INSERT INTO negotiated_rates 
		(service_id, provider_references, negotiated_type, negotiated_rate, expiration_date, service_codes, billing_class)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		log.Printf("❌ Failed to prepare rate statement: %v", err)
		return
	}
	defer insertRateStmt.Close()

	// Process services
	for service := range serviceChan {
		if err := s.processService(insertServiceStmt, insertRateStmt, service); err != nil {
			log.Printf("❌ Failed to process service %s: %v", service.Name, err)
		}
	}
}

// processService inserts a single service and its rates
func (s *DataIngestionService) processService(serviceStmt, rateStmt *sql.Stmt, service InsuranceService) error {
	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Insert service
	result, err := tx.Stmt(serviceStmt).Exec(
		service.NegotiationArrangement,
		service.Name,
		service.BillingCodeType,
		service.BillingCodeTypeVersion,
		service.BillingCode,
		service.Description,
	)
	if err != nil {
		return fmt.Errorf("failed to insert service: %v", err)
	}

	serviceID, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get service ID: %v", err)
	}

	// Insert negotiated rates
	for _, rate := range service.NegotiatedRates {
		providerRefsJSON, err := json.Marshal(rate.ProviderReferences)
		if err != nil {
			return fmt.Errorf("failed to marshal provider references: %v", err)
		}

		for _, price := range rate.NegotiatedPrices {
			serviceCodesJSON, err := json.Marshal(price.ServiceCode)
			if err != nil {
				return fmt.Errorf("failed to marshal service codes: %v", err)
			}

			_, err = tx.Stmt(rateStmt).Exec(
				serviceID,
				string(providerRefsJSON),
				price.NegotiatedType,
				price.NegotiatedRate,
				price.ExpirationDate,
				string(serviceCodesJSON),
				price.BillingClass,
			)
			if err != nil {
				return fmt.Errorf("failed to insert rate: %v", err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

// GetStatistics returns database statistics
func (s *DataIngestionService) GetStatistics() error {
	var servicesCount, ratesCount int

	err := s.db.QueryRow("SELECT COUNT(*) FROM insurance_services").Scan(&servicesCount)
	if err != nil {
		return fmt.Errorf("failed to get services count: %v", err)
	}

	err = s.db.QueryRow("SELECT COUNT(*) FROM negotiated_rates").Scan(&ratesCount)
	if err != nil {
		return fmt.Errorf("failed to get rates count: %v", err)
	}

	log.Printf("\n📊 Database Statistics:")
	log.Printf("   Services: %d", servicesCount)
	log.Printf("   Negotiated Rates: %d", ratesCount)

	return nil
}

// Close closes the database connection
func (s *DataIngestionService) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

// loadConfig loads configuration from environment variables
func loadConfig() (*DBConfig, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️ Warning: Could not load .env file: %v", err)
	}

	config := &DBConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "3306"),
		User:     getEnv("DB_USER", "root"),
		Password: getEnv("DB_PASSWORD", ""),
		Database: getEnv("DB_NAME", "healthcare_saver"),
		SSL:      getEnv("DB_SSL", "false"),
	}

	if config.Password == "" {
		return nil, fmt.Errorf("DB_PASSWORD environment variable is required")
	}

	return config, nil
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	// Parse command line flags
	var (
		workers = flag.Int("workers", 10, "Number of worker goroutines")
		file    = flag.String("file", "", "File to process (.json or .json.gz)")
		dir     = flag.String("dir", "", "Directory to process (all .json files)")
	)
	flag.Parse()

	// Load configuration
	config, err := loadConfig()
	if err != nil {
		log.Fatalf("❌ Failed to load configuration: %v", err)
	}

	// Create ingestion service
	service, err := NewDataIngestionService(config)
	if err != nil {
		log.Fatalf("❌ Failed to create ingestion service: %v", err)
	}
	defer service.Close()

	// Create tables
	if err := service.CreateTables(); err != nil {
		log.Fatalf("❌ Failed to create tables: %v", err)
	}

	// Process file or directory
	if *file != "" {
		if err := service.ProcessFile(*file, *workers); err != nil {
			log.Fatalf("❌ Failed to process file: %v", err)
		}
	} else if *dir != "" {
		files, err := filepath.Glob(filepath.Join(*dir, "*.json*"))
		if err != nil {
			log.Fatalf("❌ Failed to find files: %v", err)
		}

		for _, file := range files {
			log.Printf("🔄 Processing file: %s", file)
			if err := service.ProcessFile(file, *workers); err != nil {
				log.Printf("❌ Failed to process file %s: %v", file, err)
			}
		}
	} else {
		log.Fatal("❌ Please specify either -file or -dir flag")
	}

	// Show statistics
	if err := service.GetStatistics(); err != nil {
		log.Printf("⚠️ Failed to get statistics: %v", err)
	}

	log.Println("🎉 Data ingestion completed successfully!")
}
