function qs(name, url = window.location.href) {
    name = name.replace(/[[]]/g, '\\$&');
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
const getLocale = () => window.__GOKKEN_LOCALE__ || 'es-ES';

function logoUrl(company){
    const id = company.logo ? company.logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/ffcc00/111?text=LOGO';
}

const COUNTRY_NUMERIC_TO_ALPHA2 = {
    4: 'AF', 8: 'AL', 12: 'DZ', 16: 'AS', 20: 'AD', 24: 'AO', 28: 'AG', 31: 'AZ', 32: 'AR', 36: 'AU',
    40: 'AT', 44: 'BS', 48: 'BH', 50: 'BD', 51: 'AM', 52: 'BB', 56: 'BE', 60: 'BM', 64: 'BT', 68: 'BO',
    70: 'BA', 72: 'BW', 76: 'BR', 84: 'BZ', 90: 'SB', 96: 'BN', 100: 'BG', 104: 'MM', 108: 'BI',
    112: 'BY', 116: 'KH', 120: 'CM', 124: 'CA', 132: 'CV', 136: 'KY', 140: 'CF', 144: 'LK', 148: 'TD',
    152: 'CL', 156: 'CN', 158: 'TW', 170: 'CO', 174: 'KM', 175: 'YT', 178: 'CG', 180: 'CD', 184: 'CK',
    188: 'CR', 191: 'HR', 192: 'CU', 196: 'CY', 203: 'CZ', 204: 'BJ', 208: 'DK', 212: 'DM', 214: 'DO',
    218: 'EC', 222: 'SV', 226: 'GQ', 231: 'ET', 232: 'ER', 233: 'EE', 234: 'FO', 238: 'FK', 242: 'FJ',
    246: 'FI', 248: 'AX', 250: 'FR', 254: 'GF', 258: 'PF', 260: 'TF', 262: 'DJ', 266: 'GA', 268: 'GE',
    270: 'GM', 275: 'PS', 276: 'DE', 288: 'GH', 292: 'GI', 296: 'KI', 300: 'GR', 304: 'GL', 308: 'GD',
    312: 'GP', 316: 'GU', 320: 'GT', 324: 'GN', 328: 'GY', 332: 'HT', 334: 'HM', 336: 'VA', 340: 'HN',
    344: 'HK', 348: 'HU', 352: 'IS', 356: 'IN', 360: 'ID', 364: 'IR', 368: 'IQ', 372: 'IE', 376: 'IL',
    380: 'IT', 384: 'CI', 388: 'JM', 392: 'JP', 398: 'KZ', 400: 'JO', 404: 'KE', 408: 'KP', 410: 'KR',
    414: 'KW', 417: 'KG', 418: 'LA', 422: 'LB', 426: 'LS', 428: 'LV', 430: 'LR', 434: 'LY', 438: 'LI',
    440: 'LT', 442: 'LU', 446: 'MO', 450: 'MG', 454: 'MW', 458: 'MY', 462: 'MV', 466: 'ML', 470: 'MT',
    474: 'MQ', 478: 'MR', 480: 'MU', 484: 'MX', 492: 'MC', 496: 'MN', 498: 'MD', 499: 'ME', 500: 'MS',
    504: 'MA', 508: 'MZ', 512: 'OM', 516: 'NA', 520: 'NR', 524: 'NP', 528: 'NL', 531: 'CW', 533: 'AW',
    534: 'SX', 535: 'BQ', 540: 'NC', 548: 'VU', 554: 'NZ', 558: 'NI', 562: 'NE', 566: 'NG', 570: 'NU',
    574: 'NF', 578: 'NO', 580: 'MP', 581: 'UM', 583: 'FM', 584: 'MH', 585: 'PW', 586: 'PK', 591: 'PA',
    598: 'PG', 600: 'PY', 604: 'PE', 608: 'PH', 612: 'PN', 616: 'PL', 620: 'PT', 624: 'GW', 626: 'TL',
    630: 'PR', 634: 'QA', 638: 'RE', 642: 'RO', 643: 'RU', 646: 'RW', 652: 'BL', 654: 'SH', 659: 'KN',
    660: 'AI', 662: 'LC', 663: 'MF', 666: 'PM', 670: 'VC', 674: 'SM', 678: 'ST', 682: 'SA', 686: 'SN',
    688: 'RS', 690: 'SC', 694: 'SL', 702: 'SG', 703: 'SK', 704: 'VN', 705: 'SI', 706: 'SO', 710: 'ZA',
    716: 'ZW', 724: 'ES', 728: 'SS', 729: 'SD', 732: 'EH', 740: 'SR', 744: 'SJ', 748: 'SZ', 752: 'SE',
    756: 'CH', 760: 'SY', 762: 'TJ', 764: 'TH', 768: 'TG', 772: 'TK', 776: 'TO', 780: 'TT', 784: 'AE',
    788: 'TN', 792: 'TR', 795: 'TM', 796: 'TC', 798: 'TV', 800: 'UG', 804: 'UA', 807: 'MK', 818: 'EG',
    826: 'GB', 831: 'GG', 832: 'JE', 833: 'IM', 834: 'TZ', 840: 'US', 850: 'VI', 854: 'BF', 858: 'UY',
    860: 'UZ', 862: 'VE', 876: 'WF', 882: 'WS', 887: 'YE', 894: 'ZM'
};

const countryDisplayCache = new Map();

function countryNameFromCode(code) {
    if (code == null) return null;
    const numeric = Number(code);
    if (!Number.isFinite(numeric)) return null;
    const alpha2 = COUNTRY_NUMERIC_TO_ALPHA2[numeric];
    if (!alpha2) return null;
    const locale = window.__GOKKEN_LOCALE__ || 'es-ES';
    if (countryDisplayCache.has(locale)) {
        return countryDisplayCache.get(locale).of(alpha2) || null;
    }
    if (typeof Intl === 'undefined' || !Intl.DisplayNames) return alpha2;
    const display = new Intl.DisplayNames([locale], { type: 'region' });
    countryDisplayCache.set(locale, display);
    return display.of(alpha2) || null;
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

function buildGenreStats(games = []) {
    const map = new Map();
    games.forEach((g) => {
        (g.genres || []).forEach((genre) => {
            const name = genre?.name;
            if (!name) return;
            map.set(name, (map.get(name) || 0) + 1);
        });
    });
    return Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
}

function buildPlatformStats(games = []) {
    const map = new Map();
    games.forEach((g) => {
        (g.platforms || []).forEach((platform) => {
            const name = platform?.name;
            if (!name) return;
            map.set(name, (map.get(name) || 0) + 1);
        });
    });
    return Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
}

function renderStatRows(stats, emptyLabel) {
    if (!stats || stats.length === 0) {
        return `<div class="list-placeholder text-gray-400">${emptyLabel}</div>`;
    }
    const maxValue = Math.max(...stats.map(s => s.value));
    return stats.map((s) => {
        const width = maxValue ? Math.round((s.value / maxValue) * 100) : 0;
        return `
          <div class="stat-row">
            <div class="stat-label">${s.label}</div>
            <div class="stat-bar"><span style="width:${width}%"></span></div>
            <div class="stat-value">${s.value}</div>
          </div>
        `;
    }).join('');
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
    const lang = encodeURIComponent(window.__GOKKEN_LOCALE__ || 'es-ES');
    const url = `${apiBase()}/api/company?id=${encodeURIComponent(id)}&lang=${lang}`;
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
    const resolvedCountry = data.country ? countryNameFromCode(data.country) : null;
    const countryTxt = resolvedCountry ? resolvedCountry : (data.country ? `${tr('search.countryCodeLabel', 'País código')}: ${data.country}` : tr('company.countryUnknown', 'País: Desconocido'));
    const ratingTxt = data.avg_rating ? `${data.avg_rating.toFixed(1)} / 100` : tr('common.noRating', 'Sin rating');
    const totalDlcs = games.reduce((sum, g)=> sum + (Array.isArray(g.dlcs) ? g.dlcs.length : 0), 0);
    const toHost = (url = '') => {
        try { return new URL(url).hostname; } catch { return url.replace(/^https?:\/\//,''); }
    };

    const genreStats = buildGenreStats(games).slice(0, 8);
    const platformStats = buildPlatformStats(games).slice(0, 8);
    const noData = tr('common.noData', 'Sin datos');

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

            <section class="stat-card space-y-3">
                <h2 class="text-lg font-semibold text-gray-100">${tr('company.statsGenresTitle', 'Juegos por género')}</h2>
                <div class="stat-list">
                    ${renderStatRows(genreStats, noData)}
                </div>
            </section>

            <section class="stat-card space-y-3">
                <h2 class="text-lg font-semibold text-gray-100">${tr('company.statsPlatformsTitle', 'Juegos por plataforma')}</h2>
                <div class="stat-list">
                    ${renderStatRows(platformStats, noData)}
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
