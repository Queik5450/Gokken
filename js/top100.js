function apiBase(){
  const hinted = window.__API_BASE__;
  if (hinted) return hinted.replace(/\/$/,'');
  const { protocol, hostname } = window.location;
  const host = hostname || 'localhost';
  const port = 8080;
  return `${protocol.includes('http')? 'http' : 'http'}://${host}:${port}`;
}

function sampleTop(){
  return [
    { id: 1942, name: 'The Witcher 3: Wild Hunt', rating: 94.5, cover: { image_id: 'co1r16' }, summary: 'A dark fantasy RPG.' },
    { id: 1877, name: 'Red Dead Redemption 2', rating: 94.2, cover: { image_id: 'co1l7n' }, summary: 'Epic Western open world.' },
    { id: 11133, name: 'God of War', rating: 92.0, cover: { image_id: 'co1tmu' }, summary: 'Father and son journey.' }
  ];
}

async function fetchTop(limit=100){
  try{
    const res = await fetch(`${apiBase()}/api/top-games?limit=${limit}`);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
  }catch(e){
    console.error('Top fetch error', e);
    return sampleTop();
  }
}

function coverUrl(game){
  const imageId = game.cover ? game.cover.image_id : '';
  return imageId ? `https://images.igdb.com/igdb/image/upload/t_cover_small/${imageId}.jpg` : 'https://placehold.co/80x80/333/fff?text=No+Img';
}

function scoreBadge(r){
  const n = Math.round((r||0));
  const color = n>=90? '#00b374' : n>=80? '#e25a00' : '#d4a600';
  return `<div class="score-badge" style="background:${color}">${(r||0).toFixed ? (r||0).toFixed(1) : r}</div>`;
}

function renderList(games){
  const root = document.getElementById('top100List');
  if(!root) return;
  root.innerHTML = games.map((g,idx)=>`
    <article class="top-item">
      <div class="rank">${idx+1}</div>
      ${scoreBadge(g.rating || 0)}
      <div class="thumb"><img src="${coverUrl(g)}" alt="${g.name}"></div>
      <div class="info">
        <h3 class="name">${g.name}</h3>
        <p class="desc">${g.summary? g.summary : 'Descripción no disponible.'}</p>
      </div>
    </article>
  `).join('');

  // click to game page
  root.querySelectorAll('.top-item').forEach((el, i)=>{
    el.style.cursor='pointer';
    el.addEventListener('click', ()=>{
      const id = games[i].id ?? encodeURIComponent(games[i].name.replace(/\s+/g,'-').toLowerCase());
      window.location.href = `game.html?id=${id}`;
    });
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const games = await fetchTop(100);
  renderList(games);

  // simple rating filter
  const fRating = document.getElementById('fRating');
  fRating?.addEventListener('change', ()=>{
    const min = fRating.value==='all'? 0 : Number(fRating.value);
    const filtered = games.filter(g=> (g.rating||0) >= min);
    renderList(filtered);
  });
});
