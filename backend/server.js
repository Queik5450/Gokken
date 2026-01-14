const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
    if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_CLIENT_SECRET) {
        throw new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET');
    }
    if (accessToken && Date.now() < tokenExpiry) return accessToken;

    const url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
    const response = await axios.post(url);
    
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; 
    return accessToken;
}

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
            fields id, name, cover.image_id, screenshots.image_id, artworks.image_id, rating, rating_count, summary, slug, first_release_date;
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

app.get('/api/companies', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);

        const companies = await igdbQuery('companies', `
            fields id, name, slug, logo.image_id;
            where logo != null;
            sort name asc;
            limit ${limit};
        `);

        const ids = companies.map(c => c.id).filter(Boolean);
        const ratingMap = {};

        if (ids.length) {
            const games = await igdbQuery('games', `
                fields rating, involved_companies.company;
                where rating != null & involved_companies.company = (${ids.join(',')});
                limit 500;
            `);

            games.forEach(game => {
                if (!game.rating || !Array.isArray(game.involved_companies)) return;
                game.involved_companies.forEach(ic => {
                    const cid = ic && (ic.company || ic);
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

app.get('/api/company', async (req, res) => {
    try {
        const id = req.query.id ? Number(req.query.id) : null;
        const slug = req.query.slug || null;
        if (!id && !slug) return res.status(400).json({ error: 'Missing id or slug' });

        const where = id ? `where id = ${id};` : `where slug = "${slug}";`;
        const companies = await igdbQuery('companies', `
            fields id, name, slug, description, logo.image_id, country, start_date, websites.url, websites.category;
            ${where}
            limit 1;
        `);

        if (!companies || !companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        const games = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, rating_count, first_release_date, involved_companies.company;
            where involved_companies.company = ${company.id} & cover != null;
            sort rating desc;
            limit 30;
        `);

        const rated = games.filter(g => typeof g.rating === 'number');
        const avg = rated.length ? rated.reduce((s,g)=>s+g.rating,0) / rated.length : null;

        res.json({
            ...company,
            avg_rating: avg,
            rating_count: rated.length,
            games
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});

app.get('/api/search/games', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
        if (!q) return res.status(400).json({ error: 'Missing query' });

        const data = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, first_release_date;
            search "${q}";
            limit ${limit};
        `);

        res.json(data);
    } catch (error) {
        console.error('Search games failed', error?.response?.data || error.message || error);
        res.status(200).json([]);
    }
});

app.get('/api/search/companies', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
        if (!q) return res.status(400).json({ error: 'Missing query' });

        let data = await igdbQuery('companies', `
            fields id, name, slug, logo.image_id, country, start_date;
            search "${q}";
            limit ${limit};
        `);

        if(!data || data.length === 0){
            data = await igdbQuery('companies', `
                fields id, name, slug, logo.image_id, country, start_date;
                where name ~ *"${q}"*;
                limit ${limit};
            `);
        }

        res.json(data);
    } catch (error) {
        console.error('Search companies failed', error?.response?.data || error.message || error);
        res.status(200).json([]);
    }
});

app.get('/api/search/platforms', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
        if (!q) return res.status(400).json({ error: 'Missing query' });

        const data = await igdbQuery('platforms', `
            fields id, name, slug, abbreviation, generation, platform_logo.image_id, platform_family.name;
            search "${q}";
            where platform_logo != null;
            limit ${limit};
        `);

        res.json(data);
    } catch (error) {
        console.error('Search platforms failed', error?.response?.data || error.message || error);
        res.status(200).json([]);
    }
});

app.get('/api/search/all', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 30);
        if (!q) return res.status(400).json({ error: 'Missing query' });

        const [games, companies, platforms] = await Promise.all([
            igdbQuery('games', `
                fields id, name, slug, cover.image_id, rating, first_release_date;
                search "${q}";
                limit ${limit};
            `),
            igdbQuery('companies', `
                fields id, name, slug, logo.image_id, country, start_date;
                search "${q}";
                limit ${limit};
            `),
            igdbQuery('platforms', `
                fields id, name, slug, abbreviation, generation, platform_logo.image_id, platform_family.name;
                search "${q}";
                where platform_logo != null;
                limit ${limit};
            `)
        ]);

        let companiesFinal = companies;
        if((!companies || companies.length === 0) && q){
            companiesFinal = await igdbQuery('companies', `
                fields id, name, slug, logo.image_id, country, start_date;
                where name ~ *"${q}"*;
                limit ${limit};
            `);
        }

        res.json({ games, companies: companiesFinal, platforms });
    } catch (error) {
        console.error('Search all failed', error?.response?.data || error.message || error);
        res.status(200).json({ games: [], companies: [], platforms: [] });
    }
});

app.get('/api/games/by-genre', async (req, res) => {
    try {
        const genreId = req.query.id ? Number(req.query.id) : null;
        const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 50);
        const page = Math.max(Number(req.query.page || 1), 1);
        if (!genreId) return res.status(400).json({ error: 'Missing genre id' });

        const offset = (page - 1) * limit;
        const games = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, first_release_date, genres;
            where genres = (${genreId}) & cover != null;
            sort rating desc;
            limit ${limit + 1};
            offset ${offset};
        `);

        const hasMore = games.length > limit;
        const items = hasMore ? games.slice(0, limit) : games;
        res.json({ items, hasMore, page, limit });
    } catch (error) {
        console.error('Games by genre failed', error?.response?.data || error.message || error);
        res.status(200).json({ items: [], hasMore: false, page: Number(req.query.page || 1) || 1, limit: Number(req.query.limit || 30) });
    }
});

app.get('/api/games/by-platform', async (req, res) => {
    try {
        const platformId = req.query.id ? Number(req.query.id) : null;
        const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 50);
        const page = Math.max(Number(req.query.page || 1), 1);
        if (!platformId) return res.status(400).json({ error: 'Missing platform id' });

        const offset = (page - 1) * limit;
        const games = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, first_release_date, platforms;
            where platforms = (${platformId}) & cover != null;
            sort rating desc;
            limit ${limit + 1};
            offset ${offset};
        `);

        const hasMore = games.length > limit;
        const items = hasMore ? games.slice(0, limit) : games;
        res.json({ items, hasMore, page, limit });
    } catch (error) {
        console.error('Games by platform failed', error?.response?.data || error.message || error);
        res.status(200).json({ items: [], hasMore: false, page: Number(req.query.page || 1) || 1, limit: Number(req.query.limit || 30) });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
        const now = Math.floor(Date.now() / 1000);
        const windowPast = now - (30 * 86400);

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

app.get('/api/news', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
        const pulses = await igdbQuery('pulses', `
            fields id, title, summary, published_at, updated_at, pulse_image.image_id, websites.url, url;
            sort published_at desc;
            limit ${limit};
        `);

        res.json(pulses || []);
    } catch (error) {
        console.error('Fetch news failed', error?.response?.data || error.message || error);
        res.status(200).json([]);
    }
});

app.get('/api/game', async (req, res) => {
    try {
        const id = req.query.id ? Number(req.query.id) : null;
        const slug = req.query.slug || null;
        const name = req.query.name || null;

        let whereOrSearch = '';
        if (id) {
            whereOrSearch = `where id = ${id};`;
        } else if (slug) {
            whereOrSearch = `where slug = "${slug}";`;
        } else if (name) {
            whereOrSearch = `search "${name}";`;
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
                genres.id, genres.name,
                platforms.id, platforms.name,
                involved_companies.company.name,
                language_supports.language.name,
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

app.get('/api/platform', async (req, res) => {
    try {
        const id = req.query.id ? Number(req.query.id) : null;
        const slug = req.query.slug || null;
        if (!id && !slug) return res.status(400).json({ error: 'Missing id or slug' });

        const where = id ? `where id = ${id};` : `where slug = "${slug}";`;
        const platforms = await igdbQuery('platforms', `
            fields id, name, slug, abbreviation, summary, generation, platform_logo.image_id, platform_family.name, category, websites.url, websites.category;
            ${where}
            limit 1;
        `);

        if (!platforms || !platforms.length) return res.status(404).json({ error: 'Platform not found' });
        res.json(platforms[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch platform' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));