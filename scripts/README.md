# Data Ingestion Script

This script allows you to ingest healthcare insurance data from JSON files into your Aurora MySQL database.

## Setup

1. **Environment Variables**: Create a `.env` file in the root directory with your database credentials:

```env
DB_HOST=your-aurora-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=healthcare_saver
DB_SSL=true
```

2. **Install Dependencies**: Make sure you have all dependencies installed:
```bash
npm install
```

## Usage

### Process a Single File
```bash
npm run ingest /path/to/your/data.json
```

### Process All JSON Files in a Directory
```bash
npm run ingest /path/to/your/data/directory
```

## Database Schema

The script creates two tables:

### `insurance_services`
- `id` - Primary key
- `negotiation_arrangement` - Type of negotiation arrangement
- `name` - Service name
- `billing_code_type` - Type of billing code (e.g., CPT)
- `billing_code_type_version` - Version of billing code type
- `billing_code` - Actual billing code
- `description` - Service description
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `negotiated_rates`
- `id` - Primary key
- `service_id` - Foreign key to insurance_services
- `provider_references` - JSON array of provider references
- `negotiated_type` - Type of negotiation (percentage/negotiated)
- `negotiated_rate` - The negotiated rate amount
- `expiration_date` - When the rate expires
- `service_codes` - JSON array of service codes
- `billing_class` - Billing class (professional/institutional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Features

- **Batch Processing**: Processes data in batches of 100 records for better performance
- **Transaction Safety**: Uses database transactions to ensure data integrity
- **Error Handling**: Comprehensive error handling with rollback on failures
- **Progress Tracking**: Shows progress as files are processed
- **Statistics**: Displays database statistics after ingestion
- **Connection Pooling**: Uses connection pooling for better performance

## Example JSON Structure

The script expects JSON files with this structure:

```json
[
  {
    "negotiation_arrangement": "ffs",
    "name": "RH IG, FULL-DOSE, IM",
    "billing_code_type": "CPT",
    "billing_code_type_version": "2022",
    "billing_code": "90384",
    "description": "RH IG, FULL-DOSE, IM",
    "negotiated_rates": [
      {
        "provider_references": [367840],
        "negotiated_prices": [
          {
            "negotiated_type": "percentage",
            "negotiated_rate": 64.00,
            "expiration_date": "9999-12-31",
            "service_code": ["01", "06", "08"],
            "billing_class": "professional"
          }
        ]
      }
    ]
  }
]
```

## Troubleshooting

1. **Connection Issues**: Make sure your Aurora endpoint is accessible and credentials are correct
2. **SSL Issues**: Set `DB_SSL=false` if you're not using SSL
3. **Large Files**: The script processes data in batches, so large files should work fine
4. **Memory Issues**: If you encounter memory issues with very large files, consider splitting them into smaller chunks 