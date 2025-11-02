// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const router = express.Router();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse incoming JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ No MongoDB connection string found in .env (MONGODB_URI)');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Import routes
require('./routes')(app, router);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MP3 Task Management API!',
    endpoints: {
      users: '/api/users',
      tasks: '/api/tasks'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});