function apiBase(){
    const hinted = window.__API_BASE__;
    if (hinted) return hinted.replace(/\/$/, '');
    const { protocol, hostname } = window.location;
    const host = hostname || 'localhost';
    const port = 8080;
    return `${protocol.includes('http') ? 'http' : 'http'}://${host}:${port}`;
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
    return new Date(ts*1000).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}

async function fetchReleases(kind){
    const url = `${apiBase()}/api/games/${kind}?days=90&limit=100`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
}

function renderList(list, empty, summary, kind, games){
    if(!list || !empty) return;
    list.innerHTML = '';
    if(!games || !games.length){
        empty.style.display = 'block';
        if(summary) summary.textContent = `0 resultados`;
        return;
    }
    empty.style.display = 'none';
    if(summary) summary.textContent = `${games.length} resultados`;

    games.forEach(g => {
        const gid = g.id || g.slug || encodeURIComponent((g.name||'').replace(/\s+/g,'-').toLowerCase());
        const row = document.createElement('div');
        row.className = 'result-row';
        row.innerHTML = `
            <div class="result-cover"><img src="${coverUrl(g)}" alt="${g.name}"></div>
            <div class="result-main">
                <div class="result-title">${g.name}</div>
                <div class="result-meta">${g.first_release_date ? formatDate(g.first_release_date) : ''}</div>
            </div>
            <div class="result-rating ${g.rating ? '' : 'empty'}">${g.rating ? g.rating.toFixed(1) : 'N/A'}</div>
        `;
        row.addEventListener('click', ()=> window.location.href = `game.html?id=${gid}`);
        list.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const kind = (qs('kind') || 'recent').toLowerCase();
    const titleEl = document.getElementById('releaseTitle');
    const list = document.getElementById('releaseList');
    const empty = document.getElementById('releaseEmpty');
    const summary = document.getElementById('releaseSummary');

    const isRecent = kind === 'recent';
    if(titleEl) titleEl.textContent = isRecent ? 'Recientes' : 'Próximamente';

    try{
        const data = await fetchReleases(isRecent ? 'recent' : 'upcoming');
        renderList(list, empty, summary, kind, data);
    }catch(e){
        console.error('Releases fetch error', e);
        renderList(list, empty, summary, kind, []);
    }
});
