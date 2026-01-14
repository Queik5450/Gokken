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
    const locale = window.__GOKKEN_LOCALE__ || 'es-ES';
    return date.toLocaleDateString(locale, { day:'2-digit', month:'short', year:'numeric' });
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

async function fetchGamesByGenre(id, page){
    const base = apiBase();
    const url = `${base}/api/games/by-genre?id=${encodeURIComponent(id)}&limit=30&page=${encodeURIComponent(page||1)}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
}

async function fetchGamesByPlatform(id, page){
    const base = apiBase();
    const url = `${base}/api/games/by-platform?id=${encodeURIComponent(id)}&limit=30&page=${encodeURIComponent(page||1)}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
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
    const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
    const na = tr('common.na', 'N/A');
    const noDate = tr('common.noDate', 'Sin fecha');
    const gid = g.id || g.slug || encodeURIComponent((g.name||'').replace(/\s+/g,'-').toLowerCase());
    const row = document.createElement('div');
    row.className = 'result-row flex items-center gap-4 bg-panel border border-border rounded-xl p-3 hover:border-primary transition cursor-pointer';
    row.innerHTML = `
        <div class="result-cover w-16 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-border shrink-0"><img src="${coverUrl(g)}" alt="${g.name}" class="w-full h-full object-cover"></div>
        <div class="result-main flex-1 min-w-0">
            <div class="result-title text-base font-semibold text-gray-100 truncate">${g.name}</div>
            <div class="result-meta text-sm text-gray-400">${formatDate(g.first_release_date) || noDate}</div>
        </div>
        <div class="result-rating ${g.rating ? '' : 'empty'} text-sm font-semibold px-3 py-1 rounded-full border ${g.rating ? 'border-primary text-primary' : 'border-border text-gray-400'}">${g.rating ? g.rating.toFixed(1) : na}</div>
    `;
    row.addEventListener('click', ()=> window.location.href = `game.html?id=${gid}`);
    return row;
}

function buildCompanyRow(c){
    const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
    const countryCodeLabel = tr('search.countryCodeLabel', 'País código');
    const unknownLocation = tr('results.unknownLocation', 'Ubicación desconocida');
    const foundedLabel = tr('results.foundedLabel', 'Fundado');
    const noDate = tr('common.noDate', 'Sin fecha');
    const cid = c.id || c.slug || '';
    const countryTxt = c.country ? `${countryCodeLabel}: ${c.country}` : unknownLocation;
    const founded = formatDate(c.start_date) || noDate;
    const row = document.createElement('div');
    row.className = 'result-row flex items-center gap-4 bg-panel border border-border rounded-xl p-3 hover:border-primary transition cursor-pointer';
    row.innerHTML = `
        <div class="result-cover w-16 h-16 rounded-lg overflow-hidden bg-neutral-900 border border-border shrink-0 flex items-center justify-center"><img src="${logoUrlCompany(c)}" alt="${c.name}" class="w-full h-full object-contain"></div>
        <div class="result-main flex-1 min-w-0">
            <div class="result-title text-base font-semibold text-gray-100 truncate">${c.name}</div>
            <div class="result-meta text-sm text-gray-400">${countryTxt} · ${foundedLabel}: ${founded}</div>
        </div>
        <div class="result-rating empty text-[11px] font-semibold px-3 py-1 rounded-full border border-primary text-primary uppercase tracking-wide">${tr('search.tagCompany','Compañía')}</div>
    `;
    row.addEventListener('click', ()=> window.location.href = `company.html?id=${cid}`);
    return row;
}

function buildPlatformRow(p){
    const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
    const pid = p.id || p.slug || '';
    const family = p.platform_family ? p.platform_family.name : '';
    const metaParts = [p.abbreviation || null, family || null, p.generation ? `Gen ${p.generation}` : null].filter(Boolean);
    const meta = metaParts.join(' · ') || tr('results.hardwareDefault', 'Hardware');
    const row = document.createElement('div');
    row.className = 'result-row flex items-center gap-4 bg-panel border border-border rounded-xl p-3 hover:border-primary transition cursor-pointer';
    row.innerHTML = `
        <div class="result-cover w-16 h-16 rounded-lg overflow-hidden bg-neutral-900 border border-border shrink-0 flex items-center justify-center"><img src="${logoUrlPlatform(p)}" alt="${p.name}" class="w-full h-full object-contain"></div>
        <div class="result-main flex-1 min-w-0">
            <div class="result-title text-base font-semibold text-gray-100 truncate">${p.name}</div>
            <div class="result-meta text-sm text-gray-400">${meta}</div>
        </div>
        <div class="result-rating empty text-[11px] font-semibold px-3 py-1 rounded-full border border-primary text-primary uppercase tracking-wide">${tr('search.tagPlatform','Consola')}</div>
    `;
    row.addEventListener('click', ()=> window.location.href = `platform.html?id=${pid}`);
    return row;
}

document.addEventListener('DOMContentLoaded', async () => {
    const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
    const q = qs('q') || '';
    const genreId = qs('genreId');
    const platformId = qs('platformId');
    const genreName = qs('genreName');
    const platformName = qs('platformName');
    const pageParam = Number(qs('page') || '1') || 1;
    const gamesList = document.getElementById('resultsListGames');
    const gamesEmpty = document.getElementById('resultsEmptyGames');
    const companiesList = document.getElementById('resultsListCompanies');
    const companiesEmpty = document.getElementById('resultsEmptyCompanies');
    const platformsList = document.getElementById('resultsListPlatforms');
    const platformsEmpty = document.getElementById('resultsEmptyPlatforms');
    const summary = document.getElementById('resultsSummary');
    const pager = document.getElementById('resultsPager');
    const hideSection = (listEl) => {
        const section = listEl?.closest('.result-section');
        if(section) section.style.display = 'none';
    };

    if(genreId || platformId){
        hideSection(companiesList);
        hideSection(companiesEmpty);
        hideSection(platformsList);
        hideSection(platformsEmpty);
        try{
            const resp = genreId ? await fetchGamesByGenre(genreId, pageParam) : await fetchGamesByPlatform(platformId, pageParam);
            const games = resp.items || resp;
            const hasMore = typeof resp.hasMore === 'boolean' ? resp.hasMore : (Array.isArray(games) ? games.length >= 30 : false);
            if(summary){
                if(genreId){
                    const page = resp.page || pageParam;
                    if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                        summary.textContent = `${games.length} games in genre "${genreName || ''}" (page ${page})`.trim();
                    }else{
                        summary.textContent = `${games.length} juegos en el género "${genreName || ''}" (página ${page})`.trim();
                    }
                }else{
                    const page = resp.page || pageParam;
                    if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                        summary.textContent = `${games.length} games on platform "${platformName || ''}" (page ${page})`.trim();
                    }else{
                        summary.textContent = `${games.length} juegos en la plataforma "${platformName || ''}" (página ${page})`.trim();
                    }
                }
            }
            renderSection(gamesList, gamesEmpty, games, buildGameRow);
            if(pager){
                pager.innerHTML = '';
                const page = resp.page || pageParam;
                const prevBtn = document.createElement('button');
                prevBtn.textContent = tr('common.prev', 'Anterior');
                prevBtn.className = 'px-4 py-2 rounded-lg border border-border bg-panel text-gray-200 hover:border-primary transition disabled:opacity-50';
                prevBtn.disabled = page <= 1;
                prevBtn.addEventListener('click', ()=>{
                    const params = new URLSearchParams(window.location.search);
                    params.set('page', String(page - 1));
                    window.location.search = params.toString();
                });
                const nextBtn = document.createElement('button');
                nextBtn.textContent = tr('common.next', 'Siguiente');
                nextBtn.className = 'px-4 py-2 rounded-lg border border-border bg-panel text-gray-200 hover:border-primary transition disabled:opacity-50';
                nextBtn.disabled = !hasMore;
                nextBtn.addEventListener('click', ()=>{
                    const params = new URLSearchParams(window.location.search);
                    params.set('page', String(page + 1));
                    window.location.search = params.toString();
                });
                pager.appendChild(prevBtn);
                pager.appendChild(nextBtn);
                pager.style.display = 'flex';
                pager.className = 'results-pager flex items-center gap-3';
            }
        }catch(e){
            console.error('Category results fetch error', e);
            if(summary){
                if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                    summary.textContent = genreId
                        ? `0 games in genre "${genreName || ''}"`
                        : `0 games on platform "${platformName || ''}"`;
                }else{
                    summary.textContent = genreId
                        ? `0 juegos en el género "${genreName || ''}"`
                        : `0 juegos en la plataforma "${platformName || ''}"`;
                }
            }
            renderSection(gamesList, gamesEmpty, [], buildGameRow);
            if(pager) pager.style.display = 'none';
        }
        return;
    }

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
            if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                summary.textContent = `${g} games · ${c} companies · ${p} consoles for "${q}"`;
            }else{
                summary.textContent = `${g} juegos · ${c} compañías · ${p} consolas para "${q}"`;
            }
        }
        renderSection(gamesList, gamesEmpty, results.games, buildGameRow);
        renderSection(companiesList, companiesEmpty, results.companies, buildCompanyRow);
        renderSection(platformsList, platformsEmpty, results.platforms, buildPlatformRow);
    }catch(e){
        console.error('Results fetch error', e);
        if(summary){
            summary.textContent = (window.__GOKKEN_LANG__ || 'es') === 'en'
                ? `0 results for "${q}"`
                : `0 resultados para "${q}"`;
        }
        renderSection(gamesList, gamesEmpty, [], buildGameRow);
        renderSection(companiesList, companiesEmpty, [], buildCompanyRow);
        renderSection(platformsList, platformsEmpty, [], buildPlatformRow);
    }
});
