// ===== util: parseo de hash con query =====
function parseHash(){
  const raw = location.hash.replace(/^#\/?/, '');
  const [route, query=''] = raw.split('?');
  const params = {};
  if (query){
    query.split('&').forEach(p=>{
      const [k,v] = p.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { route: route || 'inicio', params };
}

const routes = ["inicio","catalogo","colecciones","sobre","contacto","carrito"];
const $views = [...document.querySelectorAll('.view')];

// ===== router =====
function showRoute(){
  const { route:rawRoute, params } = parseHash();
  const route = routes.includes(rawRoute) ? rawRoute : 'inicio';
  $views.forEach(v => v.classList.toggle('active', v.dataset.route === route));
  document.getElementById('sheet')?.classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});

  if (route === 'colecciones'){
    const slug = (params.c || '').toLowerCase();
    if (slug){ renderCollection(slug); } else { toggleCollections(false); }
  }
}
window.addEventListener('hashchange', showRoute);
window.addEventListener('DOMContentLoaded', showRoute);

// ===== navegación SPA =====
document.addEventListener('click', (e)=>{
  const a = e.target.closest('[data-link]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#/')){
    e.preventDefault();
    location.hash = href.replace('#','');
  }
});

// ===== menú móvil =====
const sheet = document.getElementById('sheet');
document.getElementById('openMenu')?.addEventListener('click', ()=> sheet.classList.add('open'));
sheet?.addEventListener('click', (e)=>{ if (e.target.matches('a')) sheet.classList.remove('open'); });
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') sheet?.classList.remove('open'); });

// ===== filtro por categoría (catálogo) =====
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', ()=>{
    const f = btn.dataset.filter;
    document.querySelectorAll('#gridCatalogo .card').forEach(card => {
      card.style.display = (f === 'todos' || card.dataset.cat === f) ? '' : 'none';
    });
  });
});

// ===== carrito =====
const cart = new Map(); // id -> {qty, name, price, img}
function renderCart(){
  const count = [...cart.values()].reduce((s,i)=>s + i.qty, 0);
  const n = document.getElementById('cartCount');
  if (n) n.textContent = count;

  const wrap = document.getElementById('cartItems');
  if (!wrap) return;
  wrap.innerHTML = '';
  cart.forEach((it, id)=>{
    const el = document.createElement('div');
    el.className = 'cart-row';
    el.innerHTML = `
      <div class="cart-info">
        ${it.img ? `<img class="cart-thumb" src="${it.img}" alt="">` : ''}
        <div>
          <div class="cart-title">${it.name}</div>
          <div style="color:var(--muted)">Unidad $${it.price.toLocaleString('es-CO')}</div>
        </div>
      </div>
      <div class="cart-controls">
        <button class="qty-btn" data-dec="${id}">−</button>
        <b>${it.qty}</b>
        <button class="qty-btn" data-inc="${id}">+</button>
      </div>`;
    wrap.appendChild(el);
  });
}
function addToCart(id, name, price, img){
  const item = cart.get(id) || {qty:0, name, price, img};
  if (!item.img && img) item.img = img;
  item.qty += 1;
  cart.set(id, item);
  renderCart();
  toast('Producto agregado');
}
function changeQty(id, d){
  const it = cart.get(id);
  if (!it) return;
  it.qty += d;
  if (it.qty <= 0) cart.delete(id);
  renderCart();
}
document.addEventListener('click', (e)=>{
  const btnAdd = e.target.closest('[data-add]');
  if (btnAdd){
    const card = btnAdd.closest('.card');
    const title = card.querySelector('h3')?.textContent?.trim() || 'Producto';
    const price = Number(card.querySelector('.price strong')?.textContent?.replace(/[^0-9]/g,'') || 0);
    const img = card.querySelector('.card-media img')?.getAttribute('src') || '';
    addToCart(btnAdd.dataset.add, title, price, img);
  }
  if (e.target.matches('[data-inc]')) changeQty(e.target.dataset.inc, +1);
  if (e.target.matches('[data-dec]')) changeQty(e.target.dataset.dec, -1);
});

// ===== checkout por WhatsApp =====
document.getElementById('checkoutBtn')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (cart.size === 0){
    toast('El carrito está vacío');
    return;
  }
  const items = [...cart.values()]
    .map((it,i)=> `${i+1}. ${it.name} × ${it.qty} — $${(it.price*it.qty).toLocaleString('es-CO')}`)
    .join('%0A');
  const total = [...cart.values()].reduce((s,i)=>s + i.qty*i.price, 0);
  const msg = `Hola, quiero finalizar mi compra:%0A%0A${items}%0A%0ATotal: $${total.toLocaleString('es-CO')}`;
  const url = `https://wa.me/573013748515?text=${msg}`;
  window.open(url, '_blank');
});

// ===== contacto: enviar por correo =====
document.getElementById('contactForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const form = e.target;
  const nombre  = form.nombre.value.trim();
  const email   = form.email.value.trim();
  const mensaje = form.mensaje.value.trim();

  const subject = encodeURIComponent('Nuevo mensaje desde Art Punch Colombia');
  const body = encodeURIComponent(
    `Nombre: ${nombre}\nEmail: ${email}\n\nMensaje:\n${mensaje}`
  );

  // Esto abre el cliente de correo del usuario con el mensaje listo
  window.location.href = `mailto:svelasco14@hotmail.com?subject=${subject}&body=${body}`;
});

// ===== toast =====
function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed; right:18px; bottom:18px; background:var(--accent); color:#fff; padding:10px 14px; border-radius:999px; box-shadow:var(--shadow-md); z-index:1000; opacity:0; transform:translateY(6px); transition:.2s';
  document.body.appendChild(t);
  requestAnimationFrame(()=>{
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
  });
  setTimeout(()=>{
    t.style.opacity = '0';
    t.style.transform = 'translateY(6px)';
    setTimeout(()=>t.remove(), 200);
  }, 1600);
}

// ===== Vista rápida (overlay) al hacer clic =====
(function(){
  const overlay = document.createElement('div');
  overlay.className = 'hover-preview';
  overlay.innerHTML = `
    <div class="preview-frame" role="dialog" aria-label="Vista rápida" aria-modal="true">
      <div class="preview-main"><img alt=""></div>
      <div class="preview-thumbs"></div>
    </div>`;
  document.body.appendChild(overlay);

  const frame   = overlay.querySelector('.preview-frame');
  const mainImg = overlay.querySelector('.preview-main img');
  const thumbs  = overlay.querySelector('.preview-thumbs');

  let currentUrls = [];
  let onMove = null;

  function show(idx){
    if (!currentUrls.length) return;
    mainImg.src = currentUrls[idx];
    [...thumbs.children].forEach((t,i)=>t.classList.toggle('active', i === idx));
  }

  function close(){
    overlay.classList.remove('show');
    thumbs.innerHTML = '';
    const main = overlay.querySelector('.preview-main');
    if (onMove){
      main.removeEventListener('mousemove', onMove);
      onMove = null;
    }
    document.removeEventListener('keydown', onEsc);
  }

  function onEsc(ev){
    if (ev.key === 'Escape') close();
  }

  // cerrar al hacer clic fuera del cuadro
  overlay.addEventListener('click', (ev)=>{
    if (ev.target === overlay) close();
  });

  function bindGallery(card){
    const raw = (card.dataset.gallery || '').trim();
    if (!raw) return;
    const urls = raw.split('|').map(s=>s.trim()).filter(Boolean);
    if (!urls.length) return;

    const media = card.querySelector('.card-media');
    if (!media) return;

    // burbuja "Clic para ver más"
    if (!media.querySelector('.gallery-hint')){
      media.style.position = 'relative';
      const hint = document.createElement('div');
      hint.className = 'gallery-hint';
      hint.textContent = 'Clic para ver más';
      hint.style.cssText = 'position:absolute; right:10px; bottom:10px; background:rgba(0,0,0,.65); color:#fff; font-size:11px; padding:4px 8px; border-radius:999px;';
      media.appendChild(hint);
    }

    media.addEventListener('click', ()=>{
      currentUrls = urls.slice();
      thumbs.innerHTML = '';

      currentUrls.forEach((u,i)=>{
        const im = new Image();
        im.src = u;
        im.alt = 'Vista ' + (i+1);
        im.addEventListener('mouseenter', ()=>show(i));
        im.addEventListener('click', ()=>show(i)); // móvil y desktop
        thumbs.appendChild(im);
      });

      const main = overlay.querySelector('.preview-main');
      // en desktop, cambiar según movimiento; en móvil solo con thumbs
      if (!window.matchMedia('(pointer: coarse)').matches && currentUrls.length > 1){
        onMove = function(e){
          const r = main.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
          const idx = Math.min(currentUrls.length - 1, Math.floor(x * currentUrls.length));
          show(idx);
        };
        main.addEventListener('mousemove', onMove);
      }

      overlay.classList.add('show');
      show(0);
      document.addEventListener('keydown', onEsc);
    });
  }

  // helper para cuando se clonan tarjetas
  window.attachGalleries = (root=document) => {
    root.querySelectorAll('.card[data-gallery]').forEach(bindGallery);
  };

  // binding inicial
  window.attachGalleries();
})();

// ===== Colecciones: render dinámico =====
const NAMES = { flora:'Flora', geometria:'Geometría', navidenos:'Navideños' };

function toggleCollections(filtered){
  const ov = document.getElementById('collectionsOverview');
  const fl = document.getElementById('collectionsFiltered');
  if (filtered){
    ov.style.display = 'none';
    fl.style.display = 'block';
  } else {
    ov.style.display = 'block';
    fl.style.display = 'none';
  }
}

function renderCollection(slug){
  const title = NAMES[slug] || 'Colección';
  document.getElementById('collectionTitle').textContent = `Colección ${title}`;

  const srcCards = [...document.querySelectorAll('#gridCatalogo .card')];
  const grid = document.getElementById('collectionsGrid');
  grid.innerHTML = '';

  const matches = srcCards.filter(c =>
    (c.dataset.collection || '')
      .split(',')
      .map(s=>s.trim().toLowerCase())
      .includes(slug)
  );

  if (matches.length === 0){
    grid.innerHTML = `<div class="card" style="padding:18px">Por ahora no hay piezas publicadas en esta colección.</div>`;
  } else {
    matches.forEach(card=>{
      const clone = card.cloneNode(true);
      grid.appendChild(clone);
    });
    // re-enlazar overlay para las tarjetas clonadas
    window.attachGalleries(grid);
  }

  toggleCollections(true);
}
