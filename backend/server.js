console.log('Starting server...');

const express = require('express');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
// In your server.js, update the CORS configuration
const cors = require('cors');
// In your server.js, update the CORS configuration
app.use(cors({
    origin: [
        'http://127.0.0.1:3000', 
        'http://localhost:3000', 
        'https://whereisitdryrightnow.com',
        'https://www.whereisitdryrightnow.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Test route to make sure server is working
app.get('/', (req, res) => {
    res.send('Weather API Server is running!');
});

app.get('/weather', async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});