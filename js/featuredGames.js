function apiBase(){
    return `https://gokken-seven.vercel.app`;
}

function qs(name, url = window.location.href) {
    name = name.replace(/[[]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);

function coverUrl(game){
    const id = game && game.cover ? game.cover.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg` : 'https://placehold.co/264x352/222/fff?text=Sin+portada';
}

function normalizeGameId(game){
    if (game.id !== undefined) return game.id;
    if (game.slug) return game.slug;
    const safe = (game.name || '').replace(/\s+/g, '-').toLowerCase();
    return encodeURIComponent(safe);
}

function renderGames(gridEl, emptyEl, games, platformName){
    if(!gridEl || !emptyEl) return;
    gridEl.innerHTML = '';

    if(!games || !games.length){
        emptyEl.style.display = 'block';
        return;
    }
    emptyEl.style.display = 'none';

    games.forEach(g => {
        const gid = normalizeGameId(g);
        const card = document.createElement('a');
        card.href = `game.html?id=${gid}`;
        card.className = 'bg-panel border border-border rounded-xl overflow-hidden hover:border-primary transition block';
        card.innerHTML = `
            <div class="h-56 bg-neutral-800"><img src="${coverUrl(g)}" alt="${g.name}" class="w-full h-full object-cover"></div>
            <div class="bg-primary/90 text-white text-center text-sm font-semibold py-3 leading-snug min-h-[60px] flex items-center justify-center px-3">${g.name}</div>
            <div class="px-3 py-2 text-xs text-gray-300 flex items-center justify-between">
                <span>${tr('platform.generation','Generación')}: ${g.first_release_date ? new Date(g.first_release_date*1000).getFullYear() : tr('common.na','N/A')}</span>
                <span class="font-semibold ${g.rating ? 'text-primary' : 'text-gray-400'}">${g.rating ? g.rating.toFixed(1) : tr('common.noRating','Sin rating')}</span>
            </div>
        `;
        gridEl.appendChild(card);
    });
}

async function fetchPlatform(id, slug){
    const param = id ? `id=${encodeURIComponent(id)}` : `slug=${encodeURIComponent(slug)}`;
    const lang = encodeURIComponent(window.__GOKKEN_LOCALE__ || 'es-ES');
    const url = `${apiBase()}/api/platform?${param}&lang=${lang}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
}

async function fetchGames(platformId){
    const url = `${apiBase()}/api/games/by-platform?id=${encodeURIComponent(platformId)}&limit=100`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    return [...items].sort((a,b)=>{
        const ar = typeof a.rating === 'number' ? a.rating : -1;
        const br = typeof b.rating === 'number' ? b.rating : -1;
        return br - ar;
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('gamesGrid');
    const empty = document.getElementById('emptyState');
    const summary = document.getElementById('summary');
    const breadcrumb = document.getElementById('platformBreadcrumb');
    const pid = qs('id');
    const slug = qs('slug');

    if(!pid && !slug){
        renderGames(grid, empty, [], '');
        if(summary) summary.textContent = tr('platform.notFound','Consola no encontrada');
        return;
    }

    try{
        const platform = await fetchPlatform(pid, slug);
        const games = await fetchGames(platform?.id || pid);
        renderGames(grid, empty, games, platform?.name || '');
        if(summary){
            const lang = window.__GOKKEN_LANG__ || 'es';
            const count = games.length;
            summary.textContent = lang === 'en' ? `${count} games (rating desc)` : `${count} juegos (por rating)`;
        }
        if(breadcrumb){
            breadcrumb.textContent = platform?.name ? `${platform.name} · ${tr('platform.featuredGames','Juegos Destacados')}` : tr('platform.featuredGames','Juegos Destacados');
        }
    }catch(e){
        console.error('Featured games load failed', e);
        renderGames(grid, empty, [], '');
        if(summary){
            summary.textContent = tr('common.noResults','Sin resultados');
        }
    }
});
