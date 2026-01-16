(function () {
  'use strict';

  /**
   * Simple client-side i18n.
   *
   * Usage:
   *  - Add data-i18n="key" to elements for textContent replacement.
   *  - Add data-i18n-html="key" to elements for innerHTML replacement.
   *  - Add data-i18n-placeholder="key" for input/textarea placeholder.
   *  - Add data-i18n-title="key" for title attribute.
   *  - Add data-i18n-aria-label="key" for aria-label attribute.
   *  - Add buttons/links with data-lang="es|en" to switch language.
   */

  const DICTS = {
    es: {
      common: {
        na: 'N/A',
        noResults: 'Sin resultados',
        noDate: 'Sin fecha',
        noData: 'Sin datos',
        noRating: 'Sin rating',
        noLinks: 'Sin enlaces',
        visitLink: 'Visitar enlace',
        link: 'enlace',
        externalLinkAria: 'Enlace externo',
        close: 'Cerrar',
        prev: 'Anterior',
        next: 'Siguiente',
        viewAll: 'Ver todos',
        seeMore: 'Ver más'
      },
      header: {
        homeAria: 'Ir a la página principal',
        menuTitle: 'Menú'
      },
      nav: {
        home: 'Inicio',
        top100: 'Top 100',
        releases: 'Lanzamientos',
        companies: 'Compañías',
        platforms: 'Consolas',
        about: 'Acerca de',
          membersHint: 'Datos con los nombres y roles del equipo.',
          contactTitle: 'Contacto',
          contactHint: 'Envíanos tus dudas o sugerencias.',
          contactName: 'Nombre',
          contactEmail: 'Email',
          contactSubject: 'Asunto',
          contactMessage: 'Mensaje',
          contactSubmit: 'Enviar',
          contactNote: 'Responderemos a tu correo.',
          contactNamePlaceholder: 'Tu nombre',
          contactEmailPlaceholder: 'tucorreo@email.com',
          contactSubjectPlaceholder: 'Motivo',
          contactMessagePlaceholder: 'Escribe tu mensaje'
      },
      search: {
        placeholder: 'Buscar',
        tagGame: 'Juego',
        tagCompany: 'Compañía',
        tagPlatform: 'Consola',
        countryCodeLabel: 'País código',
        companyDefault: 'Compañía',
        platformDefault: 'Consola'
      },
      footer: {
        contacts: 'Contactos',
        aboutPrefix: 'Acerca de:',
        learnPrefix: 'Aprender:',
        learnLink: 'GDQuest (Aprender a hacer juegos — ODS 4)'
      },
      main: {
        seeAll: 'Ver todos',
        seeMore: 'Ver más',
        recent: 'Recientes',
        upcoming: 'Próximamente',
        loadingRecent: 'Cargando lanzamientos de los últimos 15 días...',
        loadingUpcoming: 'Cargando lanzamientos de los próximos 15 días...',
        emptyRecent15: 'No hay lanzamientos en los últimos 15 días',
        emptyUpcoming15: 'No hay lanzamientos próximos en 15 días',
        releasedPrefix: 'Lanzado',
        launchesPrefix: 'Lanza',
        comingSoon: 'Muy pronto',
        companies: 'COMPAÑÍAS',
        loadingCompanies: 'Cargando compañías...',
        platforms: 'CONSOLAS',
        loadingPlatforms: 'Cargando consolas...',
        eventsNewsTitle: 'EVENTOS / NOTICIAS',
        loadingEvents: 'Cargando eventos...',
        emptyEventsNews: 'Sin eventos o noticias',
        emptyEventsToShow: 'Sin eventos para mostrar',
        tagEvent: 'Evento',
        tagNews: 'Noticia',
        eventsModalTitle: 'Eventos'
      },
      platform: {
        notFound: 'Consola no encontrada',
        viewAlt: 'Vista',
        specifications: 'Especificaciones',
        manufacturer: 'Fabricante',
        generation: 'Generación',
        links: 'Enlaces',
        abbreviation: 'Abreviatura',
        otherVersions: 'Otras versiones',
        featuredGames: 'Juegos Destacados',
        spec1: 'CPU y GPU personalizadas',
        spec2: 'Memoria GDDR6 de alta velocidad',
        spec3: 'Almacenamiento NVMe ultrarrápido',
        familyLabel: 'Familia',
        spec4Fallback: 'Compatibilidad multimedia avanzada',
        versionSlim: 'Slim',
        versionPro: 'Pro',
        versionDigital: 'Edición Digital',
        categoryConsole: 'Consola',
        categoryArcade: 'Arcade',
        categoryPlatform: 'Plataforma',
        categoryOS: 'Sistema operativo',
        categoryPortable: 'Portátil',
        categoryComputer: 'Computadora'
      },
      company: {
        countryUnknown: 'País: Desconocido',
        avgRatingAria: 'Rating promedio',
        linksLabel: 'Enlaces:',
        details: 'Ficha',
        country: 'País',
        rating: 'Rating',
        sites: 'Sitios',
        aboutUs: 'Quiénes somos',
        featuredGames: 'Juegos destacados'
      },
      // Used by dynamic pages (JS templates)
      noDescription: 'Sin descripción',
      releases: {
        title: 'Lanzamientos',
        empty: 'Sin resultados',
        resultsWord: 'resultados'
      },
      results: {
        title: 'Resultados',
        games: 'Juegos',
        companies: 'Compañías',
        platforms: 'Consolas',
        emptyGames: 'Sin juegos',
        emptyCompanies: 'Sin compañías',
        emptyPlatforms: 'Sin consolas',
        unknownLocation: 'Ubicación desconocida',
        foundedLabel: 'Fundado',
        hardwareDefault: 'Hardware'
      },
      top100: {
        badge: 'Ranking',
        title: 'Top 100 videojuegos',
        intro:
          'Descubre los mejores juegos de todos los tiempos, combinando las valoraciones de usuarios, Metacritic y nuestros analistas. La lista se actualiza cada 24h.',
        platforms: 'Plataformas',
        genre: 'Género',
        avgRating: 'Nota media',
        releaseDate: 'Fecha de lanzamiento',
        allF: 'Todas',
        allM: 'Todos',
        noDesc: 'Descripción no disponible.'
      },
      game: {
        loadError: 'No se pudo cargar el juego.'
      },
      about: {
        badge: 'Proyecto',
        title: 'Acerca de Gokken',
        intro:
          'Gokken es una plataforma web para explorar videojuegos: rankings, lanzamientos, compañías, consolas, eventos y noticias. Integra datos de IGDB y agrega noticias reales vía RSS.',
        backHome: 'Volver al inicio',
        viewTech: 'Ver tecnologías',
        whatIs: '¿Qué es Gokken?',
        explorationTitle: 'Exploración',
        explorationBody:
          'Búsqueda y navegación por juegos, compañías y consolas con resultados rápidos.',
        rankingsTitle: 'Rankings',
        rankingsBody:
          'Top 100 y listados con filtros, enfocados en descubrir lo mejor.',
        newsEventsTitle: 'Noticias y eventos',
        newsEventsBody:
          'Eventos desde IGDB y noticias reales desde RSS (priorizando fuentes en español).',
        techTitle: 'Tecnologías utilizadas',
        techFrontend: 'Frontend',
        techBackend: 'Backend',
        techSources: 'APIs / Fuentes',
        techPractices: 'Buenas prácticas',
        bp1: 'Separación frontend/back (archivos estáticos + API)',
        bp2: 'Cache de token y cache de RSS con TTL',
        bp3: 'Normalización de datos para la UI',
        membersTitle: 'Miembros del grupo',
        membersHint: 'Datos con los nombres y roles del equipo.',
        roleFrontend: 'Frontend',
        roleBackend: 'Backend / API',
        roleDesign: 'Diseño / UX',
        roleReport: 'Informe',
        techFrontend1: 'HTML5 + CSS3',
        techFrontend2: 'JavaScript (Vanilla)',
        techFrontend3: 'Tailwind CSS (CDN) + estilos propios',
        techFrontend4: 'Font Awesome + Google Fonts',
        techBackend1: 'Node.js + Express',
        techBackend2: 'axios (requests), cors, dotenv',
        techBackend3: 'rss-parser (agregación de noticias)',
        techBackend4Html:
          'Proxy API local (por defecto en <span class="text-gray-200 font-semibold">:8080</span>)',
        techSources1: 'IGDB API (datos de juegos/compañías/eventos)',
        techSources2: 'Twitch OAuth (token para IGDB)',
        techSources3: 'RSS (noticias reales sin API key)'
      },
      game: {
        loadError: 'No se pudo cargar el juego.',
        developer: 'Desarrolladora',
        publisher: 'Publisher',
        company: 'Compañía',
        releasedOn: 'Lanzado el',
        summary: 'Resumen',
        noSummary: 'Sin resumen disponible.',
        genres: 'Géneros',
        platforms: 'Plataformas',
        rating: 'Calificación',
        classification: 'Clasificación',
        languages: 'Idiomas',
        story: 'Historia',
        releaseToday: 'Lanza hoy',
        releaseIn: 'Lanza en',
        playVideo: 'Reproducir video'
      }
    },
    en: {
      common: {
        na: 'N/A',
        noResults: 'No results',
        noDate: 'No date',
        noData: 'No data',
        noRating: 'No rating',
        noLinks: 'No links',
        visitLink: 'Visit link',
        link: 'link',
        externalLinkAria: 'External link',
        close: 'Close',
        prev: 'Previous',
        next: 'Next',
        viewAll: 'View all',
        seeMore: 'See more'
      },
      header: {
        homeAria: 'Go to home page',
        menuTitle: 'Menu'
      },
      nav: {
        home: 'Home',
        top100: 'Top 100',
        releases: 'Releases',
        companies: 'Companies',
        platforms: 'Consoles',
        about: 'About',
          membersHint: 'Data with team member names and roles.',
          contactTitle: 'Contact',
          contactHint: 'Send us your questions or suggestions.',
          contactName: 'Name',
          contactEmail: 'Email',
          contactSubject: 'Subject',
          contactMessage: 'Message',
          contactSubmit: 'Send',
          contactNote: 'We will reply to your email.',
          contactNamePlaceholder: 'Your name',
          contactEmailPlaceholder: 'youremail@example.com',
          contactSubjectPlaceholder: 'Reason',
          contactMessagePlaceholder: 'Write your message'
      },
      search: {
        placeholder: 'Search',
        tagGame: 'Game',
        tagCompany: 'Company',
        tagPlatform: 'Console',
        countryCodeLabel: 'Country code',
        companyDefault: 'Company',
        platformDefault: 'Console'
      },
      footer: {
        contacts: 'Contacts',
        aboutPrefix: 'About:',
        learnPrefix: 'Learn:',
        learnLink: 'GDQuest (Learn game development — SDG 4)'
      },
      main: {
        seeAll: 'View all',
        seeMore: 'See more',
        recent: 'Recent',
        upcoming: 'Upcoming',
        loadingRecent: 'Loading releases from the last 15 days...',
        loadingUpcoming: 'Loading releases from the next 15 days...',
        emptyRecent15: 'No releases in the last 15 days',
        emptyUpcoming15: 'No upcoming releases in the next 15 days',
        releasedPrefix: 'Released',
        launchesPrefix: 'Releases',
        comingSoon: 'Coming soon',
        companies: 'COMPANIES',
        loadingCompanies: 'Loading companies...',
        platforms: 'CONSOLES',
        loadingPlatforms: 'Loading consoles...',
        eventsNewsTitle: 'EVENTS / NEWS',
        loadingEvents: 'Loading events...',
        emptyEventsNews: 'No events or news',
        emptyEventsToShow: 'No events to show',
        tagEvent: 'Event',
        tagNews: 'News',
        eventsModalTitle: 'Events'
      },
      platform: {
        notFound: 'Console not found',
        viewAlt: 'View',
        specifications: 'Specifications',
        manufacturer: 'Manufacturer',
        generation: 'Generation',
        links: 'Links',
        abbreviation: 'Abbreviation',
        otherVersions: 'Other versions',
        featuredGames: 'Featured games',
        spec1: 'Custom CPU and GPU',
        spec2: 'High-speed GDDR6 memory',
        spec3: 'Ultra-fast NVMe storage',
        familyLabel: 'Family',
        spec4Fallback: 'Advanced media compatibility',
        versionSlim: 'Slim',
        versionPro: 'Pro',
        versionDigital: 'Digital Edition',
        categoryConsole: 'Console',
        categoryArcade: 'Arcade',
        categoryPlatform: 'Platform',
        categoryOS: 'Operating system',
        categoryPortable: 'Handheld',
        categoryComputer: 'Computer'
      },
      company: {
        countryUnknown: 'Country: Unknown',
        avgRatingAria: 'Average rating',
        linksLabel: 'Links:',
        details: 'Details',
        country: 'Country',
        rating: 'Rating',
        sites: 'Sites',
        aboutUs: 'About us',
        featuredGames: 'Featured games'
      },
      // Used by dynamic pages (JS templates)
      noDescription: 'No description',
      releases: {
        title: 'Releases',
        empty: 'No results',
        resultsWord: 'results'
      },
      results: {
        title: 'Results',
        games: 'Games',
        companies: 'Companies',
        platforms: 'Consoles',
        emptyGames: 'No games',
        emptyCompanies: 'No companies',
        emptyPlatforms: 'No consoles',
        unknownLocation: 'Unknown location',
        foundedLabel: 'Founded',
        hardwareDefault: 'Hardware'
      },
      top100: {
        badge: 'Ranking',
        title: 'Top 100 video games',
        intro:
          'Discover the best games of all time by combining user ratings, Metacritic and our analysts. The list updates every 24h.',
        platforms: 'Platforms',
        genre: 'Genre',
        avgRating: 'Average rating',
        releaseDate: 'Release date',
        allF: 'All',
        allM: 'All',
        noDesc: 'Description not available.'
      },
      game: {
        loadError: 'Could not load the game.'
      },
      about: {
        badge: 'Project',
        title: 'About Gokken',
        intro:
          'Gokken is a web platform to explore video games: rankings, releases, companies, consoles, events and news. It integrates IGDB data and aggregates real news via RSS.',
        backHome: 'Back to home',
        viewTech: 'View technologies',
        whatIs: 'What is Gokken?',
        explorationTitle: 'Exploration',
        explorationBody:
          'Search and browse games, companies and consoles with fast results.',
        rankingsTitle: 'Rankings',
        rankingsBody:
          'Top 100 and filtered lists focused on discovering the best.',
        newsEventsTitle: 'News and events',
        newsEventsBody:
          'Events from IGDB and real news via RSS (prioritizing Spanish sources).',
        techTitle: 'Technologies used',
        techFrontend: 'Frontend',
        techBackend: 'Backend',
        techSources: 'APIs / Sources',
        techPractices: 'Good practices',
        bp1: 'Frontend/backend separation (static files + API)',
        bp2: 'Token cache and RSS cache with TTL',
        bp3: 'Data normalization for the UI',
        membersTitle: 'Team members',
        membersHint: 'Team names and roles.',
        roleFrontend: 'Frontend',
        roleBackend: 'Backend / API',
        roleDesign: 'Design / UX',
        roleReport: 'Report',
        techFrontend1: 'HTML5 + CSS3',
        techFrontend2: 'JavaScript (Vanilla)',
        techFrontend3: 'Tailwind CSS (CDN) + custom styles',
        techFrontend4: 'Font Awesome + Google Fonts',
        techBackend1: 'Node.js + Express',
        techBackend2: 'axios (requests), cors, dotenv',
        techBackend3: 'rss-parser (news aggregation)',
        techBackend4Html:
          'Local API proxy (default at <span class="text-gray-200 font-semibold">:8080</span>)',
        techSources1: 'IGDB API (game/company/event data)',
        techSources2: 'Twitch OAuth (token for IGDB)',
        techSources3: 'RSS (real news without an API key)'
      },
      game: {
        loadError: 'Could not load the game.',
        developer: 'Developer',
        publisher: 'Publisher',
        company: 'Company',
        releasedOn: 'Released on',
        summary: 'Summary',
        noSummary: 'No summary available.',
        genres: 'Genres',
        platforms: 'Platforms',
        rating: 'Rating',
        classification: 'Rating',
        languages: 'Languages',
        story: 'Story',
        releaseToday: 'Releases today',
        releaseIn: 'Releases in',
        playVideo: 'Play video'
      }
    }
  };

  function normalizeLang(lang) {
    if (!lang) return 'es';
    const value = String(lang).toLowerCase();
    if (value.startsWith('en')) return 'en';
    if (value.startsWith('es')) return 'es';
    return 'es';
  }

  function getLangFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('lang');
    } catch {
      return null;
    }
  }

  function getLang() {
    const fromQuery = getLangFromQuery();
    if (fromQuery) return normalizeLang(fromQuery);

    const fromStorage = localStorage.getItem('gokken.lang');
    if (fromStorage) return normalizeLang(fromStorage);

    const fromNavigator = (navigator.languages && navigator.languages[0]) || navigator.language;
    return normalizeLang(fromNavigator);
  }

  function getDict(lang) {
    return DICTS[lang] || DICTS.es;
  }

  function resolveKey(dict, key) {
    const parts = String(key || '').split('.').filter(Boolean);
    let current = dict;
    for (const p of parts) {
      if (current && Object.prototype.hasOwnProperty.call(current, p)) {
        current = current[p];
      } else {
        return null;
      }
    }
    return typeof current === 'string' ? current : null;
  }

  function t(key, fallback) {
    const lang = window.__GOKKEN_LANG__ || 'es';
    const dict = getDict(lang);
    return resolveKey(dict, key) ?? fallback ?? key;
  }

  function applyTranslations(lang) {
    const dict = getDict(lang);

    document.documentElement.lang = lang;
    window.__GOKKEN_LANG__ = lang;
    window.__GOKKEN_LOCALE__ = lang === 'en' ? 'en-US' : 'es-ES';
    window.t = t;

    const nodesText = document.querySelectorAll('[data-i18n]');
    nodesText.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = resolveKey(dict, key);
      if (value != null) el.textContent = value;
    });

    const nodesHtml = document.querySelectorAll('[data-i18n-html]');
    nodesHtml.forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      const value = resolveKey(dict, key);
      if (value != null) el.innerHTML = value;
    });

    const nodesPlaceholder = document.querySelectorAll('[data-i18n-placeholder]');
    nodesPlaceholder.forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = resolveKey(dict, key);
      if (value != null) el.setAttribute('placeholder', value);
    });

    const nodesTitle = document.querySelectorAll('[data-i18n-title]');
    nodesTitle.forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const value = resolveKey(dict, key);
      if (value != null) el.setAttribute('title', value);
    });

    const nodesAria = document.querySelectorAll('[data-i18n-aria-label]');
    nodesAria.forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const value = resolveKey(dict, key);
      if (value != null) el.setAttribute('aria-label', value);
    });

    document.querySelectorAll('[data-lang]').forEach((btn) => {
      const btnLang = normalizeLang(btn.getAttribute('data-lang'));
      const active = btnLang === lang;
      btn.classList.toggle('ring-2', active);
      btn.classList.toggle('ring-primary', active);
      btn.classList.toggle('ring-offset-2', active);
      btn.classList.toggle('ring-offset-surface', active);
    });
  }

  function setLang(lang) {
    const value = normalizeLang(lang);
    if (value === (window.__GOKKEN_LANG__ || 'es')) return;
    localStorage.setItem('gokken.lang', value);
    // Reload so dynamic pages re-render in the new language.
    try {
      window.location.reload();
    } catch {
      applyTranslations(value);
    }
  }

  function wireLanguageButtons() {
    document.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target.closest('[data-lang]') : null;
      if (!target) return;
      const lang = target.getAttribute('data-lang');
      if (!lang) return;
      setLang(lang);
    });
  }

  function init() {
    wireLanguageButtons();
    applyTranslations(getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.setLang = setLang;
})();
