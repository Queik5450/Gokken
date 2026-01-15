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

function setQs(params){
    const sp = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([k,v]) => {
        if (v === null || v === undefined || v === '') sp.delete(k);
        else sp.set(k, String(v));
    });
    window.location.search = sp.toString();
}

function logoUrlCompany(c){
    const id = c.logo ? c.logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/222/fff?text=Logo';
}

function renderCompanies(gridEl, emptyEl, companies){
    if(!gridEl || !emptyEl) return;
    gridEl.innerHTML = '';

    if(!companies || !companies.length){
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';

    companies.forEach(c => {
        const cid = c.id || c.slug || '';
        const card = document.createElement('div');
        card.className = 'bg-panel border border-border rounded-xl p-3 hover:border-primary transition cursor-pointer flex flex-col items-center gap-2';
        card.innerHTML = `
            <div class="w-20 h-20 rounded-lg bg-neutral-900 border border-border overflow-hidden flex items-center justify-center">
                <img src="${logoUrlCompany(c)}" alt="${c.name}" class="w-full h-full object-contain" loading="lazy">
            </div>
            <div class="text-center w-full">
                <div class="text-sm font-semibold text-gray-100 truncate">${c.name}</div>
                <div class="text-[11px] text-gray-400">${typeof c.avg_rating === 'number' ? `${c.avg_rating.toFixed(1)} / 100` : (typeof window.t === 'function' ? window.t('common.noRating','Sin rating') : 'Sin rating')}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            if (cid) window.location.href = `company.html?id=${encodeURIComponent(cid)}`;
        });
        gridEl.appendChild(card);
    });
}

async function fetchCompaniesPage(page, limit){
    const base = apiBase();
    const url = `${base}/api/companies/all?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
}

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('companiesGrid');
    const empty = document.getElementById('companiesEmpty');
    const summary = document.getElementById('companiesSummary');
    const prevBtn = document.getElementById('companiesPrev');
    const nextBtn = document.getElementById('companiesNext');

    const page = Math.max(Number(qs('page') || 1), 1);
    const limit = Math.min(Math.max(Number(qs('limit') || 30), 1), 50);

    try{
        const resp = await fetchCompaniesPage(page, limit);
        const items = resp.items || [];
        const hasMore = !!resp.hasMore;

        renderCompanies(grid, empty, items);

        if(summary){
            const lang = window.__GOKKEN_LANG__ || 'es';
            if(lang === 'en') summary.textContent = `${items.length} companies (page ${page})`;
            else summary.textContent = `${items.length} compañías (página ${page})`;
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
        console.error('Companies page load failed', e);
        renderCompanies(grid, empty, []);
        if(summary){
            const lang = window.__GOKKEN_LANG__ || 'es';
            summary.textContent = lang === 'en' ? '0 companies' : '0 compañías';
        }
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
    }
});
