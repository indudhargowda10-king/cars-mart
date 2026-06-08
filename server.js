require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const multer = require('multer');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Serve static files from the current directory
app.use(express.static(__dirname));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoints
app.post('/api/upload', (req, res, next) => {
  upload.array('images', 10)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({ success: false, message: err.message });
    }
    // Everything went fine.
    next();
  });
}, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded or invalid format.' });
    }
    // Return the relative paths so the frontend can store them in the DB
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ success: true, imageUrls: imageUrls });
  } catch (err) {
    console.error('Error uploading files:', err);
    res.status(500).json({ success: false, message: 'Server error during files upload.' });
  }
});

app.get('/api/cars', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cars ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cars:', err);
    res.status(500).json({ error: 'Server error fetching cars' });
  }
});

app.post('/api/cars', async (req, res) => {
  const { brand, model, category, year, km, fuel, transmission, ownership, image, images, variant, color, price, negotiable, delivery_status, delivery_images, delivery_notes, delivery_date } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO cars (
        brand, model, category, year, km, fuel, transmission, ownership, image, images,
        variant, color, price, negotiable, delivery_status, delivery_images, delivery_notes, delivery_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [brand, model, category, year, km, fuel, transmission, ownership, image, images, variant, color, price, negotiable, delivery_status || 'Available', delivery_images, delivery_notes, delivery_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding car:', err);
    res.status(500).json({ error: 'Server error adding car' });
  }
});

app.put('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  const { brand, model, category, year, km, fuel, transmission, ownership, image, images, variant, color, price, negotiable, delivery_status, delivery_images, delivery_notes, delivery_date } = req.body;
  try {
    const result = await db.query(
      `UPDATE cars SET 
        brand = $1, model = $2, category = $3, year = $4, km = $5, 
        fuel = $6, transmission = $7, ownership = $8, image = $9, images = $10,
        variant = $11, color = $12, price = $13, negotiable = $14,
        delivery_status = $15, delivery_images = $16, delivery_notes = $17, delivery_date = $18
      WHERE id = $19 RETURNING *`,
      [brand, model, category, year, km, fuel, transmission, ownership, image, images, variant, color, price, negotiable, delivery_status, delivery_images, delivery_notes, delivery_date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating car:', err);
    res.status(500).json({ error: 'Server error updating car' });
  }
});

app.delete('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM cars WHERE id = $1', [id]);
    res.json({ message: 'Car deleted' });
  } catch (err) {
    console.error('Error deleting car:', err);
    res.status(500).json({ error: 'Server error deleting car' });
  }
});

// Deliveries API endpoints
app.get('/api/deliveries', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM deliveries ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: 'Server error fetching deliveries' });
  }
});

app.post('/api/deliveries', async (req, res) => {
  const { car_details, delivery_date, delivery_notes, delivery_images } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO deliveries (car_details, delivery_date, delivery_notes, delivery_images) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [car_details, delivery_date, delivery_notes, delivery_images]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding delivery:', err);
    res.status(500).json({ error: 'Server error adding delivery' });
  }
});

app.delete('/api/deliveries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM deliveries WHERE id = $1', [id]);
    res.json({ message: 'Delivery deleted' });
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).json({ error: 'Server error deleting delivery' });
  }
});


app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Simple authentication for showcase
  if (username === 'carmart' && password === '9008740899') {
    res.json({ success: true, token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// ── Health Check Endpoint (used by UptimeRobot / keep-alive ping) ──────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to serve index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // ── Self Keep-Alive Ping (prevents Render free-tier cold starts) ────────────
  // Render spins down after 15 min of inactivity. We ping ourselves every
  // 14 minutes so the service stays warm 24/7 without an external service.
  const https = require('https');
  const http  = require('http');

  const SITE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  const pingself = () => {
    const url = `${SITE_URL}/health`;
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      console.log(`[keep-alive] Pinged ${url} → ${res.statusCode}`);
    });
    req.on('error', (err) => {
      console.warn(`[keep-alive] Ping failed: ${err.message}`);
    });
    req.end();
  };

  // First ping after 1 minute, then every 14 minutes thereafter
  setTimeout(() => {
    pingself();
    setInterval(pingself, PING_INTERVAL_MS);
  }, 60 * 1000);
});
