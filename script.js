const routes = ["inicio", "catalogo", "colecciones", "sobre", "contacto", "carrito"];
const $views = [...document.querySelectorAll('.view')];

// ===== Router =====
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [route, query = ''] = raw.split('?');
  const params = {};
  if (query) {
    query.split('&').forEach(p => {
      const [k, v] = p.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { route: route || 'inicio', params };
}

function showRoute() {
  const { route: rawRoute, params } = parseHash();
  const route = routes.includes(rawRoute) ? rawRoute : 'inicio';

  $views.forEach(v => v.classList.toggle('active', v.dataset.route === route));
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (route === 'colecciones') {
    const slug = (params.c || '').toLowerCase();
    if (slug) { renderCollection(slug); } else { toggleCollections(false); }
  }
}

/* Menú Móvil */
const sheet = document.getElementById('sheet');
const backdrop = document.getElementById('sheetBackdrop');
const btnOpen = document.getElementById('openMenu');
const btnClose = document.getElementById('closeMenu');

function openMobileMenu() { sheet?.classList.add('open'); backdrop?.classList.add('open'); }
function closeMobileMenu() { sheet?.classList.remove('open'); backdrop?.classList.remove('open'); }

btnOpen?.addEventListener('click', openMobileMenu);
btnClose?.addEventListener('click', closeMobileMenu);
backdrop?.addEventListener('click', closeMobileMenu);

/* Eventos Globales */
window.addEventListener('hashchange', showRoute);
window.addEventListener('DOMContentLoaded', () => { 
  showRoute(); 
  initCart(); 
  initGallery(); 
});

/* Filtros Catálogo */
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active-filter'));
    btn.classList.add('active-filter');
    document.querySelectorAll('#gridCatalogo .card').forEach(card => {
      card.style.display = (f === 'todos' || card.dataset.cat === f) ? 'flex' : 'none';
    });
  });
});

/* Carrito */
const cart = new Map(); 
function initCart() {
  try {
    const stored = JSON.parse(localStorage.getItem('artPunchCart'));
    if (Array.isArray(stored)) stored.forEach(item => cart.set(item.id, item));
  } catch (e) {}
  renderCart();
}
function saveCart() {
  localStorage.setItem('artPunchCart', JSON.stringify([...cart.values()]));
  renderCart();
}
function renderCart() {
  const count = [...cart.values()].reduce((s, i) => s + i.qty, 0);
  const n = document.getElementById('cartCount');
  if (n) n.textContent = count;

  const wrap = document.getElementById('cartItems');
  const emptyMsg = document.getElementById('cartEmptyMsg');
  const actions = document.getElementById('cartActions');

  if (!wrap) return;
  wrap.innerHTML = '';

  if (cart.size === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (actions) actions.style.display = 'none';
  } else {
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (actions) actions.style.display = 'flex';
    cart.forEach((it, id) => {
      const el = document.createElement('div');
      el.className = 'cart-row';
      el.innerHTML = `
        <div class="cart-info">
          ${it.img ? `<img class="cart-thumb" src="${it.img}">` : ''}
          <div>
            <div style="font-weight:600; font-size:15px">${it.name}</div>
            <div style="color:var(--muted); font-size:13px">$${it.price.toLocaleString('es-CO')}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px">
          <button class="qty-btn" data-dec="${id}">−</button>
          <b style="width:20px; text-align:center">${it.qty}</b>
          <button class="qty-btn" data-inc="${id}">+</button>
        </div>`;
      wrap.appendChild(el);
    });
  }
}
function addToCart(id, name, price, img) {
  const item = cart.get(id) || { id, qty: 0, name, price, img };
  if (!item.img && img) item.img = img;
  item.qty += 1;
  cart.set(id, item);
  saveCart();
  showToast('Producto agregado');
}
function changeQty(id, d) {
  const item = cart.get(id);
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart.delete(id);
  saveCart();
}

document.addEventListener('click', (e) => {
  const btnAdd = e.target.closest('[data-add]');
  if (btnAdd) {
    // Detener propagación para que no abra la galería si el botón está encima
    e.stopPropagation();
    const card = btnAdd.closest('.card');
    const title = card.querySelector('h3')?.textContent.trim();
    const price = Number(card.querySelector('.price strong')?.textContent.replace(/[^0-9]/g, ''));
    const img = card.querySelector('.card-media img')?.getAttribute('src');
    addToCart(btnAdd.dataset.add, title, price, img);
  }
  if (e.target.matches('[data-inc]')) changeQty(e.target.dataset.inc, 1);
  if (e.target.matches('[data-dec]')) changeQty(e.target.dataset.dec, -1);
});

/* WhatsApp Checkout */
document.getElementById('checkoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (cart.size === 0) return showToast('El carrito está vacío');
  const items = [...cart.values()].map(i => `${i.qty}x ${i.name}`).join('%0A');
  const total = [...cart.values()].reduce((s, i) => s + i.qty * i.price, 0);
  const url = `https://wa.me/573013748515?text=Hola, quiero pedir:%0A${items}%0A*Total: $${total.toLocaleString('es-CO')}*`;
  window.open(url, '_blank');
});

/* Toast Notificación */
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    // Icono de check SVG inline
    t.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <span></span>`;
    document.body.appendChild(t);
  }
  t.querySelector('span').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* Contacto */
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const nombre = form.nombre.value;
  const email = form.email.value;
  const mensaje = form.mensaje.value;

  const subject = `Nuevo mensaje de ${nombre}`;
  const body = `Nombre: ${nombre}\nEmail: ${email}\n\nMensaje:\n${mensaje}`;
  
  window.location.href = `mailto:svelasco14@hotmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

/* Galería */
function initGallery() {
  const overlay = document.createElement('div');
  overlay.className = 'hover-preview';
  overlay.innerHTML = `<button class="close-preview">&times;</button><div class="preview-frame"><div class="preview-main"><img src=""></div><div class="preview-thumbs"></div></div>`;
  document.body.appendChild(overlay);

  const mainImg = overlay.querySelector('.preview-main img');
  const thumbsContainer = overlay.querySelector('.preview-thumbs');
  
  overlay.querySelector('.close-preview').addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', (e) => { if(e.target === overlay) overlay.classList.remove('show'); });

  document.addEventListener('click', (e) => {
    const media = e.target.closest('.card-media');
    if (!media) return;
    
    const card = media.closest('.card');
    if (!card || !card.dataset.gallery) return; 

    const urls = card.dataset.gallery.split('|').map(s => s.trim());
    if(urls.length === 0) return;

    overlay.classList.add('show');
    thumbsContainer.innerHTML = '';
    
    const setImg = (url) => {
      mainImg.src = url;
      [...thumbsContainer.children].forEach(img => img.classList.toggle('active', img.src.includes(url)));
    };

    urls.forEach((url, i) => {
      const thumb = document.createElement('img');
      thumb.src = url;
      thumb.addEventListener('click', () => setImg(url));
      if(i===0) thumb.classList.add('active');
      thumbsContainer.appendChild(thumb);
    });

    setImg(urls[0]);
  });
}

/* Colecciones */
const NAMES = { flora: 'Flora', geometria: 'Geometría', navidenos: 'Navideños' };
function toggleCollections(filtered) {
  document.getElementById('collectionsOverview').style.display = filtered ? 'none' : 'block';
  document.getElementById('collectionsFiltered').style.display = filtered ? 'block' : 'none';
}
function renderCollection(slug) {
  const title = NAMES[slug] || 'Colección';
  document.getElementById('collectionTitle').textContent = `Colección ${title}`;
  const grid = document.getElementById('collectionsGrid');
  grid.innerHTML = '';
  
  const matches = [...document.querySelectorAll('#gridCatalogo .card')].filter(c => 
    (c.dataset.collection || '').split(',').map(s=>s.trim().toLowerCase()).includes(slug)
  );
  
  if (matches.length === 0) grid.innerHTML = '<div style="padding:20px">No hay productos en esta colección.</div>';
  else matches.forEach(c => grid.appendChild(c.cloneNode(true)));
  
  toggleCollections(true);
}
