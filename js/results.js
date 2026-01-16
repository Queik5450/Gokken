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

const COUNTRY_NUMERIC_TO_ALPHA2 = {
    4: 'AF',
    8: 'AL',
    12: 'DZ',
    16: 'AS',
    20: 'AD',
    24: 'AO',
    28: 'AG',
    31: 'AZ',
    32: 'AR',
    36: 'AU',
    40: 'AT',
    44: 'BS',
    48: 'BH',
    50: 'BD',
    51: 'AM',
    52: 'BB',
    56: 'BE',
    60: 'BM',
    64: 'BT',
    68: 'BO',
    70: 'BA',
    72: 'BW',
    76: 'BR',
    84: 'BZ',
    90: 'SB',
    96: 'BN',
    100: 'BG',
    104: 'MM',
    108: 'BI',
    112: 'BY',
    116: 'KH',
    120: 'CM',
    124: 'CA',
    132: 'CV',
    136: 'KY',
    140: 'CF',
    144: 'LK',
    148: 'TD',
    152: 'CL',
    156: 'CN',
    158: 'TW',
    170: 'CO',
    174: 'KM',
    175: 'YT',
    178: 'CG',
    180: 'CD',
    184: 'CK',
    188: 'CR',
    191: 'HR',
    192: 'CU',
    196: 'CY',
    203: 'CZ',
    204: 'BJ',
    208: 'DK',
    212: 'DM',
    214: 'DO',
    218: 'EC',
    222: 'SV',
    226: 'GQ',
    231: 'ET',
    232: 'ER',
    233: 'EE',
    234: 'FO',
    238: 'FK',
    242: 'FJ',
    246: 'FI',
    248: 'AX',
    250: 'FR',
    254: 'GF',
    258: 'PF',
    260: 'TF',
    262: 'DJ',
    266: 'GA',
    268: 'GE',
    270: 'GM',
    275: 'PS',
    276: 'DE',
    288: 'GH',
    292: 'GI',
    296: 'KI',
    300: 'GR',
    304: 'GL',
    308: 'GD',
    312: 'GP',
    316: 'GU',
    320: 'GT',
    324: 'GN',
    328: 'GY',
    332: 'HT',
    334: 'HM',
    336: 'VA',
    340: 'HN',
    344: 'HK',
    348: 'HU',
    352: 'IS',
    356: 'IN',
    360: 'ID',
    364: 'IR',
    368: 'IQ',
    372: 'IE',
    376: 'IL',
    380: 'IT',
    384: 'CI',
    388: 'JM',
    392: 'JP',
    398: 'KZ',
    400: 'JO',
    404: 'KE',
    408: 'KP',
    410: 'KR',
    414: 'KW',
    417: 'KG',
    418: 'LA',
    422: 'LB',
    426: 'LS',
    428: 'LV',
    430: 'LR',
    434: 'LY',
    438: 'LI',
    440: 'LT',
    442: 'LU',
    446: 'MO',
    450: 'MG',
    454: 'MW',
    458: 'MY',
    462: 'MV',
    466: 'ML',
    470: 'MT',
    474: 'MQ',
    478: 'MR',
    480: 'MU',
    484: 'MX',
    492: 'MC',
    496: 'MN',
    498: 'MD',
    499: 'ME',
    500: 'MS',
    504: 'MA',
    508: 'MZ',
    512: 'OM',
    516: 'NA',
    520: 'NR',
    524: 'NP',
    528: 'NL',
    531: 'CW',
    533: 'AW',
    534: 'SX',
    535: 'BQ',
    540: 'NC',
    548: 'VU',
    554: 'NZ',
    558: 'NI',
    562: 'NE',
    566: 'NG',
    570: 'NU',
    574: 'NF',
    578: 'NO',
    580: 'MP',
    581: 'UM',
    583: 'FM',
    584: 'MH',
    585: 'PW',
    586: 'PK',
    591: 'PA',
    598: 'PG',
    600: 'PY',
    604: 'PE',
    608: 'PH',
    612: 'PN',
    616: 'PL',
    620: 'PT',
    624: 'GW',
    626: 'TL',
    630: 'PR',
    634: 'QA',
    638: 'RE',
    642: 'RO',
    643: 'RU',
    646: 'RW',
    652: 'BL',
    654: 'SH',
    659: 'KN',
    660: 'AI',
    662: 'LC',
    663: 'MF',
    666: 'PM',
    670: 'VC',
    674: 'SM',
    678: 'ST',
    682: 'SA',
    686: 'SN',
    688: 'RS',
    690: 'SC',
    694: 'SL',
    702: 'SG',
    703: 'SK',
    704: 'VN',
    705: 'SI',
    706: 'SO',
    710: 'ZA',
    716: 'ZW',
    724: 'ES',
    728: 'SS',
    729: 'SD',
    732: 'EH',
    740: 'SR',
    744: 'SJ',
    748: 'SZ',
    752: 'SE',
    756: 'CH',
    760: 'SY',
    762: 'TJ',
    764: 'TH',
    768: 'TG',
    772: 'TK',
    776: 'TO',
    780: 'TT',
    784: 'AE',
    788: 'TN',
    792: 'TR',
    795: 'TM',
    796: 'TC',
    798: 'TV',
    800: 'UG',
    804: 'UA',
    807: 'MK',
    818: 'EG',
    826: 'GB',
    831: 'GG',
    832: 'JE',
    833: 'IM',
    834: 'TZ',
    840: 'US',
    850: 'VI',
    854: 'BF',
    858: 'UY',
    860: 'UZ',
    862: 'VE',
    876: 'WF',
    882: 'WS',
    887: 'YE',
    894: 'ZM'
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

async function fetchResults(query){
    const base = apiBase();
    const urlAll = `${base}/api/search/all?q=${encodeURIComponent(query)}&limit=20`;
    try {
        const res = await fetch(urlAll);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    } catch (err) {
        console.warn('Combined search failed, attempting per-entity fallback', err);
        let sawOffline = false;
        const safeFetch = async (path) => {
            try {
                const r = await fetch(`${base}${path}`);
                if(!r.ok) throw new Error(r.statusText);
                return await r.json();
            } catch (e) {
                if (e instanceof TypeError || String(e).toLowerCase().includes('failed to fetch')) {
                    sawOffline = true;
                }
                console.warn('Fallback fetch failed', path, e);
                return [];
            }
        };

        const [games, companies, platforms] = await Promise.all([
            safeFetch(`/api/search/games?q=${encodeURIComponent(query)}&limit=20`),
            safeFetch(`/api/search/companies?q=${encodeURIComponent(query)}&limit=20`),
            safeFetch(`/api/search/platforms?q=${encodeURIComponent(query)}&limit=20`)
        ]);

        const allEmpty = (!games || games.length === 0) && (!companies || companies.length === 0) && (!platforms || platforms.length === 0);
        return { games, companies, platforms, __offline: sawOffline && allEmpty };
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

async function fetchGamesByMode(id, page){
    const base = apiBase();
    const url = `${base}/api/games/by-mode?id=${encodeURIComponent(id)}&limit=30&page=${encodeURIComponent(page||1)}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
}

async function fetchGamesByCollection(id, page){
    const base = apiBase();
    const url = `${base}/api/games/by-collection?id=${encodeURIComponent(id)}&limit=30&page=${encodeURIComponent(page||1)}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
}

async function fetchGamesByFranchise(id, page){
    const base = apiBase();
    const url = `${base}/api/games/by-franchise?id=${encodeURIComponent(id)}&limit=30&page=${encodeURIComponent(page||1)}`;
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
    const resolvedCountry = c.country ? countryNameFromCode(c.country) : null;
    const countryTxt = resolvedCountry ? resolvedCountry : (c.country ? `${countryCodeLabel}: ${c.country}` : unknownLocation);
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
    const modeId = qs('modeId');
    const collectionId = qs('collectionId');
    const franchiseId = qs('franchiseId');
    const genreName = qs('genreName');
    const platformName = qs('platformName');
    const modeName = qs('modeName');
    const collectionName = qs('collectionName');
    const franchiseName = qs('franchiseName');
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

    if(genreId || platformId || modeId || collectionId || franchiseId){
        hideSection(companiesList);
        hideSection(companiesEmpty);
        hideSection(platformsList);
        hideSection(platformsEmpty);
        try{
            const resp = genreId
              ? await fetchGamesByGenre(genreId, pageParam)
              : platformId
                ? await fetchGamesByPlatform(platformId, pageParam)
                : modeId
                  ? await fetchGamesByMode(modeId, pageParam)
                  : collectionId
                    ? await fetchGamesByCollection(collectionId, pageParam)
                    : await fetchGamesByFranchise(franchiseId, pageParam);
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
                }else if(platformId){
                    const page = resp.page || pageParam;
                    if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                        summary.textContent = `${games.length} games on platform "${platformName || ''}" (page ${page})`.trim();
                    }else{
                        summary.textContent = `${games.length} juegos en la plataforma "${platformName || ''}" (página ${page})`.trim();
                    }
                }else if(modeId){
                    const page = resp.page || pageParam;
                    if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                        summary.textContent = `${games.length} games with mode "${modeName || ''}" (page ${page})`.trim();
                    }else{
                        summary.textContent = `${games.length} juegos con modo "${modeName || ''}" (página ${page})`.trim();
                    }
                }else if(collectionId){
                    const page = resp.page || pageParam;
                    if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                        summary.textContent = `${games.length} games in collection "${collectionName || ''}" (page ${page})`.trim();
                    }else{
                        summary.textContent = `${games.length} juegos en la colección "${collectionName || ''}" (página ${page})`.trim();
                    }
                }else{
                    const page = resp.page || pageParam;
                    if((window.__GOKKEN_LANG__ || 'es') === 'en'){
                        summary.textContent = `${games.length} games in franchise "${franchiseName || ''}" (page ${page})`.trim();
                    }else{
                        summary.textContent = `${games.length} juegos en la franquicia "${franchiseName || ''}" (página ${page})`.trim();
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
                        : platformId
                            ? `0 games on platform "${platformName || ''}"`
                            : modeId
                                ? `0 games with mode "${modeName || ''}"`
                                : collectionId
                                    ? `0 games in collection "${collectionName || ''}"`
                                    : `0 games in franchise "${franchiseName || ''}"`;
                }else{
                    summary.textContent = genreId
                        ? `0 juegos en el género "${genreName || ''}"`
                        : platformId
                            ? `0 juegos en la plataforma "${platformName || ''}"`
                            : modeId
                                ? `0 juegos con modo "${modeName || ''}"`
                                : collectionId
                                    ? `0 juegos en la colección "${collectionName || ''}"`
                                    : `0 juegos en la franquicia "${franchiseName || ''}"`;
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
