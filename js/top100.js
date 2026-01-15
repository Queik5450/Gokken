function apiBase(){
  return `https://gokken-seven.vercel.app`;
}

function sampleTop(){
  return [
    { id: 1942, name: 'The Witcher 3: Wild Hunt', rating: 94.5, cover: { image_id: 'co1r16' }, summary: 'A dark fantasy RPG.', genres:[{name:'RPG'}], platforms:[{name:'PC'},{name:'PS4'}], first_release_date: 1432147200 },
    { id: 1877, name: 'Red Dead Redemption 2', rating: 94.2, cover: { image_id: 'co1l7n' }, summary: 'Epic Western open world.', genres:[{name:'Adventure'}], platforms:[{name:'PS4'},{name:'Xbox One'}], first_release_date: 1540339200 },
    { id: 11133, name: 'God of War', rating: 92.0, cover: { image_id: 'co1tmu' }, summary: 'Father and son journey.', genres:[{name:'Action'}], platforms:[{name:'PS4'}], first_release_date: 1524096000 }
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
  return `<div class="score-badge text-sm font-semibold px-3 py-1 rounded-full text-gray-900" style="background:${color}">${(r||0).toFixed ? (r||0).toFixed(1) : r}</div>`;
}

function renderList(games){
  const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);
  const root = document.getElementById('top100List');
  if(!root) return;
  root.innerHTML = games.map((g,idx)=>`
    <article class="top-item flex items-start gap-4 bg-panel border border-border rounded-xl p-4 hover:border-primary transition cursor-pointer">
      <div class="rank w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center text-sm font-bold text-gray-200">${idx+1}</div>
      ${scoreBadge(g.rating || 0)}
      <div class="thumb w-16 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-border shrink-0">
        <img src="${coverUrl(g)}" alt="${g.name}" class="w-full h-full object-cover">
      </div>
      <div class="info flex-1 min-w-0">
        <h3 class="name text-base font-semibold text-gray-100 leading-tight truncate">${g.name}</h3>
        <p class="desc text-sm text-gray-300 leading-relaxed">${g.summary? g.summary : tr('top100.noDesc','Descripción no disponible.')}</p>
      </div>
    </article>
  `).join('');

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

  const fPlatform = document.getElementById('fPlatform');
  const fGenre = document.getElementById('fGenre');
  const fRating = document.getElementById('fRating');
  const fRelease = document.getElementById('fRelease');

  function uniqueSorted(list){
    return Array.from(new Set(list.filter(Boolean))).sort((a,b)=> a.localeCompare(b));
  }

  function yearBucket(ts){
    if(!ts) return 'all';
    const y = new Date(ts*1000).getFullYear();
    const now = new Date().getFullYear();
    if(y >= now-4) return 'last5';
    if(y >= 2010) return '2010s';
    if(y >= 2000) return '2000s';
    return 'older';
  }

  function buildFilters(data){
    const platforms = uniqueSorted(data.flatMap(g=> (g.platforms||[]).map(p=>p.name)));
    const genres = uniqueSorted(data.flatMap(g=> (g.genres||[]).map(gm=>gm.name)));

    if(fPlatform){
      fPlatform.innerHTML = `<option value="all">Todas</option>` + platforms.map(p=>`<option value="${p}">${p}</option>`).join('');
      fPlatform.disabled = false;
    }
    if(fGenre){
      fGenre.innerHTML = `<option value="all">Todos</option>` + genres.map(g=>`<option value="${g}">${g}</option>`).join('');
      fGenre.disabled = false;
    }
    if(fRelease){
      fRelease.innerHTML = `
        <option value="all">Todas</option>
        <option value="last5">Últimos 5 años</option>
        <option value="2010s">2010-2019</option>
        <option value="2000s">2000-2009</option>
        <option value="older">Antes de 2000</option>`;
      fRelease.disabled = false;
    }
  }

  function applyFilters(){
    const rangeVal = fRating?.value || 'all';
    let rMin = 0, rMax = 100;
    if(rangeVal !== 'all'){
      const parts = rangeVal.split('-');
      if(parts.length === 2){
        rMin = Number(parts[0]) || 0;
        rMax = Number(parts[1]) || 100;
      }
    }
    const pSel = fPlatform?.value || 'all';
    const gSel = fGenre?.value || 'all';
    const rSel = fRelease?.value || 'all';

    const filtered = games.filter(g=>{
      const rating = Number(g.rating || 0);
      const ratingOk = rating >= rMin && rating <= rMax;
      const plats = (g.platforms||[]).map(p=>p.name);
      const genres = (g.genres||[]).map(x=>x.name);
      const platformOk = pSel==='all' || plats.includes(pSel);
      const genreOk = gSel==='all' || genres.includes(gSel);
      const releaseOk = rSel==='all' || yearBucket(g.first_release_date) === rSel;
      return ratingOk && platformOk && genreOk && releaseOk;
    });
    renderList(filtered);
  }

  buildFilters(games);
  renderList(games);

  [fPlatform, fGenre, fRating, fRelease].forEach(sel=>{
    sel?.addEventListener('change', applyFilters);
  });
});
