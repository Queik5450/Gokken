async function getTopGames() 
{
    const url = 'http://localhost:8080/api/top-games';

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
        const container = document.querySelector('.game-cards-container');
        if (container)
        {
            container.innerHTML = '<p style="color: white; text-align: center;">Error loading games. Make sure the server is running.</p>';
        }
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
