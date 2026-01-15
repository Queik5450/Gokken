const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const repository = require('./repository');

const app = express();
app.use(cors());

function sendResult(res, result) {
    const status = result?.status || 500;
    const payload = result?.payload ?? { error: 'Internal server error' };
    return res.status(status).json(payload);
}

function wrap(handler) {
    return async (req, res) => {
        try {
            const result = await handler(req);
            return sendResult(res, result);
        } catch (error) {
            console.error('Unhandled error', error?.response?.data || error.message || error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
}

app.get('/api/top-games', wrap((req) => repository.getTopGames(req.query)));
app.get('/api/games/recent', wrap((req) => repository.getRecentGames(req.query)));
app.get('/api/games/upcoming', wrap((req) => repository.getUpcomingGames(req.query)));
app.get('/api/companies', wrap((req) => repository.getCompanies(req.query)));
app.get('/api/companies/all', wrap((req) => repository.getCompaniesAll(req.query)));
app.get('/api/company', wrap((req) => repository.getCompany(req.query)));
app.get('/api/search/games', wrap((req) => repository.searchGames(req.query)));
app.get('/api/search/companies', wrap((req) => repository.searchCompanies(req.query)));
app.get('/api/search/platforms', wrap((req) => repository.searchPlatforms(req.query)));
app.get('/api/search/all', wrap((req) => repository.searchAll(req.query)));
app.get('/api/games/by-genre', wrap((req) => repository.getGamesByGenre(req.query)));
app.get('/api/games/by-platform', wrap((req) => repository.getGamesByPlatform(req.query)));
app.get('/api/events', wrap((req) => repository.getEvents(req.query)));
app.get('/api/game-events', wrap((req) => repository.getGameEvents(req.query)));
app.get('/api/news', wrap((req) => repository.getNews(req.query)));
app.get('/api/game', wrap((req) => repository.getGame(req.query)));
app.get('/api/platform', wrap((req) => repository.getPlatform(req.query)));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));