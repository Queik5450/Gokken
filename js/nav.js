(function () {
  'use strict';

  function toggleMenu(btn, menu) {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('hidden', isOpen);
  }

  function closeMenu(btn, menu) {
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.add('hidden');
  }

  function initNav() {
    const btn = document.querySelector('[data-nav-toggle]');
    const menu = document.querySelector('[data-nav-menu]');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => toggleMenu(btn, menu));

    document.addEventListener('click', (event) => {
      if (!menu.classList.contains('hidden') && !menu.contains(event.target) && !btn.contains(event.target)) {
        closeMenu(btn, menu);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        closeMenu(btn, menu);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
