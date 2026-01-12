function qs(name, url = window.location.href) {
    name = name.replace(/[[]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function apiBase(){
    const hinted = window.__API_BASE__;
    if (hinted) return hinted.replace(/\/$/,'');
    const { protocol, hostname } = window.location;
    const host = hostname || 'localhost';
    const port = 8080;
    return `${protocol.includes('http')? 'http' : 'http'}://${host}:${port}`;
}

function logoUrl(company){
    const id = company.logo ? company.logo.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${id}.png` : 'https://placehold.co/200x200/ffcc00/111?text=LOGO';
}

function coverUrl(game){
    const id = game.cover ? game.cover.image_id : '';
    return id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg` : 'https://placehold.co/180x240/333/fff?text=Cover';
}

function starIcons(avg){
    const stars = Math.round((avg || 0) / 20);
    return Array.from({length:5}).map((_,i)=>`<i class="fas fa-star" style="opacity:${i<stars?1:0.2}"></i>`).join('');
}

function formatDate(ts){
    if(!ts) return '';
    return new Date(ts*1000).toLocaleDateString('es-ES', { year:'numeric', month:'short', day:'2-digit' });
}

const FALLBACK_COMPANY = {
    name: 'Sample Studio',
    description: 'Descripción genérica del estudio. Sustituya con datos reales cuando el API no responda.',
    logo: { image_id: 'co6exk' },
    country: null,
    websites: [],
    avg_rating: 82,
    games: [
        { name:'Sample Game 1', cover:{ image_id:'co1r16' }, id:101 },
        { name:'Sample Game 2', cover:{ image_id:'co1l7n' }, id:102 },
        { name:'Sample Game 3', cover:{ image_id:'co1tmu' }, id:103 },
        { name:'Sample Game 4', cover:{ image_id:'co1wyy' }, id:104 }
    ]
};

async function fetchCompany(id){
    const url = `${apiBase()}/api/company?id=${encodeURIComponent(id)}`;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error(res.statusText);
        return await res.json();
    }catch(e){
        console.error('Company fetch error', e);
        return FALLBACK_COMPANY;
    }
}

function renderCompany(root, data){
    if(!root) return;
    const games = data.games || [];
    const featured = games.slice(0,5);
    const countryTxt = data.country ? `País código: ${data.country}` : 'País: Desconocido';
    const ratingTxt = data.avg_rating ? `${data.avg_rating.toFixed(1)} / 100` : 'Sin rating';

    root.innerHTML = `
        <div class="company-modal-content static-page">
            <div class="company-banner">
                <div class="company-banner-inner">
                    <div class="company-logo-wrap"><img src="${logoUrl(data)}" alt="${data.name}"></div>
                    <div class="company-stars">${starIcons(data.avg_rating)}</div>
                </div>
            </div>
            <div class="company-body">
                <div class="company-left">
                    <div class="info-row"><strong>${countryTxt}</strong></div>
                    <div class="info-row"><strong>Rating:</strong> <span>${ratingTxt}</span></div>
                    <div class="info-row"><strong>Enlaces:</strong>
                        <div class="cm-links">
                            ${(data.websites||[]).slice(0,3).map(w=>`<a href="${w.url}" target="_blank" rel="noreferrer">🔗</a>`).join(' ') || '<span>Sin enlaces</span>'}
                        </div>
                    </div>
                </div>
                <div class="company-right"><h3>Quiénes somos</h3><div class="cm-description">${data.description || 'Sin descripción'}</div></div>
            </div>
            <div class="company-featured">
                <div class="featured-header"><strong>Juegos Destacados</strong></div>
                <div class="featured-wrapper">
                    <button class="fnav" data-fprev><i class="fas fa-chevron-left"></i></button>
                    <div class="featured-cards">
                        ${featured.map(f => `<div class="fcard" data-game-id="${f.id || f.slug || ''}"><img src="${coverUrl(f)}"><div class="ftitle">${f.name}</div></div>`).join('') || '<div class="list-placeholder">Sin juegos</div>'}
                    </div>
                    <button class="fnav" data-fnext><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    `;

    const cards = root.querySelector('.featured-cards');
    root.querySelector('[data-fprev]')?.addEventListener('click', ()=> cards?.scrollBy({left:-200, behavior:'smooth'}));
    root.querySelector('[data-fnext]')?.addEventListener('click', ()=> cards?.scrollBy({left:200, behavior:'smooth'}));

    root.querySelectorAll('.fcard').forEach(card=>{
        card.style.cursor='pointer';
        card.addEventListener('click', ()=>{
            const gid = card.getAttribute('data-game-id');
            if(gid) window.location.href = `game.html?id=${gid}`;
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const id = qs('id') || '0';
    const root = document.getElementById('companyRoot');
    const data = await fetchCompany(id);
    renderCompany(root, data);
});
