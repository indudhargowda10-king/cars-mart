require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static files from the current directory
app.use(express.static(__dirname));

// API endpoints
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
  const { brand, model, category, year, km, fuel, transmission, ownership, image } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO cars (brand, model, category, year, km, fuel, transmission, ownership, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [brand, model, category, year, km, fuel, transmission, ownership, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding car:', err);
    res.status(500).json({ error: 'Server error adding car' });
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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Simple authentication for showcase
  if (username === 'admin' && password === 'admin') {
    res.json({ success: true, token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Fallback to serve index.html
app.get('/(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
