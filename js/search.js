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

async function fetchSuggestions(q, signal){
    const base = apiBase();
    const urlAll = `${base}/api/search/all?q=${encodeURIComponent(q)}&limit=6`;
    try {
        const res = await fetch(urlAll, { signal });
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    } catch (err) {
        console.warn('Suggest combined failed, falling back per entity', err);
        let sawOffline = false;
        const safeFetch = async (path) => {
            try {
                const r = await fetch(`${base}${path}`, { signal });
                if(!r.ok) throw new Error(r.statusText);
                return await r.json();
            } catch (e) {
                if (e instanceof TypeError || String(e).toLowerCase().includes('failed to fetch')) {
                    sawOffline = true;
                }
                console.warn('Suggest fallback failed', path, e);
                return [];
            }
        };

        const [games, companies, platforms] = await Promise.all([
            safeFetch(`/api/search/games?q=${encodeURIComponent(q)}&limit=4`),
            safeFetch(`/api/search/companies?q=${encodeURIComponent(q)}&limit=3`),
            safeFetch(`/api/search/platforms?q=${encodeURIComponent(q)}&limit=3`)
        ]);
        const allEmpty = (!games || games.length === 0) && (!companies || companies.length === 0) && (!platforms || platforms.length === 0);
        return { games, companies, platforms, __offline: sawOffline && allEmpty };
    }
}

function setupNavSearch(){
    const input = document.querySelector('.search-input-wrapper input');
    const icon = document.querySelector('.search-input-wrapper i');
    const wrapper = document.querySelector('.search-input-wrapper');
    if(!input || !wrapper) return;

    const box = document.createElement('div');
    box.className = 'search-suggestions';
    wrapper.appendChild(box);

    let timer = null;
    const suggestionCache = new Map(); // q -> { at, data }
    const ttlMs = 60 * 1000;
    let inFlight = null;
    let controller = null;

    function hideSuggestions(){ box.style.display = 'none'; }
    function showSuggestions(){ box.style.display = box.innerHTML.trim() ? 'block' : 'none'; }

    function renderSuggestions(payload){
        if(!payload){ box.innerHTML=''; hideSuggestions(); return; }
        if (payload.__offline) {
            const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
            const title = tr('search.apiOfflineTitle', 'API apagada');
            const meta = tr('search.apiOfflineMeta', 'Inicia el backend en http://localhost:8080');
            box.innerHTML = `
                <div class="search-suggestion" data-href="">
                    <span class="ss-tag">Info</span>
                    <img src="https://placehold.co/46x46/222/fff?text=!" alt="offline">
                    <div class="ss-main">
                        <div class="ss-title">${title}</div>
                        <div class="ss-meta">${meta}</div>
                    </div>
                </div>
            `;
            showSuggestions();
            return;
        }
        const games = payload.games || payload; // support old array shape
        const companies = payload.companies || [];
        const platforms = payload.platforms || [];

        const rows = [];
        const addRow = (type, label, img, title, meta, href) => {
            rows.push(`
                <div class="search-suggestion" data-href="${href}">
                    <span class="ss-tag">${label}</span>
                    <img src="${img}" alt="${title}">
                    <div class="ss-main">
                        <div class="ss-title">${title}</div>
                        <div class="ss-meta">${meta}</div>
                    </div>
                </div>
            `);
        };

        const locale = window.__GOKKEN_LOCALE__ || 'es-ES';
        const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
        const na = tr('common.na', 'N/A');
        const noDate = tr('common.noDate', 'Sin fecha');
        const tagGame = tr('search.tagGame', 'Juego');
        const tagCompany = tr('search.tagCompany', 'Compañía');
        const tagPlatform = tr('search.tagPlatform', 'Consola');

        games.slice(0,4).forEach(it=>{
            const img = it.cover && it.cover.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_small/${it.cover.image_id}.jpg` : 'https://placehold.co/46x46/222/fff?text=G';
            const meta = `${it.rating ? it.rating.toFixed(1) : na} · ${it.first_release_date ? new Date(it.first_release_date*1000).toLocaleDateString(locale) : noDate}`;
            addRow('game', tagGame, img, it.name, meta, `game.html?id=${it.id || it.slug || ''}`);
        });

        companies.slice(0,3).forEach(c=>{
            const img = c.logo && c.logo.image_id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${c.logo.image_id}.png` : 'https://placehold.co/46x46/222/fff?text=C';
            const meta = c.country ? `${tr('search.countryCodeLabel', 'País código')}: ${c.country}` : tr('search.companyDefault', 'Compañía');
            addRow('company', tagCompany, img, c.name, meta, `company.html?id=${c.id || c.slug || ''}`);
        });

        platforms.slice(0,3).forEach(p=>{
            const img = p.platform_logo && p.platform_logo.image_id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${p.platform_logo.image_id}.png` : 'https://placehold.co/46x46/222/fff?text=P';
            const family = p.platform_family ? p.platform_family.name : '';
            const metaParts = [p.abbreviation || null, family || null, p.generation ? `Gen ${p.generation}` : null].filter(Boolean);
            const meta = metaParts.join(' · ') || tr('search.platformDefault', 'Consola');
            addRow('platform', tagPlatform, img, p.name, meta, `platform.html?id=${p.id || p.slug || ''}`);
        });

        if(!rows.length){ box.innerHTML=''; hideSuggestions(); return; }
        box.innerHTML = rows.join('');
        showSuggestions();
        box.querySelectorAll('.search-suggestion').forEach(item=>{
            item.addEventListener('click', ()=>{
                const href = item.getAttribute('data-href');
                if(href) window.location.href = href;
            });
        });
    }

    async function handleInput(){
        const q = (input.value || '').trim();
        if(q.length < 2){ box.innerHTML=''; hideSuggestions(); return; }

        const cached = suggestionCache.get(q);
        const now = Date.now();
        if(cached && now - cached.at < ttlMs){
            renderSuggestions(cached.data);
            return;
        }

        const ticket = Symbol('req');
        inFlight = ticket;
        try{
            if (controller) controller.abort();
            controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const results = await fetchSuggestions(q, controller.signal);
            clearTimeout(timeoutId);
            if(inFlight !== ticket) return; // stale
            suggestionCache.set(q, { at: Date.now(), data: results });
            renderSuggestions(results);
        }catch(e){
            if(inFlight === ticket){
                console.error('Suggest error', e);
                hideSuggestions();
            }
        }
    }

    function go(){
        const q = (input.value || '').trim();
        if(!q) return;
        window.location.href = `results.html?q=${encodeURIComponent(q)}`;
    }

    input.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
            e.preventDefault();
            hideSuggestions();
            go();
        }
    });

    input.addEventListener('input', ()=>{
        clearTimeout(timer);
        timer = setTimeout(handleInput, 350);
    });

    icon?.addEventListener('click', ()=>{ hideSuggestions(); go(); });
    document.addEventListener('click', (e)=>{ if(!wrapper.contains(e.target)) hideSuggestions(); });
}

document.addEventListener('DOMContentLoaded', setupNavSearch);
