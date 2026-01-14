function getQueryParam(name, url = window.location.href) {
  name = name.replace(/[[]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function apiBase(){
  const { protocol, hostname } = window.location;
  const host = hostname || 'localhost';
  return `${protocol.includes('http')? 'http' : 'http'}://${host}:8080`;
}

function imgUrl(type, id){
  if(!id) return 'https://placehold.co/360x200/222/fff?text=No+Image';
  return `https://images.igdb.com/igdb/image/upload/${type}/${id}.jpg`;
}

function toEmbed(videoId){
  if(!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

function youtubeThumb(videoId){
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
}

function renderMain(item, name){
  if(item.type==='video'){
    const poster = item.poster || item.thumb || '';
    const src = item.src;
    const playLabel = (typeof window.t === 'function') ? window.t('game.playVideo', 'Reproducir video') : 'Reproducir video';
    return `
      <div class="main-video relative aspect-video bg-black overflow-hidden" data-type="video" data-src="${src}">
        ${poster ? `<img class="video-poster absolute inset-0 w-full h-full object-cover" src="${poster}" alt="${name} trailer">` : ''}
        <button class="play-btn absolute inset-0 flex items-center justify-center text-white text-4xl bg-black/40 hover:bg-black/60 transition" aria-label="${playLabel}">▶</button>
      </div>
    `;
  }
  return `<img class="w-full h-full object-cover" src="${item.src}" alt="${item.alt || name}">`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const idParam = getQueryParam('id');
  const slugParam = getQueryParam('slug');
  const root = document.getElementById('gameRoot');
  if(!root) return;

  const isNumeric = idParam && /^\d+$/.test(idParam);
  const effectiveSlug = slugParam || (!isNumeric && idParam ? idParam : null);
  const qs = isNumeric
    ? `id=${idParam}`
    : effectiveSlug
      ? `slug=${encodeURIComponent(effectiveSlug)}`
      : `name=${encodeURIComponent(idParam||'')}`;

  let game;
  try{
    const res = await fetch(`${apiBase()}/api/game?${qs}`);
    if(!res.ok) throw new Error(res.statusText);
    game = await res.json();
  }catch(e){
    console.error('Game fetch failed', e);
    const loadError = (typeof window.t === 'function') ? window.t('game.loadError', 'No se pudo cargar el juego.') : 'No se pudo cargar el juego.';
    root.innerHTML = `<p style="color:white">${loadError}</p>`;
    return;
  }

  const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
  const na = tr('common.na', 'N/A');
  const noDate = tr('common.noDate', 'Sin fecha');
  const locale = window.__GOKKEN_LOCALE__ || 'es-ES';

  const nd = tr('common.noData', 'N/D');
  const labelDeveloper = tr('game.developer', 'Desarrolladora');
  const labelPublisher = tr('game.publisher', 'Publisher');
  const labelCompany = tr('game.company', 'Compañía');
  const labelReleasedOn = tr('game.releasedOn', 'Lanzado el');
  const labelSummary = tr('game.summary', 'Resumen');
  const labelNoSummary = tr('game.noSummary', 'Sin resumen disponible.');
  const labelGenres = tr('game.genres', 'Géneros');
  const labelPlatforms = tr('game.platforms', 'Plataformas');
  const labelRating = tr('game.rating', 'Calificación');
  const labelClassification = tr('game.classification', 'Clasificación');
  const labelLanguages = tr('game.languages', 'Idiomas');
  const labelStory = tr('game.story', 'Historia');
  const labelReleaseToday = tr('game.releaseToday', 'Lanza hoy');
  const labelReleaseIn = tr('game.releaseIn', 'Lanza en');

  const name = game.name || 'Juego';
  const poster = imgUrl('t_cover_big', game.cover?.image_id);
  const heroId = (game.artworks?.[0]?.image_id) || (game.screenshots?.[0]?.image_id) || game.cover?.image_id;
  const hero = imgUrl('t_screenshot_big', heroId);
  const rating100 = Number(game.rating || 0);
  const rating10 = rating100 ? (rating100/10).toFixed(1) : na;
  const companies = (game.involved_companies||[]).map(ic=>ic.company?.name).filter(Boolean);
  const genres = (game.genres||[]).map(g=>({ id:g.id, name:g.name })).filter(g=>g.name);
  const platforms = (game.platforms||[]).map(p=>({ id:p.id, name:p.name })).filter(p=>p.name);
  const languageSupports = Array.from(new Set((game.language_supports||[]).map(ls=>ls.language?.name).filter(Boolean)));
  const releaseHuman = (game.release_dates?.[0]?.human) || (game.first_release_date ? new Date(game.first_release_date*1000).toLocaleDateString(locale) : noDate);
  const releaseTsMs = game.first_release_date ? game.first_release_date * 1000 : null;
  const isFutureRelease = releaseTsMs && releaseTsMs > Date.now();
  const screenshots = (game.screenshots||[]).slice(0,8);
  const artworks = (game.artworks||[]).slice(0,4);
  const videoId = (game.videos||[])[0]?.video_id || '';
  const short = game.summary || '';
  const long = game.storyline || game.summary || '';

  const media = [];
  if(videoId){
    media.push({ type:'video', src: toEmbed(videoId), thumb: youtubeThumb(videoId), poster: youtubeThumb(videoId), alt: `${name} trailer` });
  }
  screenshots.forEach(s=> media.push({ type:'image', src: imgUrl('t_screenshot_big', s.image_id), thumb: imgUrl('t_screenshot_med', s.image_id), alt: name }));
  artworks.forEach(a=> media.push({ type:'image', src: imgUrl('t_screenshot_big', a.image_id), thumb: imgUrl('t_screenshot_med', a.image_id), alt: name }));
  if(media.length===0){
    media.push({ type:'image', src: hero, thumb: poster, alt: name });
  }

  root.innerHTML = `
    <div class="game-page space-y-10">
      <section class="hero-top relative w-full min-h-[360px] lg:min-h-[440px] bg-cover bg-center flex items-end" style="background-image:url('${hero}')">
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90"></div>
        <div class="hero-top-content relative z-10 max-w-6xl mx-auto px-4 pb-10 pt-16 w-full flex flex-col gap-3">
          <h1 class="text-3xl md:text-4xl font-bold uppercase">${name}</h1>
          <div class="hero-meta-row grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-200">
            <div><span class="block text-xs uppercase tracking-wide text-gray-400">${labelDeveloper}</span>${companies[0]||nd}</div>
            <div><span class="block text-xs uppercase tracking-wide text-gray-400">${labelPublisher}</span>${companies[1]||companies[0]||nd}</div>
            <div><span class="block text-xs uppercase tracking-wide text-gray-400">${labelCompany}</span>${companies.join(', ')||nd}</div>
            <div><span class="block text-xs uppercase tracking-wide text-gray-400">${labelReleasedOn}</span>${releaseHuman}</div>
          </div>
          ${isFutureRelease ? `<div class="release-countdown inline-block bg-black/60 border border-white/10 px-4 py-2 rounded-lg font-semibold" id="releaseCountdown"></div>` : ''}
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 space-y-8">
        <section class="game-content grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
          <div class="media-column space-y-3">
            <div id="mainMedia" class="main-media modern rounded-xl overflow-hidden border border-border bg-black/40">${renderMain(media[0], name)}</div>
            <div class="thumbs modern flex flex-wrap gap-3">${media.map((m,idx)=>`
              <button class="thumb ${idx===0?'active':''} border border-border rounded-lg overflow-hidden focus:outline-none" data-idx="${idx}"><img class="w-24 h-14 object-cover" src="${m.thumb}" alt="thumb ${idx+1}"></button>
            `).join('')}</div>
          </div>
          <div class="info-column space-y-4">
            <div class="info-block bg-panel border border-border rounded-lg p-4 space-y-2">
              <h4 class="text-lg font-semibold">${labelSummary}</h4>
              <p class="text-gray-200 text-sm leading-relaxed">${short || labelNoSummary}</p>
            </div>
            <div class="info-grid grid grid-cols-2 gap-3">
              <div class="bg-panel border border-border rounded-lg p-3 space-y-2">
                <div class="stat-label text-xs uppercase tracking-wide text-gray-400">${labelGenres}</div>
                <div class="pill-row flex flex-wrap gap-2">${genres.map(g=>{
                  const query = g.id ? `genreId=${g.id}&genreName=${encodeURIComponent(g.name)}` : `q=${encodeURIComponent(g.name)}`;
                  return `<a class="pill pill-link inline-block bg-surface border border-border rounded-full px-3 py-1 text-sm hover:border-primary transition" href="results.html?${query}">${g.name}</a>`;
                }).join('') || `<span class="pill">${nd}</span>`}</div>
              </div>
              <div class="bg-panel border border-border rounded-lg p-3 space-y-2">
                <div class="stat-label text-xs uppercase tracking-wide text-gray-400">${labelPlatforms}</div>
                <div class="pill-row flex flex-wrap gap-2">${platforms.map(p=>{
                  const query = p.id ? `platformId=${p.id}&platformName=${encodeURIComponent(p.name)}` : `q=${encodeURIComponent(p.name)}`;
                  return `<a class="pill pill-link inline-block bg-surface border border-border rounded-full px-3 py-1 text-sm hover:border-primary transition" href="results.html?${query}">${p.name}</a>`;
                }).join('') || `<span class="pill">${nd}</span>`}</div>
              </div>
              <div class="stat-box bg-panel border border-border rounded-lg p-4 flex flex-col gap-2 items-start">
                <div class="stat-label text-xs uppercase tracking-wide text-gray-400">${labelRating}</div>
                <div class="stat-value text-2xl font-bold">${rating10}</div>
              </div>
              <div class="stat-box bg-panel border border-border rounded-lg p-4 flex flex-col gap-2 items-start">
                <div class="stat-label text-xs uppercase tracking-wide text-gray-400">${labelClassification}</div>
                <div class="badge-class inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold">${rating100 >= 180 ? '18' : '18'}</div>
              </div>
            </div>
            <div class="info-block bg-panel border border-border rounded-lg p-4 space-y-2">
              <h4 class="text-lg font-semibold">${labelLanguages}</h4>
              <div class="pill-row flex flex-wrap gap-2">
                ${languageSupports.map(lang=>`<span class="pill inline-block bg-surface border border-border rounded-full px-3 py-1 text-sm">${lang}</span>`).join('') || `<span class="pill">${nd}</span>`}
              </div>
            </div>
          </div>
        </section>

        <section class="game-description bg-panel border border-border rounded-lg p-4 space-y-2">
          <h4 class="text-lg font-semibold">${labelStory}</h4>
          <p class="text-gray-200 leading-relaxed text-sm">${String(long||tr('main.noDescription','Sin descripción')).replace(/\n/g,'<br>')}</p>
        </section>
      </div>
    </div>
  `;

  if(isFutureRelease){
    const cdEl = document.getElementById('releaseCountdown');
    const formatCountdown = (ms)=>{
      const totalSeconds = Math.max(0, Math.floor(ms/1000));
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if(days > 0) return `${days}d ${hours}h ${minutes}m`;
      if(hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      return `${minutes}m ${seconds}s`;
    };
    const tick = ()=>{
      if(!cdEl) return;
      const now = Date.now();
      const diff = releaseTsMs - now;
      if(diff <= 0){
        cdEl.textContent = labelReleaseToday;
        return true;
      }
      cdEl.textContent = `${labelReleaseIn} ${formatCountdown(diff)}`;
      return false;
    };
    let stop = tick();
    if(!stop){
      const timer = setInterval(()=>{
        if(tick()) clearInterval(timer);
      }, 1000);
    }
  }

  const mainEl = document.getElementById('mainMedia');
  const thumbEls = root.querySelectorAll('.thumb');
  function mountVideoPlay(){
    const videoContainer = mainEl.querySelector('.main-video');
    if(!videoContainer) return;
    const playBtn = videoContainer.querySelector('.play-btn');
    playBtn?.addEventListener('click', ()=>{
      const src = videoContainer.dataset.src;
      if(!src) return;
      videoContainer.outerHTML = `<iframe src="${src}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    });
  }
  mountVideoPlay();

  thumbEls.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.idx||0);
      thumbEls.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      mainEl.innerHTML = renderMain(media[idx], name);
      mountVideoPlay();
    });
  });
});
