// server/scripts/import-vietnamese-locations.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'roommanagement'
});

// Source API URLs
const PROVINCES_API_URL = 'https://provinces.open-api.vn/api/p/';
const DISTRICTS_API_URL = 'https://provinces.open-api.vn/api/d/';
const WARDS_API_URL = 'https://provinces.open-api.vn/api/w/';

/**
 * Fetch data from a given API endpoint
 * @param {string} url - The API URL to fetch from
 * @returns {Promise<Array>} - The fetched data
 */
async function fetchFromAPI(url) {
  try {
    console.log(`Fetching data from ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error.message);
    return [];
  }
}

/**
 * Create necessary database tables for Vietnamese locations
 */
async function createTables() {
  const client = await pool.connect();
  try {
    console.log('Creating necessary database tables...');
    await client.query(`
      -- Provinces/Cities Table
      CREATE TABLE IF NOT EXISTS vn_provinces (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        full_name VARCHAR(100),
        full_name_en VARCHAR(100),
        code_name VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Districts Table
      CREATE TABLE IF NOT EXISTS vn_districts (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        full_name VARCHAR(100),
        full_name_en VARCHAR(100),
        code_name VARCHAR(100),
        province_code VARCHAR(10) REFERENCES vn_provinces(code),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Wards Table
      CREATE TABLE IF NOT EXISTS vn_wards (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        full_name VARCHAR(100),
        full_name_en VARCHAR(100),
        code_name VARCHAR(100),
        district_code VARCHAR(10) REFERENCES vn_districts(code),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_districts_province_code ON vn_districts(province_code);
      CREATE INDEX IF NOT EXISTS idx_wards_district_code ON vn_wards(district_code);
    `);
    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Import provinces data into the database
 * @param {Array} provinces - The provinces data to import
 */
async function importProvinces(provinces) {
  if (!provinces || provinces.length === 0) {
    console.error('No provinces data to import.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log(`Importing ${provinces.length} provinces...`);

    // Prepare batch query for provinces
    const values = provinces.map(p =>
      `('${p.code}', '${escapeSql(p.name)}', '${escapeSql(p.name_en || '')}', '${escapeSql(p.full_name || p.name)}', '${escapeSql(p.full_name_en || '')}', '${escapeSql(p.code_name || '')}')`
    ).join(',');

    const query = `
      INSERT INTO vn_provinces (code, name, name_en, full_name, full_name_en, code_name)
      VALUES ${values}
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        full_name = EXCLUDED.full_name,
        full_name_en = EXCLUDED.full_name_en,
        code_name = EXCLUDED.code_name,
        updated_at = CURRENT_TIMESTAMP
    `;

    await client.query(query);
    console.log('Provinces imported successfully.');
  } catch (error) {
    console.error('Error importing provinces:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Import districts data into the database
 * @param {Array} districts - The districts data to import
 */
async function importDistricts(districts) {
  if (!districts || districts.length === 0) {
    console.error('No districts data to import.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log(`Importing ${districts.length} districts...`);

    // Process districts in batches to avoid query size limits
    const batchSize = 100;
    for (let i = 0; i < districts.length; i += batchSize) {
      const batch = districts.slice(i, i + batchSize);
      console.log(`Processing district batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(districts.length / batchSize)}`);

      const values = batch.map(d =>
        `('${d.code}', '${escapeSql(d.name)}', '${escapeSql(d.name_en || '')}', '${escapeSql(d.full_name || d.name)}', '${escapeSql(d.full_name_en || '')}', '${escapeSql(d.code_name || '')}', '${d.province_code}')`
      ).join(',');

      const query = `
        INSERT INTO vn_districts (code, name, name_en, full_name, full_name_en, code_name, province_code)
        VALUES ${values}
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          name_en = EXCLUDED.name_en,
          full_name = EXCLUDED.full_name,
          full_name_en = EXCLUDED.full_name_en,
          code_name = EXCLUDED.code_name,
          province_code = EXCLUDED.province_code,
          updated_at = CURRENT_TIMESTAMP
      `;

      await client.query(query);
    }

    console.log('Districts imported successfully.');
  } catch (error) {
    console.error('Error importing districts:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Import wards data into the database
 * @param {Array} wards - The wards data to import
 */
async function importWards(wards) {
  if (!wards || wards.length === 0) {
    console.error('No wards data to import.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log(`Importing ${wards.length} wards...`);

    // Process wards in smaller batches due to potentially large dataset
    const batchSize = 50;
    for (let i = 0; i < wards.length; i += batchSize) {
      const batch = wards.slice(i, i + batchSize);
      console.log(`Processing ward batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(wards.length / batchSize)}`);

      // Insert each ward separately to handle potential errors better
      for (const ward of batch) {
        try {
          const query = `
            INSERT INTO vn_wards (code, name, name_en, full_name, full_name_en, code_name, district_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (code) DO UPDATE SET
              name = EXCLUDED.name,
              name_en = EXCLUDED.name_en,
              full_name = EXCLUDED.full_name,
              full_name_en = EXCLUDED.full_name_en,
              code_name = EXCLUDED.code_name,
              district_code = EXCLUDED.district_code,
              updated_at = CURRENT_TIMESTAMP
          `;

          await client.query(query, [
            ward.code,
            ward.name,
            ward.name_en || '',
            ward.full_name || ward.name,
            ward.full_name_en || '',
            ward.code_name || '',
            ward.district_code
          ]);
        } catch (error) {
          console.error(`Error importing ward ${ward.code}:`, error.message);
          // Continue with next ward
        }
      }
    }

    console.log('Wards imported successfully.');
  } catch (error) {
    console.error('Error importing wards:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Escape SQL string values to prevent SQL injection
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

/**
 * Save fetched data to JSON files for backup
 * @param {string} dataType - The type of data (provinces, districts, wards)
 * @param {Array} data - The data to save
 */
function saveToFile(dataType, data) {
  try {
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
      fs.mkdirSync(path.join(__dirname, 'data'));
    }

    const filePath = path.join(__dirname, 'data', `${dataType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved ${dataType} data to ${filePath}`);
  } catch (error) {
    console.error(`Error saving ${dataType} data to file:`, error);
  }
}

/**
 * Main function to orchestrate the import process
 */
async function importVietnameseLocations() {
  try {
    console.log('Starting Vietnamese location data import...');

    // Create database tables
    await createTables();

    // Fetch and import provinces
    const provinces = await fetchFromAPI(PROVINCES_API_URL);
    if (provinces.length > 0) {
      saveToFile('provinces', provinces);
      await importProvinces(provinces);
    } else {
      throw new Error('Failed to fetch provinces data. Import aborted.');
    }

    // Fetch and import districts
    const districts = await fetchFromAPI(DISTRICTS_API_URL);
    if (districts.length > 0) {
      saveToFile('districts', districts);
      await importDistricts(districts);
    } else {
      console.warn('No districts data fetched. Skipping districts import.');
    }

    // Fetch and import wards
    const wards = await fetchFromAPI(WARDS_API_URL);
    if (wards.length > 0) {
      saveToFile('wards', wards);
      await importWards(wards);
    } else {
      console.warn('No wards data fetched. Skipping wards import.');
    }

    console.log('Vietnamese location data import completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
  } finally {
    // Close the database pool
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run the import function
importVietnameseLocations().catch(console.error);