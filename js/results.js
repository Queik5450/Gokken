function apiBase(){
    const hinted = window.__API_BASE__;
    if (hinted) return hinted.replace(/\/$/, '');
    const { protocol, hostname, port } = window.location;
    const proto = protocol === 'https:' ? 'https' : 'http';
    const host = hostname || 'localhost';
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

    if (isLocal) {
        return `${proto}://localhost:8080`;
    }

    const usePort = port ? `:${port}` : '';
    return `${proto}://${host}${usePort}`;
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
    const date = typeof ts === 'number' ? new Date(ts*1000) : new Date(ts);
    if(Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}

function logoUrlCompany(c){
    const id = c.logo ? c.logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/222/fff?text=Logo';
}

function logoUrlPlatform(p){
    const id = p.platform_logo ? p.platform_logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/222/fff?text=HW';
}

async function fetchResults(query){
    const base = apiBase();
    const urlAll = `${base}/api/search/all?q=${encodeURIComponent(query)}&limit=20`;
    try {
        const res = await fetch(urlAll);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    } catch (err) {
        console.warn('Combined search failed, attempting per-entity fallback', err);
        const safeFetch = async (path) => {
            try {
                const r = await fetch(`${base}${path}`);
                if(!r.ok) throw new Error(r.statusText);
                return await r.json();
            } catch (e) {
                console.warn('Fallback fetch failed', path, e);
                return [];
            }
        };

        const [games, companies, platforms] = await Promise.all([
            safeFetch(`/api/search/games?q=${encodeURIComponent(query)}&limit=20`),
            safeFetch(`/api/search/companies?q=${encodeURIComponent(query)}&limit=20`),
            safeFetch(`/api/search/platforms?q=${encodeURIComponent(query)}&limit=20`)
        ]);

        return { games, companies, platforms };
    }
}

function renderSection(list, empty, items, builder){
    if(!list || !empty) return;
    list.innerHTML = '';
    if(!items || !items.length){
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    items.forEach(item => list.appendChild(builder(item)));
}

function buildGameRow(g){
    const gid = g.id || g.slug || encodeURIComponent((g.name||'').replace(/\s+/g,'-').toLowerCase());
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `
        <div class="result-cover"><img src="${coverUrl(g)}" alt="${g.name}"></div>
        <div class="result-main">
            <div class="result-title">${g.name}</div>
            <div class="result-meta">${formatDate(g.first_release_date) || 'Sin fecha'}</div>
        </div>
        <div class="result-rating ${g.rating ? '' : 'empty'}">${g.rating ? g.rating.toFixed(1) : 'N/A'}</div>
    `;
    row.addEventListener('click', ()=> window.location.href = `game.html?id=${gid}`);
    return row;
}

function buildCompanyRow(c){
    const cid = c.id || c.slug || '';
    const countryTxt = c.country ? `País código: ${c.country}` : 'Ubicación desconocida';
    const founded = formatDate(c.start_date) || 'Sin fecha';
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `
        <div class="result-cover"><img src="${logoUrlCompany(c)}" alt="${c.name}"></div>
        <div class="result-main">
            <div class="result-title">${c.name}</div>
            <div class="result-meta">${countryTxt} · Fundado: ${founded}</div>
        </div>
        <div class="result-rating empty">Compañía</div>
    `;
    row.addEventListener('click', ()=> window.location.href = `company.html?id=${cid}`);
    return row;
}

function buildPlatformRow(p){
    const pid = p.id || p.slug || '';
    const family = p.platform_family ? p.platform_family.name : '';
    const metaParts = [p.abbreviation || null, family || null, p.generation ? `Gen ${p.generation}` : null].filter(Boolean);
    const meta = metaParts.join(' · ') || 'Hardware';
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `
        <div class="result-cover"><img src="${logoUrlPlatform(p)}" alt="${p.name}"></div>
        <div class="result-main">
            <div class="result-title">${p.name}</div>
            <div class="result-meta">${meta}</div>
        </div>
        <div class="result-rating empty">Consola</div>
    `;
    row.addEventListener('click', ()=> window.location.href = `platform.html?id=${pid}`);
    return row;
}

document.addEventListener('DOMContentLoaded', async () => {
    const q = qs('q') || '';
    const gamesList = document.getElementById('resultsListGames');
    const gamesEmpty = document.getElementById('resultsEmptyGames');
    const companiesList = document.getElementById('resultsListCompanies');
    const companiesEmpty = document.getElementById('resultsEmptyCompanies');
    const platformsList = document.getElementById('resultsListPlatforms');
    const platformsEmpty = document.getElementById('resultsEmptyPlatforms');
    const summary = document.getElementById('resultsSummary');
    if(!q){
        renderSection(gamesList, gamesEmpty, [] , buildGameRow);
        renderSection(companiesList, companiesEmpty, [], buildCompanyRow);
        renderSection(platformsList, platformsEmpty, [], buildPlatformRow);
        return;
    }
    try{
        const results = await fetchResults(q);
        if(summary){
            const g = results.games?.length || 0;
            const c = results.companies?.length || 0;
            const p = results.platforms?.length || 0;
            summary.textContent = `${g} juegos · ${c} compañías · ${p} consolas para "${q}"`;
        }
        renderSection(gamesList, gamesEmpty, results.games, buildGameRow);
        renderSection(companiesList, companiesEmpty, results.companies, buildCompanyRow);
        renderSection(platformsList, platformsEmpty, results.platforms, buildPlatformRow);
    }catch(e){
        console.error('Results fetch error', e);
        if(summary){
            summary.textContent = `0 resultados para "${q}"`;
        }
        renderSection(gamesList, gamesEmpty, [], buildGameRow);
        renderSection(companiesList, companiesEmpty, [], buildCompanyRow);
        renderSection(platformsList, platformsEmpty, [], buildPlatformRow);
    }
});
