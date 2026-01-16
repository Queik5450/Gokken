const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Parser = require('rss-parser');

const app = express();
app.use(cors());

const memoryCache = new Map();

function cacheGetWithStale(key, maxStaleMs = 0) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now <= entry.expiresAt) return entry.value;
    if (maxStaleMs > 0 && now - entry.expiresAt <= maxStaleMs) return entry.value;
    return null;
}

function cacheSet(key, value, ttlMs) {
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function libreTranslateEndpoint() {
    return process.env.LIBRETRANSLATE_ENDPOINT || 'https://libretranslate.de/translate';
}

function translateTarget(lang) {
    const normalized = normalizeIgdbLang(lang);
    if (normalized.toLowerCase().startsWith('es')) return 'ES';
    if (normalized.toLowerCase().startsWith('en')) return 'EN';
    return null;
}

async function translateText(text, lang) {
    const value = typeof text === 'string' ? text.trim() : '';
    if (!value) return text;
    const target = translateTarget(lang);
    if (!target) return text;

    const cacheKey = `translate:${target}:${value}`;
    const cached = cacheGetWithStale(cacheKey, 7 * 24 * 60 * 60 * 1000);
    if (cached) return cached;

    try {
        const payload = {
            q: value,
            source: 'auto',
            target: target === 'ES' ? 'es' : 'en',
            format: 'text'
        };
        if (process.env.LIBRETRANSLATE_API_KEY) payload.api_key = process.env.LIBRETRANSLATE_API_KEY;
        const response = await axios.post(libreTranslateEndpoint(), payload, {
            timeout: 8000,
            headers: { 'Content-Type': 'application/json' }
        });
        const translated = response?.data?.translatedText || value;
        cacheSet(cacheKey, translated, 7 * 24 * 60 * 60 * 1000);
        return translated;
    } catch {
        return text;
    }
}

function withTimeout(promise, ms, fallback) {
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
    });
    return Promise.race([
        promise.then((value) => {
            clearTimeout(timer);
            return value;
        }).catch(() => {
            clearTimeout(timer);
            return fallback;
        }),
        timeout
    ]);
}

const rssParser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Gokken/1.0 (+https://localhost)'
    }
});

let accessToken = null;
let tokenExpiry = 0;

function toUnixSeconds(value) {
    if (!value) return null;
    if (typeof value === 'number') {
        return value > 1e12 ? Math.floor(value / 1000) : value;
    }
    if (typeof value === 'string') {
        const ms = Date.parse(value);
        return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
    }
    return null;
}

function stripHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function pickRssImage(item) {
    const enclosureUrl = item?.enclosure?.url;
    if (enclosureUrl) return enclosureUrl;

    const mediaContent = item?.['media:content']?.['$']?.url || item?.['media:content']?.url;
    if (mediaContent) return mediaContent;

    const mediaThumb = item?.['media:thumbnail']?.['$']?.url || item?.['media:thumbnail']?.url;
    if (mediaThumb) return mediaThumb;

    const html = item?.content || item?.['content:encoded'] || '';
    const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : '';
}

const RSS_FEEDS_ES = [
    { name: 'Eurogamer ES', url: 'https://www.eurogamer.es/feed' },
    { name: 'Vandal', url: 'https://vandal.elespanol.com/rss/noticias.xml' },
    { name: 'MeriStation', url: 'https://as.com/meristation/feed/' }
];

const RSS_FEEDS_EN = [
    { name: 'IGN', url: 'https://www.ign.com/articles?format=rss' },
    { name: 'Polygon', url: 'https://www.polygon.com/rss/index.xml' },
    { name: 'Eurogamer', url: 'https://www.eurogamer.net/feed/news' }
];

function normalizeNewsLang(value) {
    const lang = String(value || '').toLowerCase().trim();
    if (lang === 'en') return 'en';
    return 'es';
}

function normalizeIgdbLang(value) {
    if (!value) return 'es-ES';
    const raw = String(value).trim();
    const lower = raw.toLowerCase();
    const first = lower.split(',')[0].trim();
    if (first.startsWith('en')) return 'en-US';
    if (first.startsWith('es')) return 'es-ES';
    if (lower.includes('en')) return 'en-US';
    if (lower.includes('es')) return 'es-ES';
    return 'es-ES';
}

function resolveLang(req) {
    if (req?.query?.lang) return normalizeIgdbLang(req.query.lang);
    const header = req?.headers ? req.headers['accept-language'] : null;
    return normalizeIgdbLang(header);
}

function getRssFeeds(lang) {
    return normalizeNewsLang(lang) === 'en' ? RSS_FEEDS_EN : RSS_FEEDS_ES;
}

let rssNewsCache = {
    es: { at: 0, ttlMs: 10 * 60 * 1000, items: [] },
    en: { at: 0, ttlMs: 10 * 60 * 1000, items: [] }
};

function cacheGet(key) {
    return cacheGetWithStale(key, 0);
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function attachGameMatch(events){
    if(!Array.isArray(events) || !events.length) return events;
    return Promise.all(events.map(async (ev) => {
        const name = (ev?.name || '').trim();
        if(!name) return { ...ev, related_game: null };
        try {
            const safeName = name.replace(/"/g, '\\"');
            const games = await igdbQuery('games', `
                fields id, name, slug;
                search "${safeName}";
                limit 1;
            `);
            const g = Array.isArray(games) && games[0] ? games[0] : null;
            return { ...ev, related_game: g ? { id: g.id, name: g.name, slug: g.slug } : null };
        } catch {
            return { ...ev, related_game: null };
        }
    }));
}

async function fetchRssNews(limit, lang) {
    const resolvedLang = normalizeNewsLang(lang);
    const cache = rssNewsCache[resolvedLang] || rssNewsCache.es;
    const now = Date.now();

    if (cache.items.length && now - cache.at < cache.ttlMs) {
        return cache.items.slice(0, limit);
    }

    const feeds = getRssFeeds(resolvedLang);
    const results = await Promise.all(
        feeds.map(async (feed) => {
            try {
                const parsed = await rssParser.parseURL(feed.url);
                return (parsed.items || []).map((item, idx) => {
                    const published = item.isoDate || item.pubDate || item.published || null;
                    return {
                        id: `${feed.name}:${item.guid || item.id || item.link || idx}`,
                        title: item.title || 'Noticia',
                        summary: stripHtml(item.contentSnippet || item.content || item.summary || item.description || ''),
                        published_at: toUnixSeconds(published),
                        url: item.link || '',
                        image_url: pickRssImage(item)
                    };
                });
            } catch {
                return [];
            }
        })
    );

    const merged = results.flat();
    merged.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    const dedup = [];
    const seen = new Set();
    for (const item of merged) {
        const key = item.url || item.id;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        dedup.push(item);
        if (dedup.length >= limit) break;
    }

    rssNewsCache = {
        ...rssNewsCache,
        [resolvedLang]: { ...cache, at: now, items: dedup }
    };

    return dedup;
}

async function getAccessToken() {
    if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_CLIENT_SECRET) {
        throw new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET');
    }
    if (accessToken && Date.now() < tokenExpiry) return accessToken;

    const url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
    const response = await axios.post(url, null, { timeout: 8000 });
    
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; 
    return accessToken;
}

async function igdbQuery(resource, query, lang) {
    const token = await getAccessToken();
    const request = () => axios({
        url: `https://api.igdb.com/v4/${resource}`,
        method: 'POST',
        timeout: 8000,
        headers: {
            'Client-ID': process.env.IGDB_CLIENT_ID,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': normalizeIgdbLang(lang)
        },
        data: query
    });

    try {
        const response = await request();
        return response.data;
    } catch (err) {
        const status = err?.response?.status;
        if (status === 429) {
            await sleep(800);
            const retry = await request();
            return retry.data;
        }
        throw err;
    }
}

app.get('/api/top-games', async (req, res) => {
    const limit = Number(req.query.limit || 10);
    const order = req.query.order === 'new' ? 'first_release_date desc' : 'rating desc';
    const cacheKey = `top-games:${order}:${Math.min(Math.max(limit, 1), 100)}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {
        const data = await igdbQuery('games', `
            fields id, name, summary, cover.image_id, rating, rating_count, slug, first_release_date, genres.name, platforms.name;
            sort ${order};
            where rating != null & cover != null & rating_count > 50;
            limit ${Math.min(Math.max(limit,1),100)};
        `);
        cacheSet(cacheKey, data, 15 * 60 * 1000);
        res.json(data);
    } catch (error) {
        console.error('Top games failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

app.get('/api/games/recent', async (req, res) => {
    const windowDays = Number(req.query.days || 15);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const cacheKey = `games-recent:${windowDays}:${limit}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {
        const now = Math.floor(Date.now() / 1000);
        const since = now - (windowDays * 86400);

        const data = await igdbQuery('games', `
            fields name, cover.image_id, first_release_date, release_dates.human, slug, id;
            where first_release_date != null & first_release_date >= ${since} & first_release_date <= ${now} & cover != null;
            sort first_release_date desc;
            limit ${limit};
        `);
        cacheSet(cacheKey, data, 10 * 60 * 1000);
        res.json(data);
    } catch (error) {
        console.error('Recent games failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(500).json({ error: 'Failed to fetch recent games' });
    }
});

app.get('/api/games/upcoming', async (req, res) => {
    const windowDays = Number(req.query.days || 15);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const cacheKey = `games-upcoming:${windowDays}:${limit}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {
        const now = Math.floor(Date.now() / 1000);
        const until = now + (windowDays * 86400);

        const data = await igdbQuery('games', `
            fields name, cover.image_id, first_release_date, release_dates.human, slug, id;
            where first_release_date != null & first_release_date > ${now} & first_release_date <= ${until} & cover != null;
            sort first_release_date asc;
            limit ${limit};
        `);
        cacheSet(cacheKey, data, 10 * 60 * 1000);
        res.json(data);
    } catch (error) {
        console.error('Upcoming games failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(500).json({ error: 'Failed to fetch upcoming games' });
    }
});

app.get('/api/companies', async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const cacheKey = `companies:${limit}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {

        const companies = await igdbQuery('companies', `
            fields id, name, slug, logo.image_id;
            where logo != null;
            sort name asc;
            limit ${limit};
        `);

        const ids = companies.map(c => c.id).filter(Boolean);
        const ratingMap = {};

        if (ids.length) {
            try {
                const games = await igdbQuery('games', `
                    fields rating, involved_companies.company;
                    where rating != null & involved_companies.company = (${ids.join(',')});
                    limit 500;
                `);

                (games || []).forEach(game => {
                    if (!game?.rating || !Array.isArray(game.involved_companies)) return;
                    game.involved_companies.forEach(ic => {
                        const cid = ic && (ic.company || ic);
                        if (!cid) return;
                        if (!ratingMap[cid]) ratingMap[cid] = { sum: 0, count: 0 };
                        ratingMap[cid].sum += game.rating;
                        ratingMap[cid].count += 1;
                    });
                });
            } catch (e) {
                console.warn('Companies rating enrichment skipped', e?.response?.data || e.message || e);
            }
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

        cacheSet(cacheKey, enriched, 15 * 60 * 1000);
        res.json(enriched);
    } catch (error) {
        console.error('Companies failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

app.get('/api/platforms', async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const cacheKey = `platforms:${limit}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {
        let platforms = await igdbQuery('platforms', `
            fields id, name, slug, abbreviation, generation, category, platform_logo.image_id, platform_family.name;
            where platform_logo != null & category = (1,5);
            sort generation desc;
            limit ${limit};
        `);

        if (!Array.isArray(platforms) || platforms.length === 0) {
            platforms = await igdbQuery('platforms', `
                fields id, name, slug, abbreviation, generation, category, platform_logo.image_id, platform_family.name;
                where category = (1,5);
                sort generation desc;
                limit ${limit};
            `);
        }

        cacheSet(cacheKey, platforms, 15 * 60 * 1000);
        res.json(platforms || []);
    } catch (error) {
        console.error('Platforms failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(500).json({ error: 'Failed to fetch platforms' });
    }
});

app.get('/api/platforms/all', async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 50);
    const page = Math.max(Number(req.query.page || 1), 1);
    const cacheKey = `platforms-all:${page}:${limit}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {
        const offset = (page - 1) * limit;
        const platforms = await igdbQuery('platforms', `
            fields id, name, slug, abbreviation, generation, category, platform_logo.image_id, platform_family.name;
            where category = (1,5);
            sort name asc;
            limit ${limit + 1};
            offset ${offset};
        `);

        const hasMore = Array.isArray(platforms) && platforms.length > limit;
        const pageItems = hasMore ? platforms.slice(0, limit) : (platforms || []);

        const payload = { items: pageItems, hasMore, page, limit };
        cacheSet(cacheKey, payload, 15 * 60 * 1000);
        res.json(payload);
    } catch (error) {
        console.error('Platforms-all failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(500).json({ error: 'Failed to fetch platforms' });
    }
});

app.get('/api/companies/all', async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 50);
    const page = Math.max(Number(req.query.page || 1), 1);
    const cacheKey = `companies-all:${page}:${limit}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {
        const offset = (page - 1) * limit;

        const companies = await igdbQuery('companies', `
            fields id, name, slug, logo.image_id;
            where logo != null;
            sort name asc;
            limit ${limit + 1};
            offset ${offset};
        `);

        const hasMore = Array.isArray(companies) && companies.length > limit;
        const pageItems = hasMore ? companies.slice(0, limit) : (companies || []);

        const ids = pageItems.map(c => c.id).filter(Boolean);
        const ratingMap = {};

        if (ids.length) {
            try {
                const games = await igdbQuery('games', `
                    fields rating, involved_companies.company;
                    where rating != null & involved_companies.company = (${ids.join(',')});
                    limit 500;
                `);

                (games || []).forEach(game => {
                    if (!game?.rating || !Array.isArray(game.involved_companies)) return;
                    game.involved_companies.forEach(ic => {
                        const cid = ic && (ic.company || ic);
                        if (!cid) return;
                        if (!ratingMap[cid]) ratingMap[cid] = { sum: 0, count: 0 };
                        ratingMap[cid].sum += game.rating;
                        ratingMap[cid].count += 1;
                    });
                });
            } catch (e) {
                console.warn('Companies-all rating enrichment skipped', e?.response?.data || e.message || e);
            }
        }

        const enriched = pageItems.map(c => {
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

        const payload = { items: enriched, hasMore, page, limit };
        cacheSet(cacheKey, payload, 15 * 60 * 1000);
        res.json(payload);
    } catch (error) {
        console.error('Companies list failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(200).json({ items: [], hasMore: false, page: Math.max(Number(req.query.page || 1), 1), limit: Math.min(Math.max(Number(req.query.limit || 30), 1), 50) });
    }
});

app.get('/api/company', async (req, res) => {
    try {
        const id = req.query.id ? Number(req.query.id) : null;
        const slug = req.query.slug || null;
        if (!id && !slug) return res.status(400).json({ error: 'Missing id or slug' });

        const lang = resolveLang(req);

        const where = id ? `where id = ${id};` : `where slug = "${slug}";`;
        const companies = await igdbQuery('companies', `
            fields id, name, slug, description, logo.image_id, country, start_date, websites.url, websites.category;
            ${where}
            limit 1;
        `, lang);

        if (!companies || !companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];
        const translatedDescription = await translateText(company.description || '', lang);

        const games = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, rating_count, first_release_date, involved_companies.company, platforms.id, platforms.name, genres.id, genres.name, dlcs;
            where involved_companies.company = ${company.id} & cover != null;
            sort rating desc;
            limit 30;
        `);

        const rated = games.filter(g => typeof g.rating === 'number');
        const avg = rated.length ? rated.reduce((s,g)=>s+g.rating,0) / rated.length : null;

        res.json({
            ...company,
            description: translatedDescription,
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

        const cacheKey = `search:games:${q.toLowerCase()}:${limit}`;
        const cached = cacheGetWithStale(cacheKey, 5 * 60 * 1000);
        if (cached) return res.json(cached);

        const data = await withTimeout(igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, first_release_date;
            search "${q}";
            limit ${limit};
        `), 3500, []);
        cacheSet(cacheKey, data, 2 * 60 * 1000);
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

        const cacheKey = `search:companies:${q.toLowerCase()}:${limit}`;
        const cached = cacheGetWithStale(cacheKey, 5 * 60 * 1000);
        if (cached) return res.json(cached);

        let data = await withTimeout(igdbQuery('companies', `
            fields id, name, slug, logo.image_id, country, start_date;
            search "${q}";
            limit ${limit};
        `), 3500, []);

        if(!data || data.length === 0){
            data = await withTimeout(igdbQuery('companies', `
                fields id, name, slug, logo.image_id, country, start_date;
                where name ~ *"${q}"*;
                limit ${limit};
            `), 3500, []);
        }

        cacheSet(cacheKey, data, 2 * 60 * 1000);
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

        const cacheKey = `search:platforms:${q.toLowerCase()}:${limit}`;
        const cached = cacheGetWithStale(cacheKey, 5 * 60 * 1000);
        if (cached) return res.json(cached);

        const data = await withTimeout(igdbQuery('platforms', `
            fields id, name, slug, abbreviation, generation, platform_logo.image_id, platform_family.name;
            search "${q}";
            where platform_logo != null;
            limit ${limit};
        `), 3500, []);
        cacheSet(cacheKey, data, 2 * 60 * 1000);
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

        const cacheKey = `search:all:${q.toLowerCase()}:${limit}`;
        const cached = cacheGetWithStale(cacheKey, 5 * 60 * 1000);
        if (cached) return res.json(cached);

        const [games, companies, platforms] = await Promise.all([
            withTimeout(igdbQuery('games', `
                fields id, name, slug, cover.image_id, rating, first_release_date;
                search "${q}";
                limit ${limit};
            `), 3500, []),
            withTimeout(igdbQuery('companies', `
                fields id, name, slug, logo.image_id, country, start_date;
                search "${q}";
                limit ${limit};
            `), 3500, []),
            withTimeout(igdbQuery('platforms', `
                fields id, name, slug, abbreviation, generation, platform_logo.image_id, platform_family.name;
                search "${q}";
                where platform_logo != null;
                limit ${limit};
            `), 3500, [])
        ]);

        let companiesFinal = companies;
        if((!companies || companies.length === 0) && q){
            companiesFinal = await withTimeout(igdbQuery('companies', `
                fields id, name, slug, logo.image_id, country, start_date;
                where name ~ *"${q}"*;
                limit ${limit};
            `), 3500, []);
        }

        const payload = { games, companies: companiesFinal, platforms };

        cacheSet(cacheKey, payload, 2 * 60 * 1000);
        res.json(payload);
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

app.get('/api/games/by-mode', async (req, res) => {
    try {
        const modeId = req.query.id ? Number(req.query.id) : null;
        const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 50);
        const page = Math.max(Number(req.query.page || 1), 1);
        if (!modeId) return res.status(400).json({ error: 'Missing mode id' });

        const offset = (page - 1) * limit;
        const games = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, first_release_date, game_modes;
            where game_modes = (${modeId}) & cover != null;
            sort rating desc;
            limit ${limit + 1};
            offset ${offset};
        `);

        const hasMore = games.length > limit;
        const items = hasMore ? games.slice(0, limit) : games;
        res.json({ items, hasMore, page, limit });
    } catch (error) {
        console.error('Games by mode failed', error?.response?.data || error.message || error);
        res.status(200).json({ items: [], hasMore: false, page: Number(req.query.page || 1) || 1, limit: Number(req.query.limit || 30) });
    }
});

app.get('/api/games/by-collection', async (req, res) => {
    try {
        const collectionId = req.query.id ? Number(req.query.id) : null;
        const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 50);
        const page = Math.max(Number(req.query.page || 1), 1);
        if (!collectionId) return res.status(400).json({ error: 'Missing collection id' });

        const offset = (page - 1) * limit;
        const games = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, first_release_date, collection;
            where collection = ${collectionId} & cover != null;
            sort rating desc;
            limit ${limit + 1};
            offset ${offset};
        `);

        const hasMore = games.length > limit;
        const items = hasMore ? games.slice(0, limit) : games;
        res.json({ items, hasMore, page, limit });
    } catch (error) {
        console.error('Games by collection failed', error?.response?.data || error.message || error);
        res.status(200).json({ items: [], hasMore: false, page: Number(req.query.page || 1) || 1, limit: Number(req.query.limit || 30) });
    }
});

app.get('/api/games/by-franchise', async (req, res) => {
    try {
        const franchiseId = req.query.id ? Number(req.query.id) : null;
        const limit = Math.min(Math.max(Number(req.query.limit || 30), 1), 50);
        const page = Math.max(Number(req.query.page || 1), 1);
        if (!franchiseId) return res.status(400).json({ error: 'Missing franchise id' });

        const offset = (page - 1) * limit;
        const games = await igdbQuery('games', `
            fields id, name, slug, cover.image_id, rating, first_release_date, franchises;
            where franchises = (${franchiseId}) & cover != null;
            sort rating desc;
            limit ${limit + 1};
            offset ${offset};
        `);

        const hasMore = games.length > limit;
        const items = hasMore ? games.slice(0, limit) : games;
        res.json({ items, hasMore, page, limit });
    } catch (error) {
        console.error('Games by franchise failed', error?.response?.data || error.message || error);
        res.status(200).json({ items: [], hasMore: false, page: Number(req.query.page || 1) || 1, limit: Number(req.query.limit || 30) });
    }
});

app.get('/api/events', async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
    const lang = resolveLang(req);
    const cacheKey = `events:${limit}:${lang}`;
    const cached = cacheGetWithStale(cacheKey, 60 * 60 * 1000);
    if (cached) return res.json(cached);

    try {
        const withGames = String(req.query.withGames || '').toLowerCase() === 'true' || req.query.withGames === '1';

        const events = await igdbQuery('events', `
            fields id, name, slug, start_time, event_logo.image_id, description, live_stream_url, event_networks.url;
            sort name asc;
            limit ${limit};
        `);

        let normalized = await Promise.all((events || []).map(async (e) => ({
            ...e,
            description: await translateText(e?.description || '', lang),
            url: e?.live_stream_url || (Array.isArray(e?.event_networks) && e.event_networks[0]?.url ? e.event_networks[0].url : '')
        })));

        if (withGames) {
            normalized = await attachGameMatch(normalized);
        }

        cacheSet(cacheKey, normalized, 15 * 60 * 1000);
        res.json(normalized);
    } catch (error) {
        console.error('Events failed', error?.response?.data || error.message || error);
        if (cached) return res.json(cached);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.get('/api/game-events', async (req, res) => {
    try {
        const gameName = String(req.query.name || '').trim();
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 30);
        if (!gameName) return res.status(400).json({ error: 'Missing game name' });
        const lang = resolveLang(req);

        const targetGames = await igdbQuery('games', `
            fields id, name, slug, collection.name, franchises.name;
            search "${gameName.replace(/"/g, '\"')}";
            limit 1;
        `);
        const target = Array.isArray(targetGames) && targetGames[0] ? targetGames[0] : null;

        const poolSize = Math.min(limit * 6, 120);
        const events = await igdbQuery('events', `
            fields id, name, slug, start_time, event_logo.image_id, description, live_stream_url, event_networks.url;
            limit ${poolSize};
        `);

        const normalized = await Promise.all((events || []).map(async (e) => ({
            ...e,
            description: await translateText(e?.description || '', lang),
            url: e?.live_stream_url || (Array.isArray(e?.event_networks) && e.event_networks[0]?.url ? e.event_networks[0].url : '')
        })));

        const enriched = await attachGameMatch(normalized);

        const keywords = (() => {
            const list = [gameName];
            if (target?.name) list.push(target.name);
            if (target?.collection?.name) list.push(target.collection.name);
            if (Array.isArray(target?.franchises)) {
                target.franchises.forEach(f => { if (f?.name) list.push(f.name); });
            }
            return list
                .map(s => String(s || '').trim().toLowerCase())
                .filter(Boolean);
        })();

        const filtered = enriched.filter(ev => {
            const rg = ev.related_game || {};
            const title = (ev.name || '').toLowerCase();
            const desc = (ev.description || '').toLowerCase();
            const matchId = target && rg.id && target.id && rg.id === target.id;
            if (matchId) return true;
            if (!keywords.length) return false;
            return keywords.some(k => title.includes(k) || desc.includes(k));
        });

        const pool = filtered.length ? filtered : enriched;
        const result = pool.slice(0, limit);
        res.json(result);
    } catch (error) {
        console.error('Game events failed', error?.response?.data || error.message || error);
        res.status(500).json([]);
    }
    }
);

app.get('/api/news', async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
        const lang = normalizeNewsLang(req.query.lang);

        const rssItems = await fetchRssNews(limit, lang);
        if (rssItems && rssItems.length) {
            const translated = await Promise.all(rssItems.map(async (item) => ({
                ...item,
                summary: await translateText(item.summary || '', lang)
            })));
            return res.json(translated);
        }

        if (lang !== 'en') {
            const enItems = await fetchRssNews(limit, 'en');
            if (enItems && enItems.length) {
                const translated = await Promise.all(enItems.map(async (item) => ({
                    ...item,
                    summary: await translateText(item.summary || '', lang)
                })));
                return res.json(translated);
            }
        }

        const games = await igdbQuery('games', `
            fields id, name, summary, updated_at, cover.image_id, url;
            where summary != null & cover != null;
            sort updated_at desc;
            limit ${limit};
        `, lang);

        const news = await Promise.all((games || []).map(async (g) => ({
            id: g.id,
            title: g.name,
            summary: await translateText(g.summary || '', lang),
            published_at: toUnixSeconds(g.updated_at),
            updated_at: toUnixSeconds(g.updated_at),
            pulse_image: g.cover ? { image_id: g.cover.image_id } : null,
            url: g.url || '',
            image_url: ''
        })));

        res.json(news);
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
        const lang = resolveLang(req);

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
                game_modes.id, game_modes.name,
                collection.id, collection.name,
                franchises.id, franchises.name,
                platforms.id, platforms.name,
                themes.id, themes.name,
                keywords.id, keywords.name,
                age_ratings.category, age_ratings.rating, age_ratings.synopsis, age_ratings.rating_cover_url,
                involved_companies.company.name,
                language_supports.language.name,
                first_release_date,
                release_dates.human;
            ${whereOrSearch}
            limit 1;
        `;

        const data = await igdbQuery('games', query, lang);
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        const game = data[0];
        const [summary, storyline] = await Promise.all([
            translateText(game.summary || '', lang),
            translateText(game.storyline || '', lang)
        ]);
        res.json({
            ...game,
            summary,
            storyline
        });
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

        const lang = resolveLang(req);

        const where = id ? `where id = ${id};` : `where slug = "${slug}";`;
        const platforms = await igdbQuery('platforms', `
            fields id, name, slug, abbreviation, summary, generation, platform_logo.image_id, platform_family.name, category, websites.url, websites.category;
            ${where}
            limit 1;
        `, lang);

        if (!platforms || !platforms.length) return res.status(404).json({ error: 'Platform not found' });
        const platform = platforms[0];
        const summary = await translateText(platform.summary || '', lang);
        res.json({
            ...platform,
            summary
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch platform' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));