require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your frontend to talk to this server

let accessToken = null;
let tokenExpiry = 0;

// Helper to get/refresh token
async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) return accessToken;

    const url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
    const response = await axios.post(url);
    
    accessToken = response.data.access_token;
    // Set expiry slightly before actual expiry (expires_in is in seconds)
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; 
    return accessToken;
}

app.get('/api/top-games', async (req, res) => {
    try {
        const token = await getAccessToken();
        
        const response = await axios({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            // The query you wrote goes here
            data: `
                fields name, cover.image_id, rating;
                sort rating desc;
                where rating != null & cover != null & rating_count > 100;
                limit 10;
            `
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));