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

    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroDots = document.querySelectorAll('.hero-dots .dot');
    let currentSlide = 0;

    function updateHero(index)
    {
        heroDots.forEach(dot => dot.classList.remove('active'));
        if (heroDots[index])
        {
            heroDots[index].classList.add('active');
        }
        console.log('Switched to slide', index);
    }

    const heroPrevBtn = document.querySelector('.hero-nav.prev');
    const heroNextBtn = document.querySelector('.hero-nav.next');

    if (heroPrevBtn)
    {
        heroPrevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide > 0) ? currentSlide - 1 : heroDots.length - 1;
            updateHero(currentSlide);
        });
    }

    if (heroNextBtn)
    {
        heroNextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide < heroDots.length - 1) ? currentSlide + 1 : 0;
            updateHero(currentSlide);
        });
    }

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