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
    return `
      <div class="main-video" data-type="video" data-src="${src}">
        ${poster ? `<img class="video-poster" src="${poster}" alt="${name} trailer">` : ''}
        <button class="play-btn" aria-label="Reproducir video">▶</button>
      </div>
    `;
  }
  return `<img src="${item.src}" alt="${item.alt || name}">`;
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
    root.innerHTML = `<p style="color:white">No se pudo cargar el juego.</p>`;
    return;
  }

  const name = game.name || 'Juego';
  const poster = imgUrl('t_cover_big', game.cover?.image_id);
  const heroId = (game.artworks?.[0]?.image_id) || (game.screenshots?.[0]?.image_id) || game.cover?.image_id;
  const hero = imgUrl('t_screenshot_big', heroId);
  const rating100 = Number(game.rating || 0);
  const rating10 = rating100 ? (rating100/10).toFixed(1) : 'N/A';
  const companies = (game.involved_companies||[]).map(ic=>ic.company?.name).filter(Boolean);
  const genres = (game.genres||[]).map(g=>g.name);
  const platforms = (game.platforms||[]).map(p=>p.name);
  const releaseHuman = (game.release_dates?.[0]?.human) || (game.first_release_date ? new Date(game.first_release_date*1000).toLocaleDateString('es-ES') : 'N/D');
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
    <div class="game-page">
      <section class="hero-top" style="background-image:url('${hero}')">
        <div class="hero-top-content">
          <h1>${name}</h1>
          <div class="hero-meta-row">
            <div><span>Desarrolladora</span>${companies[0]||'N/D'}</div>
            <div><span>Publisher</span>${companies[1]||companies[0]||'N/D'}</div>
            <div><span>Compañía</span>${companies.join(', ')||'N/D'}</div>
            <div><span>Lanzado el</span>${releaseHuman}</div>
          </div>
        </div>
      </section>

      <section class="game-content">
        <div class="media-column">
          <div id="mainMedia" class="main-media modern">${renderMain(media[0], name)}</div>
          <div class="thumbs modern">${media.map((m,idx)=>`
            <button class="thumb ${idx===0?'active':''}" data-idx="${idx}"><img src="${m.thumb}" alt="thumb ${idx+1}"></button>
          `).join('')}</div>
        </div>
        <div class="info-column">
          <div class="info-block">
            <h4>Resumen</h4>
            <p>${short || 'Sin resumen disponible.'}</p>
          </div>
          <div class="info-grid">
            <div>
              <div class="stat-label">Géneros</div>
              <div class="pill-row">${genres.map(g=>`<span class="pill">${g}</span>`).join('') || '<span class="pill">N/D</span>'}</div>
            </div>
            <div>
              <div class="stat-label">Plataformas</div>
              <div class="pill-row">${platforms.map(p=>`<span class="pill">${p}</span>`).join('') || '<span class="pill">N/D</span>'}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Calificación</div>
              <div class="stat-value">${rating10}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Clasificación</div>
              <div class="badge-class">${rating100 >= 180 ? '18' : '18'}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="game-description">
        <h4>Historia</h4>
        <p>${String(long||'Sin descripción').replace(/\n/g,'<br>')}</p>
      </section>
    </div>
  `;

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
