document.addEventListener('DOMContentLoaded', () => {
    // Top 100 Carousel
    const top100Container = document.querySelector('.game-cards-container');
    const top100PrevBtn = document.querySelector('.carousel-wrapper .carousel-nav.left');
    const top100NextBtn = document.querySelector('.carousel-wrapper .carousel-nav.right');

    if (top100Container && top100PrevBtn && top100NextBtn) {
        top100PrevBtn.addEventListener('click', () => {
            top100Container.scrollBy({ left: -200, behavior: 'smooth' });
        });

        top100NextBtn.addEventListener('click', () => {
            top100Container.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }

    // Companies Carousel
    const companiesContainer = document.querySelector('.companies-list');
    const companiesPrevBtn = document.querySelector('.companies-wrapper .carousel-nav.left');
    const companiesNextBtn = document.querySelector('.companies-wrapper .carousel-nav.right');

    if (companiesContainer && companiesPrevBtn && companiesNextBtn) {
        companiesPrevBtn.addEventListener('click', () => {
            companiesContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });

        companiesNextBtn.addEventListener('click', () => {
            companiesContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }

    // Hero Carousel (Simple placeholder logic)
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroDots = document.querySelectorAll('.hero-dots .dot');
    let currentSlide = 0;

    // Function to update slide (if we had multiple slides)
    function updateHero(index) {
        heroDots.forEach(dot => dot.classList.remove('active'));
        if (heroDots[index]) {
            heroDots[index].classList.add('active');
        }
        // Logic to switch images would go here
        console.log('Switched to slide', index);
    }

    const heroPrevBtn = document.querySelector('.hero-nav.prev');
    const heroNextBtn = document.querySelector('.hero-nav.next');

    if (heroPrevBtn) {
        heroPrevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide > 0) ? currentSlide - 1 : heroDots.length - 1;
            updateHero(currentSlide);
        });
    }

    if (heroNextBtn) {
        heroNextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide < heroDots.length - 1) ? currentSlide + 1 : 0;
            updateHero(currentSlide);
        });
    }
});