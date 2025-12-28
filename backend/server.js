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

// Generic IGDB POST helper
async function igdbQuery(resource, query) {
    const token = await getAccessToken();
    const response = await axios({
        url: `https://api.igdb.com/v4/${resource}`,
        method: 'POST',
        headers: {
            'Client-ID': process.env.IGDB_CLIENT_ID,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        data: query
    });
    return response.data;
}

app.get('/api/top-games', async (req, res) => {
    try {
        const limit = Number(req.query.limit || 10);
        const order = req.query.order === 'new' ? 'first_release_date desc' : 'rating desc';
        const data = await igdbQuery('games', `
            fields name, cover.image_id, screenshots.image_id, artworks.image_id, rating, rating_count, summary, slug, first_release_date;
            sort ${order};
            where rating != null & cover != null & rating_count > 50;
            limit ${Math.min(Math.max(limit,1),100)};
        `);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// Game detail by id or name slug
app.get('/api/game', async (req, res) => {
    try {
        const id = req.query.id ? Number(req.query.id) : null;
        const nameOrSlug = req.query.name || req.query.slug || null;

        let whereOrSearch = '';
        if (id) {
            whereOrSearch = `where id = ${id};`;
        } else if (nameOrSlug) {
            // Prefer slug if passed, fallback to search by name
            whereOrSearch = `search "${nameOrSlug}";`;
        } else {
            return res.status(400).json({ error: 'Missing id or name/slug' });
        }

        const query = `
            fields 
                name, slug, summary, storyline, rating, rating_count,
                cover.image_id,
                screenshots.image_id,
                artworks.image_id,
                videos.video_id,
                genres.name,
                platforms.name,
                involved_companies.company.name,
                first_release_date,
                release_dates.human;
            ${whereOrSearch}
            limit 1;
        `;

        const data = await igdbQuery('games', query);
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(data[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch game detail' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));