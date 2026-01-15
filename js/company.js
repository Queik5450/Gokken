function qs(name, url = window.location.href) {
    name = name.replace(/[[]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function apiBase(){
    const hinted = window.__API_BASE__;
    if (hinted) return hinted.replace(/\/$/,'');
    const { protocol, hostname } = window.location;
    const host = hostname || 'localhost';
    const port = 8080;
    return `${protocol.includes('http')? 'http' : 'http'}://${host}:${port}`;
}

const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
const getLocale = () => window.__GOKKEN_LOCALE__ || 'es-ES';

function logoUrl(company){
    const id = company.logo ? company.logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/ffcc00/111?text=LOGO';
}

function coverUrl(game){
    const id = game.cover ? game.cover.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg` : 'https://placehold.co/180x240/333/fff?text=Cover';
}

function starIcons(avg){
    const stars = Math.round((avg || 0) / 20);
    return Array.from({length:5}).map((_,i)=>`<i class="fas fa-star" style="opacity:${i<stars?1:0.2}"></i>`).join('');
}

function formatDate(ts){
    if(!ts) return '';
    return new Date(ts*1000).toLocaleDateString(getLocale(), { year:'numeric', month:'short', day:'2-digit' });
}

const FALLBACK_COMPANY = {
    name: 'Sample Studio',
    description: 'Descripción genérica del estudio. Sustituya con datos reales cuando el API no responda.',
    logo: { image_id: 'co6exk' },
    country: null,
    websites: [],
    avg_rating: 82,
    games: [
        { name:'Sample Game 1', cover:{ image_id:'co1r16' }, id:101 },
        { name:'Sample Game 2', cover:{ image_id:'co1l7n' }, id:102 },
        { name:'Sample Game 3', cover:{ image_id:'co1tmu' }, id:103 },
        { name:'Sample Game 4', cover:{ image_id:'co1wyy' }, id:104 }
    ]
};

async function fetchCompany(id){
    const url = `${apiBase()}/api/company?id=${encodeURIComponent(id)}`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    }catch(e){
        console.error('Company fetch error', e);
        return FALLBACK_COMPANY;
    }
}

function renderCompany(root, data){
    if(!root) return;
    const games = data.games || [];
    const ratedGames = games.filter(g=>typeof g.rating === 'number').sort((a,b)=> (b.rating||0) - (a.rating||0));
    const featured = ratedGames.slice(0,10);
    const countryTxt = data.country ? `${tr('search.countryCodeLabel', 'País código')}: ${data.country}` : tr('company.countryUnknown', 'País: Desconocido');
    const ratingTxt = data.avg_rating ? `${data.avg_rating.toFixed(1)} / 100` : tr('common.noRating', 'Sin rating');
    const totalDlcs = games.reduce((sum, g)=> sum + (Array.isArray(g.dlcs) ? g.dlcs.length : 0), 0);
    const toHost = (url = '') => {
        try { return new URL(url).hostname; } catch { return url.replace(/^https?:\/\//,''); }
    };

    root.innerHTML = `
        <div class="company-page space-y-8">
            <section class="bg-panel border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/30">
                <div class="relative">
                    <div class="h-28 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent"></div>
                    <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(circle at 20% 20%, rgba(255,0,0,0.25), transparent 40%)"></div>
                    <div class="relative px-6 pb-6 -mt-10 flex flex-col lg:flex-row gap-6 items-start">
                        <div class="w-28 h-28 bg-surface border border-border rounded-xl shadow-lg overflow-hidden shrink-0">
                            <img src="${logoUrl(data)}" alt="${data.name}" class="w-full h-full object-contain">
                        </div>
                        <div class="flex-1 grid gap-3">
                            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <h1 class="text-2xl lg:text-3xl font-bold leading-tight">${data.name || tr('search.companyDefault', 'Compañía')}</h1>
                                <div class="flex items-center gap-2 text-amber-400 text-xl" aria-label="${tr('company.avgRatingAria', 'Rating promedio')}">
                                    ${starIcons(data.avg_rating)}
                                </div>
                                <span class="text-sm text-gray-200 bg-surface border border-border px-3 py-1 rounded-full">${ratingTxt}</span>
                            </div>
                            <p class="text-gray-300 text-sm leading-relaxed">${data.description || tr('noDescription', 'Sin descripción')}</p>
                            <div class="flex flex-wrap gap-3 text-sm text-gray-200">
                                <span class="px-3 py-1 rounded-full bg-surface border border-border">${countryTxt}</span>
                                <span class="px-3 py-1 rounded-full bg-surface border border-border">${tr('results.games', 'Juegos')}: ${games.length}</span>
                                <span class="px-3 py-1 rounded-full bg-surface border border-border">${tr('company.dlcs', 'DLCs desarrollados')}: ${totalDlcs}</span>
                                <div class="flex items-center gap-2">
                                    <span class="font-semibold text-gray-100">${tr('company.linksLabel', 'Enlaces:')}</span>
                                    <div class="flex items-center gap-2">
                                        ${(data.websites||[]).slice(0,3).map(w=>`<a class="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-surface text-primary hover:border-primary transition" href="${w.url}" target="_blank" rel="noreferrer noopener" aria-label="${tr('common.externalLinkAria', 'Enlace externo')}">🔗</a>`).join('') || `<span class="text-gray-400">${tr('common.noLinks', 'Sin enlaces')}</span>`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="grid lg:grid-cols-3 gap-6">
                <div class="bg-panel border border-border rounded-2xl p-5 space-y-4">
                    <h2 class="text-lg font-semibold text-gray-100">${tr('company.details', 'Ficha')}</h2>
                    <div class="space-y-3 text-sm text-gray-300">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-gray-400">${tr('company.country', 'País')}</span>
                            <span class="text-gray-100 text-right">${countryTxt}</span>
                        </div>
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-gray-400">${tr('company.rating', 'Rating')}</span>
                            <span class="text-gray-100 text-right">${ratingTxt}</span>
                        </div>
                        <div class="flex items-start justify-between gap-2">
                            <span class="text-gray-400">${tr('company.sites', 'Sitios')}</span>
                            <div class="flex flex-wrap gap-2 justify-end">
                                ${(data.websites||[]).slice(0,3).map(w=>`<a class="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-surface text-primary hover:border-primary transition" href="${w.url}" target="_blank" rel="noreferrer noopener">${toHost(w.url)}</a>`).join('') || `<span class="text-gray-400">${tr('common.noLinks', 'Sin enlaces')}</span>`}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-panel border border-border rounded-2xl p-5 lg:col-span-2 space-y-3">
                    <h2 class="text-lg font-semibold text-gray-100">${tr('company.aboutUs', 'Quiénes somos')}</h2>
                    <div class="text-gray-300 leading-relaxed whitespace-pre-line">${data.description || tr('noDescription', 'Sin descripción')}</div>
                </div>
            </section>

            <section class="bg-panel border border-border rounded-2xl p-5 space-y-4">
                <div class="flex items-center justify-between gap-3">
                    <h2 class="text-lg font-semibold text-gray-100">${tr('company.featuredGames', 'Juegos destacados')}</h2>
                    <div class="flex items-center gap-2">
                        <button class="fnav inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface hover:border-primary text-gray-200 transition" data-fprev aria-label="${tr('common.prev', 'Anterior')}"><i class="fas fa-chevron-left"></i></button>
                        <button class="fnav inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface hover:border-primary text-gray-200 transition" data-fnext aria-label="${tr('common.next', 'Siguiente')}"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="overflow-hidden -mx-1">
                    <div class="featured-cards flex gap-4 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
                        ${featured.map(f => `<div class="fcard w-40 shrink-0 snap-start bg-surface border border-border rounded-xl overflow-hidden shadow-md hover:border-primary transition cursor-pointer" data-game-id="${f.id || f.slug || ''}"><div class="aspect-[3/4] bg-neutral-900"><img src="${coverUrl(f)}" class="w-full h-full object-cover" alt="${f.name || tr('search.tagGame', 'Juego')}"></div><div class="ftitle px-3 py-2 text-sm font-semibold text-gray-100 leading-tight">${f.name || tr('search.tagGame', 'Juego')}</div><div class="px-3 pb-2 text-xs text-gray-300">${typeof f.rating==='number'?f.rating.toFixed(1):tr('common.noRating','Sin rating')}</div></div>`).join('') || `<div class="list-placeholder text-gray-400">${tr('results.emptyGames', 'Sin juegos')}</div>`}
                    </div>
                </div>
            </section>
        </div>
    `;

    const cards = root.querySelector('.featured-cards');
    root.querySelector('[data-fprev]')?.addEventListener('click', ()=> cards?.scrollBy({left:-200, behavior:'smooth'}));
    root.querySelector('[data-fnext]')?.addEventListener('click', ()=> cards?.scrollBy({left:200, behavior:'smooth'}));

    root.querySelectorAll('.fcard').forEach(card=>{
        card.style.cursor='pointer';
        card.addEventListener('click', ()=>{
            const gid = card.getAttribute('data-game-id');
            if(gid) window.location.href = `game.html?id=${gid}`;
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const id = qs('id') || '0';
    const root = document.getElementById('companyRoot');
    const data = await fetchCompany(id);
    renderCompany(root, data);
});
