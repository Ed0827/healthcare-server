import dotenv from 'dotenv';
import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || 'your-aurora-endpoint.region.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'your-username',
  password: process.env.DB_PASSWORD || 'your-password',
  database: process.env.DB_NAME || 'healthcare_saver',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  connectionLimit: 10
};

// TypeScript interfaces for the JSON structure
interface NegotiatedPrice {
  negotiated_type: 'percentage' | 'negotiated';
  negotiated_rate: number;
  expiration_date: string;
  service_code: string[];
  billing_class: 'professional' | 'institutional';
}

interface NegotiatedRate {
  provider_references: number[];
  negotiated_prices: NegotiatedPrice[];
}

interface InsuranceService {
  negotiation_arrangement: string;
  name: string;
  billing_code_type: string;
  billing_code_type_version: string;
  billing_code: string;
  description: string;
  negotiated_rates: NegotiatedRate[];
}

class DataIngestionService {
  private connection: mysql.Connection | null = null;
  private pool: mysql.Pool | null = null;

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to Aurora MySQL database...');
      
      // Create connection pool for better performance
      this.pool = mysql.createPool(dbConfig);
      
      // Test connection
      const connection = await this.pool.getConnection();
      console.log('✅ Successfully connected to database');
      
      // Create tables if they don't exist
      await this.createTables(connection);
      
      connection.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async createTables(connection: mysql.Connection): Promise<void> {
    console.log('🏗️ Creating database tables...');

    const createServicesTable = `
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
    `;

    const createNegotiatedRatesTable = `
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
    `;

    try {
      await connection.execute(createServicesTable);
      await connection.execute(createNegotiatedRatesTable);
      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  async ingestDataFromFile(filePath: string): Promise<void> {
    try {
      console.log(`📁 Reading file: ${filePath}`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: InsuranceService[] = JSON.parse(fileContent);
      
      console.log(`📊 Found ${data.length} services to process`);
      
      // Process data in batches for better performance
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await this.processBatch(batch);
        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`);
      }
      
      console.log(`🎉 Successfully ingested ${data.length} services from ${filePath}`);
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}:`, error);
      throw error;
    }
  }

  async processBatch(services: InsuranceService[]): Promise<void> {
    if (!this.pool) {
      throw new Error('Database connection not established');
    }

    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const service of services) {
        // Insert service
        const serviceResult = await connection.execute(
          `INSERT INTO insurance_services 
           (negotiation_arrangement, name, billing_code_type, billing_code_type_version, billing_code, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            service.negotiation_arrangement,
            service.name,
            service.billing_code_type,
            service.billing_code_type_version,
            service.billing_code,
            service.description
          ]
        );

        const serviceId = (serviceResult[0] as any).insertId;

        // Insert negotiated rates
        for (const rate of service.negotiated_rates) {
          for (const price of rate.negotiated_prices) {
            await connection.execute(
              `INSERT INTO negotiated_rates 
               (service_id, provider_references, negotiated_type, negotiated_rate, expiration_date, service_codes, billing_class)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                serviceId,
                JSON.stringify(rate.provider_references),
                price.negotiated_type,
                price.negotiated_rate,
                price.expiration_date,
                JSON.stringify(price.service_code),
                price.billing_class
              ]
            );
          }
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async ingestDataFromDirectory(directoryPath: string): Promise<void> {
    try {
      console.log(`📂 Scanning directory: ${directoryPath}`);
      const files = await fs.readdir(directoryPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      console.log(`📄 Found ${jsonFiles.length} JSON files to process`);

      for (const file of jsonFiles) {
        const filePath = path.join(directoryPath, file);
        console.log(`\n🔄 Processing file: ${file}`);
        await this.ingestDataFromFile(filePath);
      }

      console.log(`\n🎉 Successfully processed all ${jsonFiles.length} files`);
    } catch (error) {
      console.error('❌ Error processing directory:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database connection not established');
    }

    const connection = await this.pool.getConnection();
    
    try {
      const [servicesCount] = await connection.execute('SELECT COUNT(*) as count FROM insurance_services');
      const [ratesCount] = await connection.execute('SELECT COUNT(*) as count FROM negotiated_rates');
      
      console.log('\n📊 Database Statistics:');
      console.log(`   Services: ${(servicesCount as any)[0].count}`);
      console.log(`   Negotiated Rates: ${(ratesCount as any)[0].count}`);
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
    } finally {
      connection.release();
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Main execution function
async function main() {
  const ingestionService = new DataIngestionService();
  
  try {
    // Connect to database
    await ingestionService.connect();

    // Get file/directory path from command line arguments
    const targetPath = process.argv[2];
    
    if (!targetPath) {
      console.error('❌ Please provide a file or directory path as an argument');
      console.log('Usage: npm run ingest <file-or-directory-path>');
      process.exit(1);
    }

    // Check if path exists
    const stats = await fs.stat(targetPath);
    
    if (stats.isFile()) {
      // Process single file
      await ingestionService.ingestDataFromFile(targetPath);
    } else if (stats.isDirectory()) {
      // Process directory
      await ingestionService.ingestDataFromDirectory(targetPath);
    } else {
      console.error('❌ Invalid path provided');
      process.exit(1);
    }

    // Show statistics
    await ingestionService.getStatistics();

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await ingestionService.disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DataIngestionService;
