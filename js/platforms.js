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

function setQs(params){
    const sp = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([k,v]) => {
        if (v === null || v === undefined || v === '') sp.delete(k);
        else sp.set(k, String(v));
    });
    window.location.search = sp.toString();
}

const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);

const FALLBACK_PLATFORMS = [
    { id: 48, name: 'PlayStation 4', platform_logo: { image_id: 'pl6m' }, generation: 8 },
    { id: 49, name: 'Xbox One', platform_logo: { image_id: 'pl6n' }, generation: 8 },
    { id: 130, name: 'Nintendo Switch', platform_logo: { image_id: 'pl6p' }, generation: 8 },
    { id: 167, name: 'PlayStation 5', platform_logo: { image_id: 'pl76' }, generation: 9 },
    { id: 169, name: 'Xbox Series X|S', platform_logo: { image_id: 'pl79' }, generation: 9 }
];

function logoUrlPlatform(p){
    const id = p.platform_logo ? p.platform_logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/222/fff?text=HW';
}

function platformMeta(p){
    const family = p.platform_family ? p.platform_family.name : '';
    const parts = [p.abbreviation || null, family || null, p.generation ? `Gen ${p.generation}` : null].filter(Boolean);
    return parts.join(' · ') || tr('results.hardwareDefault', 'Hardware');
}

function renderPlatforms(gridEl, emptyEl, platforms){
    if(!gridEl || !emptyEl) return;
    gridEl.innerHTML = '';

    if(!platforms || !platforms.length){
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';

    platforms.forEach(p => {
        const pid = p.id || p.slug || '';
        const card = document.createElement('div');
        card.className = 'bg-panel border border-border rounded-xl p-3 hover:border-primary transition cursor-pointer flex flex-col items-center gap-2';
        card.innerHTML = `
            <div class="w-20 h-20 rounded-lg bg-neutral-900 border border-border overflow-hidden flex items-center justify-center">
                <img src="${logoUrlPlatform(p)}" alt="${p.name}" class="w-full h-full object-contain" loading="lazy">
            </div>
            <div class="text-center w-full">
                <div class="text-sm font-semibold text-gray-100 truncate">${p.name}</div>
                <div class="text-[11px] text-gray-400">${platformMeta(p)}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            if (pid) window.location.href = `platform.html?id=${encodeURIComponent(pid)}`;
        });
        gridEl.appendChild(card);
    });
}

async function fetchPlatformsPage(page, limit){
    const base = apiBase();
    try {
        const res = await fetch(`${base}/api/platforms/all?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`);
        if(!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        const hasMore = typeof data?.hasMore === 'boolean' ? data.hasMore : false;
        const safeItems = items.length ? items : FALLBACK_PLATFORMS;
        return { items: safeItems, hasMore: items.length ? hasMore : false, page: data?.page || page, limit: data?.limit || limit };
    } catch (err) {
        console.warn('Platforms all endpoint failed, falling back', err);
        try {
            const fallbackRes = await fetch(`${base}/api/platforms?limit=${encodeURIComponent(limit)}`);
            if(!fallbackRes.ok) throw new Error(fallbackRes.statusText);
            const data = await fallbackRes.json();
            const items = Array.isArray(data) ? data : (data.items || []);
            const safeItems = items.length ? items : FALLBACK_PLATFORMS;
            return { items: safeItems, hasMore: false, page, limit };
        } catch (fallbackErr) {
            console.warn('Platforms fallback failed, using local list', fallbackErr);
            return { items: FALLBACK_PLATFORMS, hasMore: false, page, limit };
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('platformsGrid');
    const empty = document.getElementById('platformsEmpty');
    const summary = document.getElementById('platformsSummary');
    const prevBtn = document.getElementById('platformsPrev');
    const nextBtn = document.getElementById('platformsNext');

    const page = Math.max(Number(qs('page') || 1), 1);
    const limit = Math.min(Math.max(Number(qs('limit') || 30), 1), 50);

    try{
        const resp = await fetchPlatformsPage(page, limit);
        const items = resp.items || [];
        const hasMore = !!resp.hasMore;

        renderPlatforms(grid, empty, items);

        if(summary){
            const lang = window.__GOKKEN_LANG__ || 'es';
            if(lang === 'en') summary.textContent = `${items.length} platforms (page ${page})`;
            else summary.textContent = `${items.length} consolas (página ${page})`;
        }

        if(prevBtn){
            prevBtn.disabled = page <= 1;
            prevBtn.addEventListener('click', () => setQs({ page: page - 1, limit }));
        }

        if(nextBtn){
            nextBtn.disabled = !hasMore;
            nextBtn.addEventListener('click', () => setQs({ page: page + 1, limit }));
        }
    }catch(e){
        console.error('Platforms page load failed', e);
        renderPlatforms(grid, empty, []);
        if(summary){
            const lang = window.__GOKKEN_LANG__ || 'es';
            summary.textContent = lang === 'en' ? '0 platforms' : '0 consolas';
        }
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
    }
});
