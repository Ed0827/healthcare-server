package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

// Simple data structures that match our JSON
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

func main() {
	fmt.Println("🚀 Starting Simple Data Ingestion Tool")

	// Step 1: Load environment variables
	fmt.Println("📋 Step 1: Loading environment variables...")
	if err := godotenv.Load(); err != nil {
		fmt.Printf("⚠️ Warning: Could not load .env file: %v\n", err)
	}

	// Step 2: Get database configuration
	fmt.Println("🔧 Step 2: Setting up database configuration...")
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "root")
	password := getEnv("DB_PASSWORD", "")
	database := getEnv("DB_NAME", "healthcare_saver")
	ssl := getEnv("DB_SSL", "false")

	if password == "" {
		log.Fatal("❌ Error: DB_PASSWORD environment variable is required")
	}

	// Step 3: Connect to database
	fmt.Println("🔌 Step 3: Connecting to Aurora MySQL database...")
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		user, password, host, port, database)

	if ssl == "true" {
		dsn += "&tls=true"
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("❌ Error: Failed to open database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("❌ Error: Failed to connect to database: %v", err)
	}
	fmt.Println("✅ Database connection successful!")

	// Step 4: Create tables
	fmt.Println("🏗️ Step 4: Creating database tables...")
	if err := createTables(db); err != nil {
		log.Fatalf("❌ Error: Failed to create tables: %v", err)
	}
	fmt.Println("✅ Tables created successfully!")

	// Step 5: Read JSON file
	fmt.Println("📁 Step 5: Reading JSON file...")
	jsonData, err := os.ReadFile("simple-mock-data.json")
	if err != nil {
		log.Fatalf("❌ Error: Failed to read JSON file: %v", err)
	}
	fmt.Printf("✅ Read %d bytes from JSON file\n", len(jsonData))

	// Step 6: Parse JSON data
	fmt.Println("🔍 Step 6: Parsing JSON data...")
	var services []InsuranceService
	if err := json.Unmarshal(jsonData, &services); err != nil {
		log.Fatalf("❌ Error: Failed to parse JSON: %v", err)
	}
	fmt.Printf("✅ Parsed %d services from JSON\n", len(services))

	// Step 7: Insert data into database
	fmt.Println("💾 Step 7: Inserting data into database...")
	for i, service := range services {
		fmt.Printf("   Processing service %d/%d: %s\n", i+1, len(services), service.Name)

		// Insert service
		serviceID, err := insertService(db, service)
		if err != nil {
			fmt.Printf("❌ Error inserting service %s: %v\n", service.Name, err)
			continue
		}

		// Insert negotiated rates
		for _, rate := range service.NegotiatedRates {
			for _, price := range rate.NegotiatedPrices {
				if err := insertNegotiatedRate(db, serviceID, rate, price); err != nil {
					fmt.Printf("❌ Error inserting rate for service %s: %v\n", service.Name, err)
				}
			}
		}
	}

	// Step 8: Show results
	fmt.Println("📊 Step 8: Showing results...")
	if err := showResults(db); err != nil {
		fmt.Printf("⚠️ Warning: Could not show results: %v\n", err)
	}

	fmt.Println("🎉 Data ingestion completed successfully!")
}

func createTables(db *sql.DB) error {
	// Create services table
	createServicesTable := `
	CREATE TABLE IF NOT EXISTS insurance_services (
		id INT AUTO_INCREMENT PRIMARY KEY,
		negotiation_arrangement VARCHAR(50) NOT NULL,
		name VARCHAR(500) NOT NULL,
		billing_code_type VARCHAR(20) NOT NULL,
		billing_code_type_version VARCHAR(20) NOT NULL,
		billing_code VARCHAR(50) NOT NULL,
		description TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	// Create negotiated rates table
	createRatesTable := `
	CREATE TABLE IF NOT EXISTS negotiated_rates (
		id INT AUTO_INCREMENT PRIMARY KEY,
		service_id INT NOT NULL,
		provider_references JSON NOT NULL,
		negotiated_type VARCHAR(20) NOT NULL,
		negotiated_rate DECIMAL(15,2) NOT NULL,
		expiration_date DATE NOT NULL,
		service_codes JSON NOT NULL,
		billing_class VARCHAR(20) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (service_id) REFERENCES insurance_services(id)
	);
	`

	if _, err := db.Exec(createServicesTable); err != nil {
		return fmt.Errorf("failed to create services table: %v", err)
	}

	if _, err := db.Exec(createRatesTable); err != nil {
		return fmt.Errorf("failed to create rates table: %v", err)
	}

	return nil
}

func insertService(db *sql.DB, service InsuranceService) (int64, error) {
	query := `
	INSERT INTO insurance_services 
	(negotiation_arrangement, name, billing_code_type, billing_code_type_version, billing_code, description)
	VALUES (?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		service.NegotiationArrangement,
		service.Name,
		service.BillingCodeType,
		service.BillingCodeTypeVersion,
		service.BillingCode,
		service.Description,
	)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

func insertNegotiatedRate(db *sql.DB, serviceID int64, rate NegotiatedRate, price NegotiatedPrice) error {
	// Convert arrays to JSON strings
	providerRefsJSON, _ := json.Marshal(rate.ProviderReferences)
	serviceCodesJSON, _ := json.Marshal(price.ServiceCode)

	query := `
	INSERT INTO negotiated_rates 
	(service_id, provider_references, negotiated_type, negotiated_rate, expiration_date, service_codes, billing_class)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err := db.Exec(query,
		serviceID,
		string(providerRefsJSON),
		price.NegotiatedType,
		price.NegotiatedRate,
		price.ExpirationDate,
		string(serviceCodesJSON),
		price.BillingClass,
	)

	return err
}

func showResults(db *sql.DB) error {
	// Count services
	var serviceCount int
	err := db.QueryRow("SELECT COUNT(*) FROM insurance_services").Scan(&serviceCount)
	if err != nil {
		return err
	}

	// Count rates
	var rateCount int
	err = db.QueryRow("SELECT COUNT(*) FROM negotiated_rates").Scan(&rateCount)
	if err != nil {
		return err
	}

	fmt.Printf("📊 Database Statistics:\n")
	fmt.Printf("   Services: %d\n", serviceCount)
	fmt.Printf("   Negotiated Rates: %d\n", rateCount)

	// Show sample data
	fmt.Printf("\n📋 Sample Data:\n")
	rows, err := db.Query(`
		SELECT s.name, s.billing_code, r.negotiated_rate, r.billing_class
		FROM insurance_services s
		JOIN negotiated_rates r ON s.id = r.service_id
		LIMIT 5
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var name, billingCode, billingClass string
		var rate float64
		if err := rows.Scan(&name, &billingCode, &rate, &billingClass); err != nil {
			return err
		}
		fmt.Printf("   %s (CPT: %s) - $%.2f (%s)\n", name, billingCode, rate, billingClass)
	}

	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
