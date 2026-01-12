function qs(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

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

function logoUrlPlatform(p){
    const id = p.platform_logo ? p.platform_logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/260x200/222/fff?text=Hardware';
}

function categoryLabel(cat){
    const map = { 1: 'Consola', 2: 'Arcade', 3: 'Plataforma', 4: 'Sistema operativo', 5: 'Portátil', 6: 'Computadora' };
    return map[cat] || 'N/D';
}

const FALLBACK_PLATFORM = {
    name: 'Plataforma genérica',
    abbreviation: 'GEN',
    summary: 'Descripción no disponible en este momento.',
    generation: null,
    platform_family: { name: 'Sin familia' },
    category: null,
    platform_logo: null,
    websites: []
};

async function fetchPlatform(id, slug){
    const param = id ? `id=${encodeURIComponent(id)}` : `slug=${encodeURIComponent(slug)}`;
    const url = `${apiBase()}/api/platform?${param}`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    }catch(e){
        console.error('Platform fetch error', e);
        return FALLBACK_PLATFORM;
    }
}

function renderPlatform(root, data){
    if(!root) return;
    const family = data.platform_family ? data.platform_family.name : null;
    const metaParts = [data.abbreviation || null, family || null, data.generation ? `Gen ${data.generation}` : null].filter(Boolean);
    const metaText = metaParts.join(' · ') || 'Hardware';
    const links = (data.websites || []).slice(0,3).map(w => {
        let host = 'link';
        try { host = new URL(w.url).hostname; } catch(_) { /* ignore */ }
        return `<a href="${w.url}" target="_blank" rel="noreferrer">${host}</a>`;
    }).join(' ');

    root.innerHTML = `
        <div class="platform-hero">
            <div class="platform-logo"><img src="${logoUrlPlatform(data)}" alt="${data.name}"></div>
            <div class="platform-info">
                <h1>${data.name}</h1>
                <div class="platform-meta">${metaText}</div>
                <div class="platform-links">${links || '<span class="muted">Sin enlaces</span>'}</div>
            </div>
        </div>
        <div class="platform-body">
            <div class="platform-summary info-block">
                <h4>Descripción</h4>
                <p>${data.summary || 'Sin descripción disponible.'}</p>
            </div>
            <div class="info-grid">
                <div class="stat-box">
                    <span class="stat-label">Abreviatura</span>
                    <span class="stat-value">${data.abbreviation || 'N/D'}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Generación</span>
                    <span class="stat-value">${data.generation || 'N/D'}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Familia</span>
                    <span class="stat-value">${family || 'N/D'}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Categoría</span>
                    <span class="stat-value">${categoryLabel(data.category)}</span>
                </div>
            </div>
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', async () => {
    const id = qs('id');
    const slug = qs('slug');
    const root = document.getElementById('platformRoot');
    if(!id && !slug){
        if(root) root.innerHTML = '<div class="list-placeholder">Consola no encontrada</div>';
        return;
    }
    const data = await fetchPlatform(id, slug);
    renderPlatform(root, data);
});
