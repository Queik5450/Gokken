function qs(name, url = window.location.href) {
    name = name.replace(/[[]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', () => {
    const id = qs('id') || '0';
    const root = document.getElementById('companyRoot');

    // placeholder sample company (you can replace with API call)
    const sample = {
        name: 'Sony Interactive Entertainment',
        logo: 'https://placehold.co/400x200/ffcc00/111?text=SIE',
        flag: 'https://flagcdn.com/us.svg',
        status: 'Activo',
        description: `Sony Interactive Entertainment impulsa los límites del entretenimiento y la innovación desde el lanzamiento de la PlayStation original en Japón en 1994. Hoy, seguimos ofreciendo experiencias innovadoras y emocionantes a una audiencia global a través de nuestra línea de productos y servicios PlayStation, que incluye hardware que define una generación, servicios de red pioneros y juegos galardonados.`,
        featured: [
            { img: 'https://placehold.co/180x240/333/fff?text=God+of+War', title: 'God of War' },
            { img: 'https://placehold.co/180x240/333/fff?text=Ghost+of+Tsushima', title: 'Ghost of Tsushima' },
            { img: 'https://placehold.co/180x240/333/fff?text=Spider-Man', title: "Marvel's Spider-Man" }
        ]
    };

    // build page
    root.innerHTML = `
        <div class="company-modal-content static-page">
            <div class="company-banner">
                <div class="company-banner-inner">
                    <div class="company-logo-wrap"><img src="${sample.logo}" alt="logo"></div>
                    <div class="company-stars"> <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                </div>
            </div>
            <div class="company-body">
                <div class="company-left">
                    <div class="info-row"><strong>País:</strong> <img class="flag" src="${sample.flag}" alt="Bandera"/></div>
                    <div class="info-row"><strong>Status:</strong> <span>${sample.status}</span></div>
                    <div class="info-row"><strong>Enlaces:</strong> <div class="cm-links"><i class="fab fa-playstation"></i></div></div>
                </div>
                <div class="company-right"><h3>Quiénes somos</h3><div class="cm-description">${sample.description}</div></div>
            </div>
            <div class="company-featured">
                <div class="featured-header"><strong>Juegos Destacados</strong></div>
                <div class="featured-wrapper">
                    <div class="featured-cards">
                        ${sample.featured.map(f => `<div class="fcard"><img src="${f.img}"><div class="ftitle">${f.title}</div></div>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
});
