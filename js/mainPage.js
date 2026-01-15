function apiBase(){
    return `https://gokken-seven.vercel.app`;
}

const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
const getLocale = () => window.__GOKKEN_LOCALE__ || 'es-ES';
const getLang = () => window.__GOKKEN_LANG__ || 'es';

function heroImage(game){
    const shot = game.screenshots && game.screenshots[0] ? game.screenshots[0].image_id : '';
    const art = game.artworks && game.artworks[0] ? game.artworks[0].image_id : '';
    const cover = game.cover ? game.cover.image_id : '';
    const id = shot || art || cover;
    const size = shot || art ? 't_screenshot_big' : 't_cover_big';
    return id ? `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg` : 'https://placehold.co/1920x600/111/fff?text=Gokken+Hero';
}

function coverSmall(game){
    const id = game.cover ? game.cover.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_cover_small/${id}.jpg` : 'https://placehold.co/120x70/333/white?text=No+Cover';
}

function normalizeGameId(game){
    if (game.id !== undefined) return game.id;
    if (game.slug) return game.slug;
    const safe = (game.name || '').replace(/\s+/g, '-').toLowerCase();
    return encodeURIComponent(safe);
}

function formatRelease(ts){
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleDateString(getLocale(), { day:'2-digit', month:'short', year:'numeric' });
}

function makeClickableSelector(selector, titleSelector) {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach(node => {
        node.style.cursor = 'pointer';
        node.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            const dataId = node.getAttribute('data-game-id') || node.getAttribute('data-id');
            let gid = dataId;
            if (!gid) {
                const titleEl = titleSelector ? node.querySelector(titleSelector) : node.querySelector('h4, .game-title, .ftitle');
                const title = titleEl ? titleEl.textContent.trim() : '';
                gid = title ? encodeURIComponent(title.replace(/\s+/g,'-').toLowerCase()) : null;
            }
            if (gid) window.location.href = `game.html?id=${gid}`;
        });
    });
}

const FALLBACK_RECENT = [
    { name:'Game A', cover:{ image_id:'co1r7v' }, first_release_date: Math.floor(Date.now()/1000) - 3*86400 },
    { name:'Game B', cover:{ image_id:'co2nbi' }, first_release_date: Math.floor(Date.now()/1000) - 8*86400 },
    { name:'Game C', cover:{ image_id:'co25x8' }, first_release_date: Math.floor(Date.now()/1000) - 10*86400 },
    { name:'Game D', cover:{ image_id:'co1t35' }, first_release_date: Math.floor(Date.now()/1000) - 12*86400 }
];

const FALLBACK_UPCOMING = [
    { name:'Upcoming Game 1', cover:{ image_id:'co1s1x' }, first_release_date: Math.floor(Date.now()/1000) + 4*86400 },
    { name:'Upcoming Game 2', cover:{ image_id:'' }, first_release_date: Math.floor(Date.now()/1000) + 6*86400 },
    { name:'Upcoming Game 3', cover:{ image_id:'co3t5e' }, first_release_date: Math.floor(Date.now()/1000) + 9*86400 },
    { name:'Upcoming Game 4', cover:{ image_id:'co2sc4' }, first_release_date: Math.floor(Date.now()/1000) + 11*86400 }
];

const FALLBACK_COMPANIES = [
    { id: 1, name:'Sony Interactive Entertainment', logo:{ image_id:'co6exk' }, avg_rating: 89.5 },
    { id: 2, name:'Nintendo', logo:{ image_id:'co2lly' }, avg_rating: 91.2 },
    { id: 3, name:'Ubisoft', logo:{ image_id:'co2z5o' }, avg_rating: 78.0 },
    { id: 4, name:'Rockstar Games', logo:{ image_id:'co2w0m' }, avg_rating: 94.1 },
    { id: 5, name:'Square Enix', logo:{ image_id:'co3loq' }, avg_rating: 85.3 }
];

const FALLBACK_EVENTS = [
    {
        name: 'Event 1',
        description: 'Descripción genérica del evento 1.',
        start_time: Math.floor(Date.now()/1000) + 3*86400,
        event_logo: { image_id:'co2p83' },
        url: ''
    },
    {
        name: 'Event 2',
        description: 'Descripción genérica del evento 2.',
        start_time: Math.floor(Date.now()/1000) + 20*86400,
        event_logo: { image_id:'co2p6u' },
        url: ''
    },
    {
        name: 'Event 3',
        description: 'Descripción genérica del evento 3.',
        start_time: Math.floor(Date.now()/1000) + 45*86400,
        event_logo: { image_id:'co2p8d' },
        url: ''
    }
];

const FALLBACK_NEWS = [
    {
        title: 'Actualización destacada',
        summary: 'Notas de parche y mejoras recientes.',
        published_at: Math.floor(Date.now()/1000) - 2*86400,
        pulse_image: { image_id:'co1r16' },
        url: ''
    },
    {
        title: 'Nuevo contenido',
        summary: 'Se anunció contenido adicional y eventos en vivo.',
        published_at: Math.floor(Date.now()/1000) - 5*86400,
        pulse_image: { image_id:'co1l7n' },
        url: ''
    },
    {
        title: 'Comunidad',
        summary: 'Historias destacadas de la comunidad y torneos.',
        published_at: Math.floor(Date.now()/1000) - 8*86400,
        pulse_image: { image_id:'co1tmu' },
        url: ''
    }
];

async function fetchWindow(kind, fallback){
    const url = `${apiBase()}/api/games/${kind}?days=15&limit=4`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        return await res.json();
    } catch (e) {
        console.error(`Fetch ${kind} error`, e);
        return fallback;
    }
}

function logoUrl(c){
    const id = c.logo ? c.logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/fff/111?text=Logo';
}

async function fetchCompanies(){
    const url = `${apiBase()}/api/companies?limit=12`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    }catch(e){
        console.error('Fetch companies error', e);
        return FALLBACK_COMPANIES;
    }
}

function renderCompanies(listEl, companies){
    if(!listEl) return;
    listEl.innerHTML = '';

    if(!companies || !companies.length){
        listEl.innerHTML = `<div class="company-placeholder">${tr('results.emptyCompanies', 'Sin compañías')}</div>`;
        return;
    }

    companies.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'company-item';
        item.dataset.companyId = c.id || idx;
        item.innerHTML = `
            <div class="company-logo"><img src="${logoUrl(c)}" alt="${c.name}"></div>
            <div class="company-rect">
                <div class="company-name">${c.name}</div>
                <div class="company-rating">${c.avg_rating ? `${c.avg_rating.toFixed(1)} / 100` : tr('common.noRating', 'Sin rating')}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            const cid = item.dataset.companyId;
            window.location.href = `company.html?id=${cid}`;
        });
        listEl.appendChild(item);
    });
}

function renderList(listEl, games, { emptyText = 'Sin resultados', statusBuilder } = {}){
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!games || !games.length){
        const safeEmpty = emptyText === 'Sin resultados' ? tr('common.noResults', 'Sin resultados') : emptyText;
        listEl.innerHTML = `<div class="list-placeholder">${safeEmpty}</div>`;
        return;
    }

    games.forEach(game => {
        const gid = normalizeGameId(game);
        const status = statusBuilder ? statusBuilder(game) : '';
        const item = document.createElement('div');
        item.className = 'list-item flex items-center gap-4';
        item.setAttribute('data-game-id', gid);
        item.innerHTML = `
            <img src="${coverSmall(game)}" alt="${game.name}">
            <div class="item-details">
                <h4>${game.name}</h4>
                ${status ? `<span class="status">${status}</span>` : ''}
            </div>
        `;
        item.addEventListener('click', () => {
            if (gid) window.location.href = `game.html?id=${gid}`;
        });
        listEl.appendChild(item);
    });
}

function eventImage(ev){
    const id = ev.event_logo ? ev.event_logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg` : 'https://placehold.co/400x200/333/fff?text=Evento';
}

function formatDateTime(ts){
    if (!ts) return '';
    return new Date(ts*1000).toLocaleString(getLocale(), { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

async function fetchEvents(){
    const url = `${apiBase()}/api/events?limit=15`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    }catch(e){
        console.error('Fetch events error', e);
        return FALLBACK_EVENTS;
    }
}

async function fetchNews(){
    const url = `${apiBase()}/api/news?limit=12&lang=${encodeURIComponent(getLang())}`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        if(!data || !data.length) throw new Error('Empty news');
        return data;
    }catch(e){
        console.error('Fetch news error', e);
        return FALLBACK_NEWS;
    }
}

function newsImage(item){
    const id = item.pulse_image ? item.pulse_image.image_id : '';
    if (id) return `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg`;
    const direct = item.image_url || item.image || '';
    return direct ? direct : 'https://placehold.co/640x360/222/fff?text=Noticia';
}

function mapPost(entry){
    const isEvent = entry.start_time !== undefined;
    return {
        id: entry.id || entry.slug || Math.random().toString(36).slice(2),
        title: isEvent ? entry.name : (entry.title || tr('main.tagNews', 'Noticia')),
        body: entry.description || entry.summary || '',
        date: isEvent ? entry.start_time : (entry.published_at || entry.updated_at || null),
        image: isEvent ? eventImage(entry) : newsImage(entry),
        tag: isEvent ? tr('main.tagEvent', 'Evento') : tr('main.tagNews', 'Noticia'),
        url: entry.url || (entry.websites && entry.websites[0] ? entry.websites[0].url : '')
    };
}

function renderEvents(gridEl, posts){
    if(!gridEl) return;
    gridEl.innerHTML = '';

    if(!posts || !posts.length){
        gridEl.innerHTML = `<div class="event-placeholder">${tr('main.emptyEventsNews', 'Sin eventos o noticias')}</div>`;
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-head">
                <span class="news-tag">${post.tag}</span>
                <span class="news-date">${formatDateTime(post.date)}</span>
            </div>
            <div class="news-title">${post.title}</div>
            <div class="news-media"><img src="${post.image}" alt="${post.title}"></div>
            <div class="news-body">${post.body ? post.body.slice(0,180) + (post.body.length>180 ? '...' : '') : tr('noDescription', 'Sin descripción')}</div>
            <div class="news-actions">
                ${post.url ? `<button class="news-link" data-link>${tr('common.seeMore', 'Ver más')}</button>` : ''}
            </div>
        `;
        card.addEventListener('click', () => openEventDetail(post));
        const linkBtn = card.querySelector('[data-link]');
        if(linkBtn && post.url){
            linkBtn.addEventListener('click', (e)=>{ e.stopPropagation(); window.open(post.url, '_blank'); });
        }
        gridEl.appendChild(card);
    });
}

async function loadRecentAndUpcoming(){
    const recentEl = document.querySelector('[data-list="recent"]');
    const upcomingEl = document.querySelector('[data-list="upcoming"]');
    if (!recentEl && !upcomingEl) return;

    const [recent, upcoming] = await Promise.all([
        recentEl ? fetchWindow('recent', FALLBACK_RECENT) : Promise.resolve([]),
        upcomingEl ? fetchWindow('upcoming', FALLBACK_UPCOMING) : Promise.resolve([])
    ]);

    if (recentEl){
        renderList(recentEl, recent, {
            emptyText: tr('main.emptyRecent15', 'No hay lanzamientos en los últimos 15 días'),
            statusBuilder: (g) => g.first_release_date ? `${tr('main.releasedPrefix', 'Lanzado')} ${formatRelease(g.first_release_date)}` : ''
        });
    }

    if (upcomingEl){
        renderList(upcomingEl, upcoming, {
            emptyText: tr('main.emptyUpcoming15', 'No hay lanzamientos próximos en 15 días'),
            statusBuilder: (g) => g.first_release_date ? `${tr('main.launchesPrefix', 'Lanza')} ${formatRelease(g.first_release_date)}` : tr('main.comingSoon', 'Muy pronto')
        });
    }
}

async function loadHeroSlider(){
    const hero = document.querySelector('.hero');
    if(!hero) return;

    let games = [];
    try{
        const res = await fetch(`${apiBase()}/api/top-games?limit=5&order=new`);
        if(!res.ok) throw new Error(res.statusText);
        games = await res.json();
    }catch(e){
        console.error('Hero fetch error', e);
        games = [
            { name:'Game 1', slug:'game-1', cover:{ image_id:'co6f2e' } },
            { name:'Game 2', slug:'game-2', cover:{ image_id:'co6n3j' } },
            { name:'Game 3', slug:'game-3', cover:{ image_id:'co6ce1' } }
        ];
    }

    if(!games.length) return;

    const slides = games.map(g=>{
        const slug = g.slug || encodeURIComponent((g.name||'').replace(/\s+/g,'-').toLowerCase());
        const id = g.id;
        const href = id ? `game.html?id=${id}` : `game.html?slug=${slug}`;
        return {
            title: g.name,
            img: heroImage(g),
            id,
            slug,
            href
        };
    });

    hero.innerHTML = `
        <div class="hero-track">
            ${slides.map((s,i)=>`
                <div class="hero-slide ${i===0?'active':''}" data-idx="${i}" data-href="${s.href}" data-id="${s.id || ''}" data-slug="${s.slug || ''}">
                    <a class="hero-link" href="${s.href}" aria-label="${s.title}">
                        <img src="${s.img}" alt="${s.title}" class="hero-img">
                        <div class="hero-overlay"></div>
                        <div class="hero-title">${s.title}</div>
                    </a>
                </div>
            `).join('')}
        </div>
        <button class="hero-nav prev"><i class="fas fa-chevron-left"></i></button>
        <button class="hero-nav next"><i class="fas fa-chevron-right"></i></button>
        <div class="hero-dots">
            ${slides.map((_,i)=>`<span class="dot ${i===0?'active':''}" data-idx="${i}"></span>`).join('')}
        </div>
    `;

    const slideEls = hero.querySelectorAll('.hero-slide');
    const dotEls = hero.querySelectorAll('.hero-dots .dot');
    const prevBtn = hero.querySelector('.hero-nav.prev');
    const nextBtn = hero.querySelector('.hero-nav.next');
    let current = 0;

    function show(i){
        current = (i + slideEls.length) % slideEls.length;
        slideEls.forEach(el=>el.classList.remove('active'));
        dotEls.forEach(el=>el.classList.remove('active'));
        slideEls[current].classList.add('active');
        dotEls[current].classList.add('active');
    }

    prevBtn?.addEventListener('click', ()=> show(current-1));
    nextBtn?.addEventListener('click', ()=> show(current+1));
    dotEls.forEach(dot=>dot.addEventListener('click', ()=> show(Number(dot.dataset.idx||0))));

    slideEls.forEach((el)=>{
        el.style.cursor='pointer';
        el.addEventListener('click', ()=>{
            const href = el.getAttribute('data-href');
            if(href) window.location.href = href;
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const top100Container = document.querySelector('.game-cards-container');
    const top100PrevBtn = document.querySelector('.carousel-wrapper .carousel-nav.left');
    const top100NextBtn = document.querySelector('.carousel-wrapper .carousel-nav.right');

    if (top100Container && top100PrevBtn && top100NextBtn)
    {
        top100PrevBtn.addEventListener('click', () => {
            top100Container.scrollBy({ left: -200, behavior: 'smooth' });
        });

        top100NextBtn.addEventListener('click', () => {
            top100Container.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }

    const companiesContainer = document.querySelector('.companies-list');
    const companiesPrevBtn = document.querySelector('.companies-wrapper .carousel-nav.left');
    const companiesNextBtn = document.querySelector('.companies-wrapper .carousel-nav.right');

    if (companiesContainer && companiesPrevBtn && companiesNextBtn)
    {
        companiesPrevBtn.addEventListener('click', () => {
            companiesContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });

        companiesNextBtn.addEventListener('click', () => {
            companiesContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }

    (async () => {
        const listEl = document.querySelector('[data-company-list]');
        if (!listEl) return;
        const companies = await fetchCompanies();
        renderCompanies(listEl, companies);
    })();

    loadHeroSlider();
    loadRecentAndUpcoming();

    const companyItems = document.querySelectorAll('.company-item');
    companyItems.forEach((el) => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            const cid = el.dataset.companyId || el.dataset.id || 0;
            window.location.href = `company.html?id=${cid}`;
        });
    });

    makeClickableSelector('.fcard', '.ftitle');

    const eventsSeeMore = document.querySelector('.events .see-more');
    const eventsOverlay = document.getElementById('eventsOverlay');
    const eventsFeedFull = document.getElementById('eventsFeedFull');
    const moreBtn = document.querySelector('.events .scroll-indicator');
    let postsCache = [];
    let visibleCount = 3;

    function renderDetail(post){
        const body = post.body || tr('noDescription', 'Sin descripción');
        const linkBtn = post.url ? `<button class="read-more-btn" data-event-link>${tr('common.visitLink', 'Visitar enlace')}</button>` : '';
        eventsFeedFull.innerHTML = `
            <div class="event-detail">
                <div class="detail-meta">${formatDateTime(post.date)}</div>
                <h3>${post.title}</h3>
                <img class="detail-hero" src="${post.image}" alt="${post.title}">
                <div class="detail-body">${body}</div>
                <div class="detail-actions">${linkBtn}</div>
            </div>
        `;
        const btn = eventsFeedFull.querySelector('[data-event-link]');
        if(btn && post.url){
            btn.addEventListener('click', (e)=>{ e.stopPropagation(); window.open(post.url, '_blank'); });
        }
    }

    function openEventDetail(post){
        if(!eventsOverlay || !eventsFeedFull){
            return;
        }
        if(!post){
            eventsFeedFull.innerHTML = `<div class="event-placeholder">${tr('main.emptyEventsToShow', 'Sin eventos para mostrar')}</div>`;
        }else{
            renderDetail(post);
        }
        eventsOverlay.classList.remove('hidden');
        eventsOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    function openEventsList(allPosts){
        if(!eventsOverlay || !eventsFeedFull) return;
        if(!allPosts || !allPosts.length){
            eventsFeedFull.innerHTML = `<div class="event-placeholder">${tr('main.emptyEventsToShow', 'Sin eventos para mostrar')}</div>`;
        } else {
            eventsFeedFull.innerHTML = allPosts.map(post => `
                <div class="event-detail">
                    <div class="detail-meta">${formatDateTime(post.date)}</div>
                    <h3>${post.title}</h3>
                    <img class="detail-hero" src="${post.image}" alt="${post.title}">
                    <div class="detail-body">${post.body || tr('noDescription', 'Sin descripción')}</div>
                    <div class="detail-actions">${post.url ? `<button class="read-more-btn" data-event-link="${post.url}">${tr('common.visitLink', 'Visitar enlace')}</button>` : ''}</div>
                </div>
            `).join('');

            eventsFeedFull.querySelectorAll('[data-event-link]').forEach(btn => {
                const link = btn.getAttribute('data-event-link');
                if(link){
                    btn.addEventListener('click', (e)=>{ e.stopPropagation(); window.open(link, '_blank'); });
                }
            });
        }

        eventsOverlay.classList.remove('hidden');
        eventsOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    function updateEventsGrid(){
        const grid = document.querySelector('[data-events-grid]');
        if(!grid) return;
        const slice = postsCache.slice(0, visibleCount);
        renderEvents(grid, slice);
        if(moreBtn){
            const hasMore = visibleCount < postsCache.length;
            moreBtn.style.display = postsCache.length ? 'block' : 'none';
            moreBtn.classList.toggle('disabled', !hasMore);
        }
    }

    function withTimeout(promise, ms, fallbackValue){
        let timer;
        const timeout = new Promise(resolve => {
            timer = setTimeout(() => resolve(fallbackValue), ms);
        });
        return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    }

    async function loadEventsIntoPage(){
        const grid = document.querySelector('[data-events-grid]');
        const eventsSection = document.querySelector('.events');
        if(!grid) return;

        // Load progressively: render events ASAP, then merge news when it arrives.
        const eventsPromise = fetchEvents();
        const newsPromise = withTimeout(fetchNews(), 4500, []);

        const events = await eventsPromise;
        postsCache = [...(events || []).map(mapPost)]
            .sort((a,b)=> (b.date||0) - (a.date||0))
            .slice(0,20);
        visibleCount = Math.min(visibleCount, postsCache.length || 0) || 3;
        updateEventsGrid();
        if(eventsSection){
            const hasContent = postsCache.length > 0;
            eventsSection.style.display = hasContent ? '' : 'none';
        }

        const news = await newsPromise;
        if(news && news.length){
            postsCache = [...postsCache, ...news.map(mapPost)]
                .sort((a,b)=> (b.date||0) - (a.date||0))
                .slice(0,20);
            visibleCount = Math.min(visibleCount, postsCache.length || 0) || 3;
            updateEventsGrid();
            if(eventsSection){
                const hasContent = postsCache.length > 0;
                eventsSection.style.display = hasContent ? '' : 'none';
            }
        }
    }

    if (eventsSeeMore && eventsOverlay && eventsFeedFull) {
        const openEventsOverlay = () => openEventsList(postsCache);

        eventsSeeMore.addEventListener('click', (e) => { e.preventDefault(); openEventsOverlay(); });
        const closeOverlay = () => {
            eventsOverlay.classList.add('hidden');
            eventsOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        };

        eventsOverlay.querySelector('[data-close]')?.addEventListener('click', closeOverlay);
        eventsOverlay.querySelector('.events-close')?.addEventListener('click', closeOverlay);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });
    }

    if(moreBtn){
        moreBtn.style.cursor = 'pointer';
        moreBtn.addEventListener('click', ()=>{
            visibleCount = Math.min(visibleCount + 3, postsCache.length);
            updateEventsGrid();
        });
    }

    loadEventsIntoPage();
});