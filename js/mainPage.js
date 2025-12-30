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

    loadHeroSlider();

    // Redirect to company page when clicking a company item
    const companyItems = document.querySelectorAll('.company-item');
    companyItems.forEach((el, idx) => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            // keep it simple: pass index as id for now
            window.location.href = `company.html?id=${idx}`;
        });
    });

    // Make other static lists clickable to game detail page
    function makeClickableSelector(selector, titleSelector) {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach(node => {
            node.style.cursor = 'pointer';
            node.addEventListener('click', (e) => {
                // prevent double-handling if inside a link
                if (e.target.closest('a')) return;
                // try to get explicit data-game-id
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

    // make recent/upcoming list items clickable
    makeClickableSelector('.list-item', '.item-details h4');
    // make event cards clickable (if they represent games)
    makeClickableSelector('.event-card', '.event-content h4');
    // make featured small cards clickable
    makeClickableSelector('.fcard', '.ftitle');

    // Events overlay: open on 'Ver todos'
    const eventsSeeMore = document.querySelector('.events .see-more');
    const eventsOverlay = document.getElementById('eventsOverlay');
    const eventsFeedFull = document.getElementById('eventsFeedFull');
    if (eventsSeeMore && eventsOverlay && eventsFeedFull) {
        function openEventsOverlay() {
            // sample events data; replace with API if needed
            const events = [
                {
                    posted: 'POSTED ON: November 12, 2025',
                    title: 'November 2025 Update',
                    img: 'https://placehold.co/800x320/222/fff?text=Update+Image',
                    summary: 'Bla bla bla bla bla bla bla bla bla bla bla bla bla...'
                },
                {
                    posted: 'POSTED ON: November 07, 2025',
                    title: 'Patch Notes',
                    img: 'https://placehold.co/800x320/222/fff?text=Patch+Notes',
                    summary: 'Detalles de correcciones y mejoras realizadas esta semana.'
                },
                {
                    posted: 'POSTED ON: November 02, 2025',
                    title: 'October Wrap-up',
                    img: 'https://placehold.co/800x320/222/fff?text=Wrap+Up',
                    summary: 'Resumen mensual de cambios, correcciones y próximos lanzamientos.'
                }
            ];

            eventsFeedFull.innerHTML = '';
            events.forEach(ev => {
                const post = document.createElement('article');
                post.className = 'event-post';
                post.innerHTML = `
                    <div class="ep-header">
                        <div>
                            <div class="ep-meta">${ev.posted}</div>
                            <div class="ep-title">${ev.title}</div>
                        </div>
                        <div class="ep-icons">
                            <div class="icon"><i class="fab fa-github"></i></div>
                            <div class="icon"><i class="fas fa-share"></i></div>
                        </div>
                    </div>
                    <img class="ep-image" src="${ev.img}" alt="${ev.title}">
                    <div class="ep-summary">${ev.summary}</div>
                `;
                eventsFeedFull.appendChild(post);
            });

            eventsOverlay.classList.remove('hidden');
            eventsOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        eventsSeeMore.addEventListener('click', (e) => { e.preventDefault(); openEventsOverlay(); });
        eventsOverlay.querySelector('[data-close]')?.addEventListener('click', () => {
            eventsOverlay.classList.add('hidden');
            eventsOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });
        eventsOverlay.querySelector('.events-close')?.addEventListener('click', () => {
            eventsOverlay.classList.add('hidden');
            eventsOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') {
            eventsOverlay.classList.add('hidden');
            eventsOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }});
    }
});