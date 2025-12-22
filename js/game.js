function getQueryParam(name, url = window.location.href) {
  name = name.replace(/[[]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', () => {
  const id = getQueryParam('id') || '0';
  const root = document.getElementById('gameRoot');

  // Temporal: datos de ejemplo. Puedes reemplazar por una llamada a tu backend más adelante.
  const sample = {
    id,
    name: 'IRE: A PROLOGUE',
    hero: 'https://placehold.co/1200x450/111/white?text=IRE+HERO',
    poster: 'https://placehold.co/360x200/222/fff?text=IRE',
    video: '',
    thumbs: [
      'https://placehold.co/120x80/333/fff?text=1',
      'https://placehold.co/120x80/333/fff?text=2',
      'https://placehold.co/120x80/333/fff?text=3',
      'https://placehold.co/120x80/333/fff?text=4'
    ],
    genres: ['Indie','Terror'],
    platforms: ['pc','ps5','switch'],
    rating: '9.8',
    classification: '18',
    short: "It's 1986, and you're stranded in the Bermuda Triangle -- but not alone...",
    long: `A missing father. A haunted ship. And thirteen doors to the truth.
    Emily's father has vanished — and the only clues to his disappearance lie aboard a ship lost deep in the Bermuda Triangle.

    To find him, and just maybe bring him back, you'll have to unlock 13 mysterious doors hiding in the ship's dark, narrow corridors — all while a monster stalking your every move.`
  };

  root.innerHTML = `
    <div class="game-detail">
      <div class="game-hero"><img src="${sample.hero}" alt="hero"></div>
      <div class="game-meta">
        <div class="left">
          <h1 class="game-title">${sample.name}</h1>
          <div class="meta-grid">
            <div><strong>Desarrolladora</strong><div>ProbablyMonsters</div></div>
            <div><strong>Publisher</strong><div>ProbablyMonsters</div></div>
            <div><strong>Compañía</strong><div>ProbablyMonsters</div></div>
            <div><strong>Lanzado el</strong><div>28/10/2025</div></div>
          </div>
        </div>
        <div class="right">
          <div class="poster"><img src="${sample.poster}" alt="poster"></div>
          <div class="badges">
            <div class="rating">${sample.rating}</div>
            <div class="classification">${sample.classification}</div>
          </div>
        </div>
      </div>

      <div class="media-row">
        <div class="main-video">${sample.video ? `<iframe src="${sample.video}" frameborder="0"></iframe>` : `<div class="video-fake">▶</div>`}</div>
        <div class="thumbs">${sample.thumbs.map(t => `<img src="${t}">`).join('')}</div>
      </div>

      <div class="game-body">
        <div class="col-left">
          <p class="short">${sample.short}</p>
          <h4>Géneros</h4>
          <div class="tags">${sample.genres.map(g=>`<span class="tag">${g}</span>`).join('')}</div>
          <h4>Plataformas</h4>
          <div class="tags">${sample.platforms.map(p=>`<span class="tag platform">${p}</span>`).join('')}</div>
          <h4>Lenguajes</h4>
          <div class="tags"><span class="tag">ESP</span><span class="tag">ENG</span></div>
        </div>
        <div class="col-right">
          <h4>Descripción</h4>
          <p>${sample.long.replace(/\n/g,'<br>')}</p>
        </div>
      </div>
    </div>
  `;
});
