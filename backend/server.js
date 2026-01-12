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

// Games released in the last N days (default 15)
app.get('/api/games/recent', async (req, res) => {
    try {
        const windowDays = Number(req.query.days || 15);
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
        const now = Math.floor(Date.now() / 1000);
        const since = now - (windowDays * 86400);

        const data = await igdbQuery('games', `
            fields name, cover.image_id, first_release_date, release_dates.human, slug, id;
            where first_release_date != null & first_release_date >= ${since} & first_release_date <= ${now} & cover != null;
            sort first_release_date desc;
            limit ${limit};
        `);

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch recent games' });
    }
});

// Games releasing in the next N days (default 15)
app.get('/api/games/upcoming', async (req, res) => {
    try {
        const windowDays = Number(req.query.days || 15);
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
        const now = Math.floor(Date.now() / 1000);
        const until = now + (windowDays * 86400);

        const data = await igdbQuery('games', `
            fields name, cover.image_id, first_release_date, release_dates.human, slug, id;
            where first_release_date != null & first_release_date > ${now} & first_release_date <= ${until} & cover != null;
            sort first_release_date asc;
            limit ${limit};
        `);

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch upcoming games' });
    }
});

// Featured companies with average rating computed from their games
app.get('/api/companies', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);

        // Grab companies that have a logo so we can render them nicely
        const companies = await igdbQuery('companies', `
            fields id, name, slug, logo.image_id;
            where logo != null;
            sort name asc;
            limit ${limit};
        `);

        const ids = companies.map(c => c.id).filter(Boolean);
        const ratingMap = {};

        if (ids.length) {
            // Fetch games associated with these companies to compute avg ratings
            const games = await igdbQuery('games', `
                fields rating, involved_companies.company;
                where rating != null & involved_companies.company = (${ids.join(',')});
                limit 500;
            `);

            games.forEach(game => {
                if (!game.rating || !Array.isArray(game.involved_companies)) return;
                game.involved_companies.forEach(ic => {
                    const cid = ic && (ic.company || ic); // IGDB may return nested or raw ids
                    if (!cid) return;
                    if (!ratingMap[cid]) ratingMap[cid] = { sum: 0, count: 0 };
                    ratingMap[cid].sum += game.rating;
                    ratingMap[cid].count += 1;
                });
            });
        }

        const enriched = companies.map(c => {
            const entry = ratingMap[c.id];
            const avg = entry && entry.count ? entry.sum / entry.count : null;
            return {
                id: c.id,
                name: c.name,
                slug: c.slug,
                logo: c.logo,
                avg_rating: avg,
                rating_count: entry ? entry.count : 0
            };
        });

        res.json(enriched);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Gaming-related events (upcoming + recent)
app.get('/api/events', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
        const now = Math.floor(Date.now() / 1000);
        const windowPast = now - (30 * 86400); // allow events from last 30 days

        const events = await igdbQuery('events', `
            fields name, slug, start_time, end_time, event_logo.image_id, description, url;
            where start_time != null & start_time >= ${windowPast};
            sort start_time asc;
            limit ${limit};
        `);

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch events' });
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