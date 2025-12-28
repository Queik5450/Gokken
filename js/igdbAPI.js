function apiBase(){
    const hinted = window.__API_BASE__;
    if (hinted) return hinted.replace(/\/$/,'');
    const { protocol, hostname } = window.location;
    const host = hostname || 'localhost';
    const port = 8080; // default backend port
    return `${protocol.includes('http')? 'http' : 'http'}://${host || 'localhost'}:${port}`;
}

function sampleGames(){
    return [
        { name: 'The Witcher 3: Wild Hunt', cover: { image_id: 'co1r16' }, id: 1942 },
        { name: 'Red Dead Redemption 2', cover: { image_id: 'co1l7n' }, id: 1877 },
        { name: 'God of War', cover: { image_id: 'co1tmu' }, id: 11133 },
        { name: 'Hades', cover: { image_id: 'co1wyy' }, id: 134225 },
        { name: 'Hollow Knight', cover: { image_id: 'co1qky' }, id: 19700 }
    ];
}

async function getTopGames() 
{
    const url = `${apiBase()}/api/top-games?limit=10`;

    try
    {
        const response = await fetch(url);
        if (!response.ok)
        {
            throw new Error(`Server Error: ${response.status}`);
        }
        const games = await response.json();
        renderGames(games);
    }
    catch (error)
    {
        console.error('Error fetching games:', error);
        // Fallback: mostrar ejemplos para evitar la sección vacía
        renderGames(sampleGames());
    }
}

function renderGames(games)
{
    const container = document.querySelector('.game-cards-container');
    if (!container) return;

    container.innerHTML = '';

    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        const imageId = game.cover ? game.cover.image_id : '';
        const imageUrl = imageId 
            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg` 
            : 'https://placehold.co/200x280/333/white?text=No+Image';

        // Link to game detail page; if `game.id` is present use it, otherwise fallback to name-based id
        const gid = game.id !== undefined ? game.id : encodeURIComponent(game.name.replace(/\s+/g,'-').toLowerCase());
        card.innerHTML = `
            <a class="game-link" href="game.html?id=${gid}">
                <img src="${imageUrl}" alt="${game.name}">
                <div class="game-title">${game.name}</div>
            </a>
        `;
        
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    getTopGames();
});
