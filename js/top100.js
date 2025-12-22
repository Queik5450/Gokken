async function fetchTop(limit=100){
  try{
    const res = await fetch(`http://localhost:8080/api/top-games?limit=${limit}`);
    if(!res.ok) throw new Error(res.statusText);
    return await res.json();
  }catch(e){
    console.error('Top fetch error', e);
    return [];
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
      ${scoreBadge(g.rating||Math.random()*30+70)}
      <div class="thumb"><img src="${coverUrl(g)}" alt="${g.name}"></div>
      <div class="info">
        <h3 class="name">${g.name}</h3>
        <p class="desc">${g.summary? g.summary : 'Descripción no disponible. Añade tu resumen o conecta la API para completarlo.'}</p>
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
