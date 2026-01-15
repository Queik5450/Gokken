function qs(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function apiBase(){
    return `https://gokken-seven.vercel.app`;
}

const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);

function logoUrlPlatform(p){
    const id = p.platform_logo ? p.platform_logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/260x200/222/fff?text=Hardware';
}

function coverUrl(game){
    const id = game && game.cover ? game.cover.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg` : 'https://placehold.co/264x352/222/fff?text=Sin+portada';
}

function categoryLabel(cat){
    const map = {
        1: ['platform.categoryConsole', 'Consola'],
        2: ['platform.categoryArcade', 'Arcade'],
        3: ['platform.categoryPlatform', 'Plataforma'],
        4: ['platform.categoryOS', 'Sistema operativo'],
        5: ['platform.categoryPortable', 'Portátil'],
        6: ['platform.categoryComputer', 'Computadora']
    };
    const entry = map[cat];
    return entry ? tr(entry[0], entry[1]) : tr('common.na', 'N/A');
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

async function fetchPlatformGames(platformId, limit = 8){
    if(!platformId) return [];
    const safeLimit = Math.min(Math.max(Number(limit) || 1, 1), 50);
    const url = `${apiBase()}/api/games/by-platform?id=${encodeURIComponent(platformId)}&limit=${safeLimit}`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        const payload = await res.json();
        if(Array.isArray(payload)) return payload;
        return payload.items || [];
    }catch(e){
        console.error('Platform games fetch error', e);
        return [];
    }
}

function renderPlatform(root, data){
    if(!root) return;
    const family = data.platform_family ? data.platform_family.name : null;
    const metaParts = [data.abbreviation || null, family || null, data.generation ? `Gen ${data.generation}` : null].filter(Boolean);
    const metaText = metaParts.join(' · ') || tr('results.hardwareDefault', 'Hardware');
    const toHost = (url='') => { try { return new URL(url).hostname; } catch { return url.replace(/^https?:\/\//,''); } };
    const links = (data.websites || []).slice(0,3).map(w => {
        const host = toHost(w.url);
        return `<a class="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-surface text-primary hover:border-primary transition" href="${w.url}" target="_blank" rel="noreferrer noopener">${host || tr('common.link', 'link')}</a>`;
    }).join(' ');

    const FALLBACK_FEATURED = [
        { id: 1, name: 'God of War', cover: { image_id: 'co1tmu' } },
        { id: 2, name: 'Ghost of Tsushima', cover: { image_id: 'co3p23' } },
        { id: 3, name: 'Marvel Spider-Man', cover: { image_id: 'co4x5f' } },
        { id: 4, name: 'Ghost of Tsushima', cover: { image_id: 'co3p23' } }
    ];

    const gallery = [logoUrlPlatform(data), logoUrlPlatform(data), logoUrlPlatform(data), logoUrlPlatform(data)];
    const heroImage = logoUrlPlatform(data);
    const specList = [
        tr('platform.spec1', 'CPU y GPU personalizadas'),
        tr('platform.spec2', 'Memoria GDDR6 de alta velocidad'),
        tr('platform.spec3', 'Almacenamiento NVMe ultrarrápido'),
        family ? `${tr('platform.familyLabel', 'Familia')}: ${family}` : tr('platform.spec4Fallback', 'Compatibilidad multimedia avanzada')
    ];
    const versions = [
        tr('platform.versionSlim', 'Slim'),
        tr('platform.versionPro', 'Pro'),
        tr('platform.versionDigital', 'Edición Digital')
    ];
    const featuredList = Array.isArray(data.featuredGames) && data.featuredGames.length ? data.featuredGames : FALLBACK_FEATURED;

    const gameHref = (g) => {
        if (!g) return '#';
        if (g.id) return `game.html?id=${g.id}`;
        if (g.slug) return `game.html?slug=${g.slug}`;
        return '#';
    };

    root.innerHTML = `
        <div class="space-y-10">
            <div class="text-center">
                <h1 class="text-4xl font-black tracking-tight uppercase">${data.name || tr('search.platformDefault', 'Consola')}</h1>
                <p class="text-gray-400 mt-1">${metaText}</p>
            </div>

            <section class="grid lg:grid-cols-[260px,1fr] gap-8 items-start">
                <div class="flex lg:flex-col gap-3 justify-center lg:justify-start">
                    ${gallery.map((src, idx) => `
                        <div class="w-16 h-16 rounded-xl border border-border bg-panel overflow-hidden flex items-center justify-center shadow-md shadow-black/30">
                            <img src="${src}" alt="${tr('platform.viewAlt', 'Vista')} ${idx + 1}" class="w-full h-full object-cover">
                        </div>
                    `).join('')}
                </div>

                <div class="bg-panel border border-border rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                    <div class="flex flex-col lg:flex-row">
                        <div class="relative lg:w-3/5 bg-neutral-900">
                            <img src="${heroImage}" alt="${data.name}" class="w-full h-full object-contain bg-neutral-900">
                            <div class="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                        <div class="flex-1 bg-surface/70 backdrop-blur px-6 py-6 flex flex-col gap-5">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <h2 class="text-xl font-semibold text-gray-100">${tr('platform.specifications', 'Especificaciones')}</h2>
                                    <p class="text-sm text-gray-400">${metaText}</p>
                                </div>
                                <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase border border-primary/60">${categoryLabel(data.category)}</span>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${specList.map(s => `<span class="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 text-gray-100 text-xs font-semibold border border-primary/40">${s}</span>`).join('')}
                            </div>
                            <div class="border-t border-border pt-4 mt-auto grid grid-cols-2 gap-3 text-sm text-gray-200">
                                <div>
                                    <div class="text-gray-400">${tr('platform.manufacturer', 'Fabricante')}</div>
                                    <div class="font-semibold">${family || tr('common.noData', 'Sin datos')}</div>
                                </div>
                                <div>
                                    <div class="text-gray-400">${tr('platform.generation', 'Generación')}</div>
                                    <div class="font-semibold">${data.generation || tr('common.na', 'N/A')}</div>
                                </div>
                                <div>
                                    <div class="text-gray-400">${tr('platform.links', 'Enlaces')}</div>
                                    <div class="flex flex-wrap gap-2 mt-1">${links || `<span class="text-gray-500">${tr('common.noLinks', 'Sin enlaces')}</span>`}</div>
                                </div>
                                <div>
                                    <div class="text-gray-400">${tr('platform.abbreviation', 'Abreviatura')}</div>
                                    <div class="font-semibold">${data.abbreviation || tr('common.na', 'N/A')}</div>
                                </div>
                            </div>
                        </div>
                        <div class="hidden lg:flex w-56 flex-col gap-3 border-l border-border bg-panel/80 px-5 py-6">
                            <h3 class="text-lg font-semibold text-gray-100">${tr('platform.otherVersions', 'Otras versiones')}</h3>
                            <div class="flex flex-wrap gap-2">
                                ${versions.map(v => `<span class="inline-flex items-center px-3 py-1 rounded-full bg-surface border border-border text-primary text-xs font-semibold">${v}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-black text-gray-100">${tr('platform.featuredGames', 'Juegos Destacados')}</h2>
                    <a href="#" class="text-primary font-semibold flex items-center gap-2 hover:underline">${tr('common.viewAll', 'Ver todos')} <i class="fa-solid fa-chevron-right"></i></a>
                </div>
                <div class="flex items-center gap-3">
                    <button class="w-10 h-10 flex items-center justify-center rounded-full border border-border bg-panel text-primary hover:border-primary"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="flex gap-4 overflow-x-auto pb-3">
                        ${featuredList.map(g => `
                            <a class="w-48 bg-panel border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/30 flex-shrink-0 hover:border-primary" href="${gameHref(g)}">
                                <div class="h-60 bg-neutral-800">
                                    <img src="${coverUrl(g)}" alt="${g.name || g.title || tr('search.tagGame', 'Juego')}" class="w-full h-full object-cover">
                                </div>
                                <div class="bg-primary/90 text-white text-center text-sm font-semibold py-3">${g.name || g.title || tr('search.tagGame', 'Juego')}</div>
                            </a>
                        `).join('')}
                    </div>
                    <button class="w-10 h-10 flex items-center justify-center rounded-full border border-border bg-panel text-primary hover:border-primary"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </section>
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', async () => {
    const id = qs('id');
    const slug = qs('slug');
    const root = document.getElementById('platformRoot');
    if(!id && !slug){
        if(root) root.innerHTML = `<div class="list-placeholder">${tr('platform.notFound', 'Consola no encontrada')}</div>`;
        return;
    }
    const data = await fetchPlatform(id, slug);
    let games = [];
    if(data && (data.id || id)){
        games = await fetchPlatformGames(data.id || id, 8);
    }
    renderPlatform(root, { ...data, featuredGames: games });
});
