# Simple Healthcare Data Ingestion Example

This is a **very simple example** to help you understand how to extract JSON data and insert it into your Aurora MySQL database.

## 📁 Files in this Example

1. **`simple-mock-data.json`** - Sample healthcare data (3 services)
2. **`simple-ingest.go`** - Simple Go program to process the data
3. **`run-simple.sh`** - Script to build and run the program
4. **`README-Simple.md`** - This file

## 🎯 What This Example Does

1. **Reads** a simple JSON file with healthcare services
2. **Connects** to your Aurora MySQL database
3. **Creates** two tables: `insurance_services` and `negotiated_rates`
4. **Inserts** the data from the JSON file into the database
5. **Shows** the results

## 📊 Sample Data Structure

The JSON file contains 3 simple healthcare services:

```json
[
  {
    "negotiation_arrangement": "ffs",
    "name": "MRI Brain Scan",
    "billing_code_type": "CPT",
    "billing_code": "70551",
    "description": "Magnetic resonance imaging of the brain without contrast",
    "negotiated_rates": [
      {
        "provider_references": [1001, 1002],
        "negotiated_prices": [
          {
            "negotiated_type": "negotiated",
            "negotiated_rate": 850.00,
            "expiration_date": "2025-12-31",
            "service_code": ["01", "06"],
            "billing_class": "professional"
          }
        ]
      }
    ]
  }
]
```

## 🗄️ Database Tables Created

### `insurance_services` Table
- `id` - Primary key
- `negotiation_arrangement` - Type of arrangement
- `name` - Service name
- `billing_code_type` - CPT, HCPCS, etc.
- `billing_code_type_version` - Year version
- `billing_code` - Actual code (e.g., 70551)
- `description` - Service description
- `created_at` - Timestamp

### `negotiated_rates` Table
- `id` - Primary key
- `service_id` - Links to insurance_services
- `provider_references` - JSON array of provider IDs
- `negotiated_type` - "negotiated" or "percentage"
- `negotiated_rate` - Price amount
- `expiration_date` - When rate expires
- `service_codes` - JSON array of service codes
- `billing_class` - "professional" or "institutional"
- `created_at` - Timestamp

## 🚀 How to Run

### Prerequisites
1. **Go installed** on your system
2. **`.env` file** in the parent directory with your database credentials
3. **Network access** to your Aurora database

### Step 1: Check Your Setup
```bash
# Make sure you're in the scripts directory
cd scripts

# Check if Go is installed
go version

# Check if .env file exists in parent directory
ls ../.env
```

### Step 2: Run the Simple Example
```bash
# Option 1: Use the script (recommended)
./run-simple.sh

# Option 2: Build and run manually
go build -o simple-ingest simple-ingest.go
./simple-ingest
```

## 📋 Expected Output

```
🚀 Starting Simple Data Ingestion Tool
📋 Step 1: Loading environment variables...
🔧 Step 2: Setting up database configuration...
🔌 Step 3: Connecting to Aurora MySQL database...
✅ Database connection successful!
🏗️ Step 4: Creating database tables...
✅ Tables created successfully!
📁 Step 5: Reading JSON file...
✅ Read 1234 bytes from JSON file
🔍 Step 6: Parsing JSON data...
✅ Parsed 3 services from JSON
💾 Step 7: Inserting data into database...
   Processing service 1/3: MRI Brain Scan
   Processing service 2/3: CT Scan Chest
   Processing service 3/3: Blood Test - Complete
📊 Step 8: Showing results...
📊 Database Statistics:
   Services: 3
   Negotiated Rates: 3

📋 Sample Data:
   MRI Brain Scan (CPT: 70551) - $850.00 (professional)
   CT Scan Chest (CPT: 71250) - $1200.00 (institutional)
   Blood Test - Complete (CPT: 80048) - $150.00 (professional)
🎉 Data ingestion completed successfully!
```

## 🔧 Troubleshooting

### "Go is not installed"
```bash
# Install Go (macOS)
brew install go

# Install Go (Ubuntu/Debian)
sudo apt-get install golang-go

# Install Go (Windows)
# Download from https://golang.org/dl/
```

### "Failed to connect to database"
- Check your `.env` file has correct credentials
- Make sure your Aurora database is accessible from your network
- Verify the database endpoint is correct

### "Permission denied" on script
```bash
chmod +x run-simple.sh
```

## 🎓 What You Learned

1. **JSON Structure**: How healthcare data is structured
2. **Database Connection**: How to connect to Aurora MySQL
3. **Table Creation**: How to create tables with proper relationships
4. **Data Insertion**: How to insert JSON data into database tables
5. **Error Handling**: Basic error checking and reporting

## 🔄 Next Steps

Once this simple example works, you can:

1. **Try with larger files** using the full `ingest-data.go` tool
2. **Process compressed files** (.json.gz)
3. **Use multiple workers** for better performance
4. **Handle real healthcare data** from insurance companies

## 💡 Key Concepts

- **JSON Parsing**: Converting JSON text to Go structs
- **Database Transactions**: Ensuring data consistency
- **Foreign Keys**: Linking related data between tables
- **Connection Pooling**: Efficient database connections
- **Error Handling**: Graceful failure handling 