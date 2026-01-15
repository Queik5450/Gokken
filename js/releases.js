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

function coverUrl(game){
    const id = game.cover ? game.cover.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg` : 'https://placehold.co/200x280/333/fff?text=Cover';
}

function formatDate(ts){
    if(!ts) return '';
    const locale = window.__GOKKEN_LOCALE__ || 'es-ES';
    return new Date(ts*1000).toLocaleDateString(locale, { day:'2-digit', month:'short', year:'numeric' });
}

async function fetchReleases(kind){
    const url = `${apiBase()}/api/games/${kind}?days=90&limit=100`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
}

function renderList(list, empty, summary, kind, games){
    const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
    const na = tr('common.na', 'N/A');
    if(!list || !empty) return;
    list.innerHTML = '';
    if(!games || !games.length){
        empty.style.display = 'block';
        if(summary) summary.textContent = `0 ${tr('releases.resultsWord', 'resultados')}`;
        return;
    }
    empty.style.display = 'none';
    if(summary) summary.textContent = `${games.length} ${tr('releases.resultsWord', 'resultados')}`;

    games.forEach(g => {
        const gid = g.id || g.slug || encodeURIComponent((g.name||'').replace(/\s+/g,'-').toLowerCase());
        const row = document.createElement('div');
        row.className = 'result-row flex items-center gap-4 bg-panel border border-border rounded-xl p-3 hover:border-primary transition cursor-pointer';
        row.innerHTML = `
            <div class="result-cover w-16 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-border shrink-0"><img src="${coverUrl(g)}" alt="${g.name}" class="w-full h-full object-cover"></div>
            <div class="result-main flex-1 min-w-0">
                <div class="result-title text-base font-semibold text-gray-100 truncate">${g.name}</div>
                <div class="result-meta text-sm text-gray-400">${g.first_release_date ? formatDate(g.first_release_date) : ''}</div>
            </div>
            <div class="result-rating ${g.rating ? '' : 'empty'} text-sm font-semibold px-3 py-1 rounded-full border ${g.rating ? 'border-primary text-primary' : 'border-border text-gray-400'}">${g.rating ? g.rating.toFixed(1) : na}</div>
        `;
        row.addEventListener('click', ()=> window.location.href = `game.html?id=${gid}`);
        list.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
    const kind = (qs('kind') || 'recent').toLowerCase();
    const titleEl = document.getElementById('releaseTitle');
    const list = document.getElementById('releaseList');
    const empty = document.getElementById('releaseEmpty');
    const summary = document.getElementById('releaseSummary');

    const isRecent = kind === 'recent';
    if(titleEl) titleEl.textContent = isRecent ? tr('main.recent', 'Recientes') : tr('main.upcoming', 'Próximamente');

    try{
        const data = await fetchReleases(isRecent ? 'recent' : 'upcoming');
        renderList(list, empty, summary, kind, data);
    }catch(e){
        console.error('Releases fetch error', e);
        renderList(list, empty, summary, kind, []);
    }
});
