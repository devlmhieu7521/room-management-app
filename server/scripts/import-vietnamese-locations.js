// server/scripts/import-vietnamese-locations.js
const fs = require('fs');
const path = require('path');
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

/**
 * Import location data from JSON files or use hardcoded data if files aren't available
 */
async function importLocationData() {
  try {
    console.log('Starting Vietnamese location data import...');

    // Check if the database tables exist, create them if needed
    await createTablesIfNotExist();

    // Define file paths
    const provincesFilePath = path.join(__dirname, 'data', 'provinces.json');
    const districtsFilePath = path.join(__dirname, 'data', 'districts.json');
    const wardsFilePath = path.join(__dirname, 'data', 'wards.json');

    // Data variables
    let provinces = [];
    let districts = [];
    let wards = [];

    // Try to read data from files
    try {
      if (fs.existsSync(provincesFilePath)) {
        // Read and parse the provinces file
        const provincesRawData = fs.readFileSync(provincesFilePath, 'utf8');
        provinces = JSON.parse(provincesRawData);
        console.log(`Read provinces from file: ${provinces.length} provinces found`);
      } else {
        console.warn(`Provinces file not found at: ${provincesFilePath}`);
        provinces = getHardcodedProvinces();
        console.log(`Using hardcoded provinces data: ${provinces.length} provinces`);
      }

      if (fs.existsSync(districtsFilePath)) {
        // Read and parse the districts file
        const districtsRawData = fs.readFileSync(districtsFilePath, 'utf8');
        districts = JSON.parse(districtsRawData);
        console.log(`Read districts from file: ${districts.length} districts found`);
      } else {
        console.warn(`Districts file not found at: ${districtsFilePath}`);
        districts = getHardcodedDistricts();
        console.log(`Using hardcoded districts data: ${districts.length} districts`);
      }

      if (fs.existsSync(wardsFilePath)) {
        // Read and parse the wards file
        const wardsRawData = fs.readFileSync(wardsFilePath, 'utf8');
        wards = JSON.parse(wardsRawData);
        console.log(`Read wards from file: ${wards.length} wards found`);
      } else {
        console.warn(`Wards file not found at: ${wardsFilePath}`);
        wards = getHardcodedWards();
        console.log(`Using hardcoded wards data: ${wards.length} wards`);
      }
    } catch (fileError) {
      console.error('Error reading or parsing data files:', fileError);
      console.log('Falling back to hardcoded data...');
      provinces = getHardcodedProvinces();
      districts = getHardcodedDistricts();
      wards = getHardcodedWards();
    }

    // Check if we have valid data
    if (!Array.isArray(provinces) || provinces.length === 0) {
      console.error('Provinces data is not a valid array or is empty');
      provinces = getHardcodedProvinces();
    }

    if (!Array.isArray(districts) || districts.length === 0) {
      console.error('Districts data is not a valid array or is empty');
      districts = getHardcodedDistricts();
    }

    if (!Array.isArray(wards) || wards.length === 0) {
      console.error('Wards data is not a valid array or is empty');
      wards = getHardcodedWards();
    }

    // Begin a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Import provinces
      console.log(`Importing ${provinces.length} provinces...`);
      for (const province of provinces) {
        await client.query(`
          INSERT INTO vn_provinces (code, name, full_name, code_name)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            full_name = EXCLUDED.full_name,
            code_name = EXCLUDED.code_name,
            updated_at = CURRENT_TIMESTAMP
        `, [
          province.code,
          province.name,
          province.full_name || province.name,
          province.code_name || slugify(province.name)
        ]);
      }
      console.log('Provinces imported successfully.');

      // Import districts
      console.log(`Importing ${districts.length} districts...`);
      for (const district of districts) {
        await client.query(`
          INSERT INTO vn_districts (code, name, full_name, code_name, province_code)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            full_name = EXCLUDED.full_name,
            code_name = EXCLUDED.code_name,
            province_code = EXCLUDED.province_code,
            updated_at = CURRENT_TIMESTAMP
        `, [
          district.code,
          district.name,
          district.full_name || district.name,
          district.code_name || slugify(district.name),
          district.province_code
        ]);
      }
      console.log('Districts imported successfully.');

      // Import wards
      console.log(`Importing ${wards.length} wards...`);
      const batchSize = 100;
      for (let i = 0; i < wards.length; i += batchSize) {
        const batch = wards.slice(i, i + batchSize);
        console.log(`Importing wards batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(wards.length / batchSize)}...`);

        for (const ward of batch) {
          await client.query(`
            INSERT INTO vn_wards (code, name, full_name, code_name, district_code)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (code) DO UPDATE SET
              name = EXCLUDED.name,
              full_name = EXCLUDED.full_name,
              code_name = EXCLUDED.code_name,
              district_code = EXCLUDED.district_code,
              updated_at = CURRENT_TIMESTAMP
          `, [
            ward.code,
            ward.name,
            ward.full_name || ward.name,
            ward.code_name || slugify(ward.name),
            ward.district_code
          ]);
        }
      }
      console.log('Wards imported successfully.');

      // Commit the transaction
      await client.query('COMMIT');
      console.log('Location data import completed successfully.');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error importing location data:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in import process:', error);
  } finally {
    await pool.end();
  }
}

/**
 * Create the database tables if they don't exist
 */
async function createTablesIfNotExist() {
  const client = await pool.connect();
  try {
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
        province_code VARCHAR(10) NOT NULL REFERENCES vn_provinces(code),
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
        district_code VARCHAR(10) NOT NULL REFERENCES vn_districts(code),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_districts_province_code ON vn_districts(province_code);
      CREATE INDEX IF NOT EXISTS idx_wards_district_code ON vn_wards(district_code);
    `);
    console.log('Database tables created/verified successfully.');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Simple slugify function to convert text to URL-friendly format
 * @param {string} text - Text to slugify
 * @returns {string} - Slugified text
 */
function slugify(text) {
  return text
    .normalize('NFD') // normalize diacritics
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[đ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
    .replace(/[\s-]+/g, '-') // replace spaces and hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // remove leading and trailing hyphens
}

/**
 * Get hardcoded provinces data
 * @returns {Array} - Array of province objects
 */
function getHardcodedProvinces() {
  return [
    { code: "01", name: "Hà Nội", full_name: "Thành phố Hà Nội", code_name: "ha-noi" },
    { code: "79", name: "Hồ Chí Minh", full_name: "Thành phố Hồ Chí Minh", code_name: "ho-chi-minh" },
    { code: "48", name: "Đà Nẵng", full_name: "Thành phố Đà Nẵng", code_name: "da-nang" },
    { code: "92", name: "Cần Thơ", full_name: "Thành phố Cần Thơ", code_name: "can-tho" },
    { code: "31", name: "Hải Phòng", full_name: "Thành phố Hải Phòng", code_name: "hai-phong" }
  ];
}

/**
 * Get hardcoded districts data
 * @returns {Array} - Array of district objects
 */
function getHardcodedDistricts() {
  return [
    // Hanoi districts
    { code: "001", name: "Ba Đình", full_name: "Quận Ba Đình", province_code: "01", code_name: "ba-dinh" },
    { code: "002", name: "Hoàn Kiếm", full_name: "Quận Hoàn Kiếm", province_code: "01", code_name: "hoan-kiem" },
    { code: "003", name: "Tây Hồ", full_name: "Quận Tây Hồ", province_code: "01", code_name: "tay-ho" },

    // Ho Chi Minh districts
    { code: "760", name: "Quận 1", full_name: "Quận 1", province_code: "79", code_name: "quan-1" },
    { code: "761", name: "Quận 12", full_name: "Quận 12", province_code: "79", code_name: "quan-12" },
    { code: "762", name: "Thủ Đức", full_name: "Thành phố Thủ Đức", province_code: "79", code_name: "thu-duc" },

    // Da Nang districts
    { code: "490", name: "Liên Chiểu", full_name: "Quận Liên Chiểu", province_code: "48", code_name: "lien-chieu" },
    { code: "491", name: "Thanh Khê", full_name: "Quận Thanh Khê", province_code: "48", code_name: "thanh-khe" }
  ];
}

/**
 * Get hardcoded wards data
 * @returns {Array} - Array of ward objects
 */
function getHardcodedWards() {
  return [
    // Some wards in District 1, HCMC
    { code: "26734", name: "Bến Nghé", full_name: "Phường Bến Nghé", district_code: "760", code_name: "ben-nghe" },
    { code: "26737", name: "Bến Thành", full_name: "Phường Bến Thành", district_code: "760", code_name: "ben-thanh" },

    // Some wards in Ba Dinh, Hanoi
    { code: "00001", name: "Phúc Xá", full_name: "Phường Phúc Xá", district_code: "001", code_name: "phuc-xa" },
    { code: "00004", name: "Trúc Bạch", full_name: "Phường Trúc Bạch", district_code: "001", code_name: "truc-bach" }
  ];
}

// Run the import function
importLocationData().catch(console.error);