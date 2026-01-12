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

async function fetchSuggestions(q){
    const base = apiBase();
    const urlAll = `${base}/api/search/all?q=${encodeURIComponent(q)}&limit=6`;
    try {
        const res = await fetch(urlAll);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    } catch (err) {
        console.warn('Suggest combined failed, falling back per entity', err);
        const safeFetch = async (path) => {
            try {
                const r = await fetch(`${base}${path}`);
                if(!r.ok) throw new Error(r.statusText);
                return await r.json();
            } catch (e) {
                console.warn('Suggest fallback failed', path, e);
                return [];
            }
        };

        const [games, companies, platforms] = await Promise.all([
            safeFetch(`/api/search/games?q=${encodeURIComponent(q)}&limit=4`),
            safeFetch(`/api/search/companies?q=${encodeURIComponent(q)}&limit=3`),
            safeFetch(`/api/search/platforms?q=${encodeURIComponent(q)}&limit=3`)
        ]);
        return { games, companies, platforms };
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

    function hideSuggestions(){ box.style.display = 'none'; }
    function showSuggestions(){ box.style.display = box.innerHTML.trim() ? 'block' : 'none'; }

    function renderSuggestions(payload){
        if(!payload){ box.innerHTML=''; hideSuggestions(); return; }
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

        games.slice(0,4).forEach(it=>{
            const img = it.cover && it.cover.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_small/${it.cover.image_id}.jpg` : 'https://placehold.co/46x46/222/fff?text=G';
            const meta = `${it.rating ? it.rating.toFixed(1) : 'N/A'} · ${it.first_release_date ? new Date(it.first_release_date*1000).toLocaleDateString('es-ES') : 'Sin fecha'}`;
            addRow('game', 'Juego', img, it.name, meta, `game.html?id=${it.id || it.slug || ''}`);
        });

        companies.slice(0,3).forEach(c=>{
            const img = c.logo && c.logo.image_id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${c.logo.image_id}.png` : 'https://placehold.co/46x46/222/fff?text=C';
            const meta = c.country ? `País código: ${c.country}` : 'Compañía';
            addRow('company', 'Compañía', img, c.name, meta, `company.html?id=${c.id || c.slug || ''}`);
        });

        platforms.slice(0,3).forEach(p=>{
            const img = p.platform_logo && p.platform_logo.image_id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${p.platform_logo.image_id}.png` : 'https://placehold.co/46x46/222/fff?text=P';
            const family = p.platform_family ? p.platform_family.name : '';
            const metaParts = [p.abbreviation || null, family || null, p.generation ? `Gen ${p.generation}` : null].filter(Boolean);
            const meta = metaParts.join(' · ') || 'Consola';
            addRow('platform', 'Consola', img, p.name, meta, `platform.html?id=${p.id || p.slug || ''}`);
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
        try{
            const results = await fetchSuggestions(q);
            renderSuggestions(results);
        }catch(e){
            console.error('Suggest error', e);
            hideSuggestions();
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
        timer = setTimeout(handleInput, 200);
    });

    icon?.addEventListener('click', ()=>{ hideSuggestions(); go(); });
    document.addEventListener('click', (e)=>{ if(!wrapper.contains(e.target)) hideSuggestions(); });
}

document.addEventListener('DOMContentLoaded', setupNavSearch);
