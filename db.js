const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initialCars = [
  {
    brand: "Toyota",
    model: "Fortuner 2.8 4x2",
    category: "SUV",
    year: 2020,
    km: "45,000 km",
    fuel: "Diesel",
    transmission: "Automatic",
    ownership: "1st Owner",
    image: "public/images/fortuner.png"
  },
  {
    brand: "Toyota",
    model: "Glanza V",
    category: "Hatchback",
    year: 2022,
    km: "15,000 km",
    fuel: "Petrol",
    transmission: "Automatic",
    ownership: "1st Owner",
    image: "public/images/glanza.png"
  },
  {
    brand: "Toyota",
    model: "Innova Crysta 2.4 GX",
    category: "MUV",
    year: 2020,
    km: "65,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    ownership: "2nd Owner",
    image: "public/images/innova.png"
  },
  {
    brand: "Tata",
    model: "Harrier XZ+",
    category: "SUV",
    year: 2022,
    km: "22,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    ownership: "1st Owner",
    image: "public/images/harrier.png"
  },
  {
    brand: "Hyundai",
    model: "Creta SX",
    category: "SUV",
    year: 2021,
    km: "34,200 km",
    fuel: "Petrol",
    transmission: "Manual",
    ownership: "1st Owner",
    image: "public/images/creta.png"
  },
  {
    brand: "Hyundai",
    model: "Verna SX(O)",
    category: "Sedan",
    year: 2021,
    km: "32,000 km",
    fuel: "Petrol",
    transmission: "Manual",
    ownership: "2nd Owner",
    image: "public/images/verna.png"
  },
  {
    brand: "Honda",
    model: "City V MT",
    category: "Sedan",
    year: 2019,
    km: "41,000 km",
    fuel: "Petrol",
    transmission: "Manual",
    ownership: "1st Owner",
    image: "public/images/city.png"
  },
  {
    brand: "Mahindra",
    model: "XUV500 W7",
    category: "SUV",
    year: 2018,
    km: "72,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    ownership: "2nd Owner",
    image: "public/images/xuv500.png"
  }
];

async function initDB() {
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        km VARCHAR(255) NOT NULL,
        fuel VARCHAR(255) NOT NULL,
        transmission VARCHAR(255) NOT NULL,
        ownership VARCHAR(255) NOT NULL,
        image VARCHAR(255) NOT NULL
      );
    `);

    // Ensure table has multiple images column
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS images TEXT;
    `);

    // Ensure primary image column can store larger base64 strings
    await client.query(`
      ALTER TABLE cars ALTER COLUMN image TYPE TEXT;
    `);

    // Add new columns for variant, color, price, negotiable, and delivery details
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS variant VARCHAR(255);
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS color VARCHAR(100);
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS price NUMERIC;
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT FALSE;
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'Available';
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS delivery_images TEXT;
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS delivery_date VARCHAR(50);
    `);

    // Seeding has been commented out to prevent pseudo cars from automatically reappearing when deleted
    /*
    // Check if table is empty
    const result = await client.query('SELECT COUNT(*) FROM cars');
    if (parseInt(result.rows[0].count) === 0) {
      console.log('Seeding initial cars data...');
      for (const car of initialCars) {
        await client.query(
          'INSERT INTO cars (brand, model, category, year, km, fuel, transmission, ownership, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [car.brand, car.model, car.category, car.year, car.km, car.fuel, car.transmission, car.ownership, car.image]
        );
      }
      console.log('Seeding complete.');
    }
    */
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    if (client) client.release();
  }
}

initDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
