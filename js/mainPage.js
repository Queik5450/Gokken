function apiBase(){
    const hinted = window.__API_BASE__;
    if (hinted) return hinted.replace(/\/$/,'');
    const { protocol, hostname } = window.location;
    const host = hostname || 'localhost';
    const port = 8080;
    return `${protocol.includes('http')? 'http' : 'http'}://${host}:${port}`;
}

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
    return new Date(ts * 1000).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
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
    { name:'Lego StarWars Skywalker Saga', cover:{ image_id:'co1r7v' }, first_release_date: Math.floor(Date.now()/1000) - 3*86400 },
    { name:'Ghost Wire Tokyo', cover:{ image_id:'co2nbi' }, first_release_date: Math.floor(Date.now()/1000) - 8*86400 },
    { name:'SIFU', cover:{ image_id:'co25x8' }, first_release_date: Math.floor(Date.now()/1000) - 10*86400 },
    { name:'Horizon: Forbidden West', cover:{ image_id:'co1t35' }, first_release_date: Math.floor(Date.now()/1000) - 12*86400 }
];

const FALLBACK_UPCOMING = [
    { name:'Evil Dead The Game', cover:{ image_id:'co1s1x' }, first_release_date: Math.floor(Date.now()/1000) + 4*86400 },
    { name:'Half Life 2: Episodio 3', cover:{ image_id:'' }, first_release_date: Math.floor(Date.now()/1000) + 6*86400 },
    { name:'Hogwarts Legacy', cover:{ image_id:'co3t5e' }, first_release_date: Math.floor(Date.now()/1000) + 9*86400 },
    { name:'God of War :RAGNAROK', cover:{ image_id:'co2sc4' }, first_release_date: Math.floor(Date.now()/1000) + 11*86400 }
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
        name: 'Summer Game Fest',
        description: 'Showcase de anuncios y tráilers.',
        start_time: Math.floor(Date.now()/1000) + 3*86400,
        event_logo: { image_id:'co2p83' },
        url: 'https://www.summergamefest.com/'
    },
    {
        name: 'Gamescom',
        description: 'La feria de videojuegos más grande de Europa.',
        start_time: Math.floor(Date.now()/1000) + 20*86400,
        event_logo: { image_id:'co2p6u' },
        url: 'https://www.gamescom.global/'
    },
    {
        name: 'The Game Awards',
        description: 'Premiación anual de la industria.',
        start_time: Math.floor(Date.now()/1000) + 45*86400,
        event_logo: { image_id:'co2p8d' },
        url: 'https://thegameawards.com/'
    }
];

async function fetchWindow(kind, fallback){
    const url = `${apiBase()}/api/games/${kind}?days=15&limit=30`;
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
        listEl.innerHTML = '<div class="company-placeholder">Sin compañías</div>';
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
                <div class="company-rating">${c.avg_rating ? `${c.avg_rating.toFixed(1)} / 100` : 'Sin rating'}</div>
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
        listEl.innerHTML = `<div class="list-placeholder">${emptyText}</div>`;
        return;
    }

    games.forEach(game => {
        const gid = normalizeGameId(game);
        const status = statusBuilder ? statusBuilder(game) : '';
        const item = document.createElement('div');
        item.className = 'list-item';
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
    return new Date(ts*1000).toLocaleString('es-ES', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

async function fetchEvents(){
    const url = `${apiBase()}/api/events?limit=9`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    }catch(e){
        console.error('Fetch events error', e);
        return FALLBACK_EVENTS;
    }
}

function renderEvents(gridEl, events){
    if(!gridEl) return;
    gridEl.innerHTML = '';

    if(!events || !events.length){
        gridEl.innerHTML = '<div class="event-placeholder">Sin eventos</div>';
        return;
    }

    events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <img src="${eventImage(ev)}" alt="${ev.name}">
            <div class="event-content">
                <h4>${ev.name}</h4>
                <p>${ev.description ? ev.description.slice(0,140) + (ev.description.length>140 ? '...' : '') : ''}</p>
                <div class="event-meta">${formatDateTime(ev.start_time)}</div>
                <button class="read-more-btn">${ev.url ? 'Visitar' : 'Leer más'}</button>
            </div>
        `;
        card.addEventListener('click', () => openEventDetail(ev));
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
            emptyText: 'No hay lanzamientos en los últimos 15 días',
            statusBuilder: (g) => g.first_release_date ? `Lanzado ${formatRelease(g.first_release_date)}` : ''
        });
    }

    if (upcomingEl){
        renderList(upcomingEl, upcoming, {
            emptyText: 'No hay lanzamientos próximos en 15 días',
            statusBuilder: (g) => g.first_release_date ? `Lanza ${formatRelease(g.first_release_date)}` : 'Muy pronto'
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
            { name:'Star Wars Jedi: Survivor', cover:{ image_id:'co6f2e' } },
            { name:'Baldur\'s Gate 3', cover:{ image_id:'co6n3j' } },
            { name:'Elden Ring', cover:{ image_id:'co6ce1' } }
        ];
    }

    if(!games.length) return;

    const slides = games.map(g=>({ title: g.name, img: heroImage(g), id: g.id || g.slug || encodeURIComponent((g.name||'').replace(/\s+/g,'-').toLowerCase()) }));

    hero.innerHTML = `
        <div class="hero-track">
            ${slides.map((s,i)=>`
                <div class="hero-slide ${i===0?'active':''}" data-idx="${i}" data-id="${s.id}">
                    <img src="${s.img}" alt="${s.title}" class="hero-img">
                    <div class="hero-overlay"></div>
                    <div class="hero-title">${s.title}</div>
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

    // click to go to game detail
    slideEls.forEach((el,i)=>{
        el.style.cursor='pointer';
        el.addEventListener('click', ()=>{
            const gid = slides[i].id;
            if(gid) window.location.href = `game.html?id=${gid}`;
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

    // Load companies into carousel
    (async () => {
        const listEl = document.querySelector('[data-company-list]');
        if (!listEl) return;
        const companies = await fetchCompanies();
        renderCompanies(listEl, companies);
    })();

    loadHeroSlider();
    loadRecentAndUpcoming();

    // Redirect to company page when clicking a company item
    const companyItems = document.querySelectorAll('.company-item');
    companyItems.forEach((el) => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            const cid = el.dataset.companyId || el.dataset.id || 0;
            window.location.href = `company.html?id=${cid}`;
        });
    });

    // event cards open detail overlay (handled inside renderEvents)
    // make featured small cards clickable
    makeClickableSelector('.fcard', '.ftitle');

    // Events overlay: open on 'Ver todos'
    const eventsSeeMore = document.querySelector('.events .see-more');
    const eventsOverlay = document.getElementById('eventsOverlay');
    const eventsFeedFull = document.getElementById('eventsFeedFull');
    let eventsCache = [];

    function openEventDetail(ev){
        if(!eventsOverlay || !eventsFeedFull) return;
        if(!ev){
            eventsFeedFull.innerHTML = '<div class="event-placeholder">Sin eventos para mostrar</div>';
        } else {
            eventsFeedFull.innerHTML = `
                <div class="event-detail">
                    <div class="detail-meta">${formatDateTime(ev.start_time)}</div>
                    <h3>${ev.name}</h3>
                    <img class="detail-hero" src="${eventImage(ev)}" alt="${ev.name}">
                    <div class="detail-body">${ev.description || 'Sin descripción'}</div>
                    <div class="detail-actions">
                        ${ev.url ? `<button class="read-more-btn" data-event-link>Visitar enlace</button>` : ''}
                    </div>
                </div>
            `;
            const btn = eventsFeedFull.querySelector('[data-event-link]');
            if(btn && ev.url){
                btn.addEventListener('click', (e)=>{
                    e.stopPropagation();
                    window.open(ev.url, '_blank');
                });
            }
        }

        eventsOverlay.classList.remove('hidden');
        eventsOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    function openEventsList(allEvents){
        if(!eventsOverlay || !eventsFeedFull) return;
        if(!allEvents || !allEvents.length){
            eventsFeedFull.innerHTML = '<div class="event-placeholder">Sin eventos para mostrar</div>';
        } else {
            eventsFeedFull.innerHTML = allEvents.map(ev => `
                <div class="event-detail">
                    <div class="detail-meta">${formatDateTime(ev.start_time)}</div>
                    <h3>${ev.name}</h3>
                    <img class="detail-hero" src="${eventImage(ev)}" alt="${ev.name}">
                    <div class="detail-body">${ev.description || 'Sin descripción'}</div>
                    <div class="detail-actions">
                        ${ev.url ? `<button class="read-more-btn" data-event-link="${ev.url}">Visitar enlace</button>` : ''}
                    </div>
                </div>
            `).join('');

            eventsFeedFull.querySelectorAll('[data-event-link]').forEach(btn => {
                const link = btn.getAttribute('data-event-link');
                if(link){
                    btn.addEventListener('click', (e)=>{
                        e.stopPropagation();
                        window.open(link, '_blank');
                    });
                }
            });
        }

        eventsOverlay.classList.remove('hidden');
        eventsOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    async function loadEventsIntoPage(){
        const grid = document.querySelector('[data-events-grid]');
        if(!grid) return;
        eventsCache = await fetchEvents();
        renderEvents(grid, eventsCache);
    }

    if (eventsSeeMore && eventsOverlay && eventsFeedFull) {
            function openEventsOverlay() {
            openEventsList(eventsCache);
            }

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

    loadEventsIntoPage();
});