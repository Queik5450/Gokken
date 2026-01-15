function apiBase(){
    return `https://gokken-seven.vercel.app`;
}

function sampleGames(){
    return [
        { name: 'Game 1', cover: { image_id: 'co1r16' }, id: 101 },
        { name: 'Game 2', cover: { image_id: 'co1l7n' }, id: 102 },
        { name: 'Game 3', cover: { image_id: 'co1tmu' }, id: 103 },
        { name: 'Game 4', cover: { image_id: 'co1wyy' }, id: 104 },
        { name: 'Game 5', cover: { image_id: 'co1qky' }, id: 105 }
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
