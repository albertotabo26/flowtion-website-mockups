/* ==========================================================
   Flowtion · Opción 1 · Flujo
   Estado de la página y valores que dependen de él.
   ========================================================== */
const state = { tabA: 0, tabM: 0, menu: null };

// Menú móvil (overlay a pantalla completa)
function menuObj(on) {
  return { op: on ? 1 : 0, pe: on ? 'auto' : 'none', tf: on ? 'none' : 'translateY(-16px)' };
}

// Tabs de público (Profesionistas / Estudiantes / Corporativos)
function tabs(active, key, dy) {
  return [0, 1, 2].map(i => {
    const on = i === active;
    return {
      pick: () => setState({ [key]: i }),
      tabBg: on ? '#f0e991' : 'transparent',
      tabFg: on ? '#041c2c' : '#f4f5f0',
      op: on ? 1 : 0,
      tf: on ? 'none' : `translateY(${dy}px)`,
      pe: on ? 'auto' : 'none',
    };
  });
}

function vals() {
  return {
    audA: tabs(state.tabA, 'tabA', 24),   // escritorio
    audAM: tabs(state.tabM, 'tabM', 20),  // móvil
    mA: menuObj(state.menu === 'a'),
    toggleA: () => setState(s => ({ menu: s.menu === 'a' ? null : 'a' })),
    // Formas del hero que siguen al cursor
    heroMove: e => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      e.currentTarget.querySelectorAll('[data-mouse]').forEach(el => {
        const f = +el.dataset.mouse;
        el.style.transform = `translate(${x * f}px,${y * f}px)`;
      });
    },
  };
}


/* ==========================================================
   Motor de la página: enlaces de estado, eventos,
   animaciones y cambio de vista escritorio / móvil.
   ========================================================== */
function getPath(obj, p) {
  return p.replace(/\[(\d+)\]/g, '.$1').split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

// Re-aplica los estilos que dependen del estado (data-bind-style)
function render() {
  const v = vals();
  document.querySelectorAll('[data-bind-style]').forEach(el => {
    const s = el.dataset.bindStyle.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => getPath(v, p));
    if (el.getAttribute('style') !== s) el.setAttribute('style', s);
  });
}

function setState(patch) {
  Object.assign(state, typeof patch === 'function' ? patch(state) : patch);
  render();
}

// data-on-click / data-on-mouseenter / data-on-mousemove="ruta.al.handler"
['click', 'mouseenter', 'mousemove'].forEach(type => {
  document.querySelectorAll(`[data-on-${type}]`).forEach(el => {
    el.addEventListener(type, e => {
      const fn = getPath(vals(), el.getAttribute(`data-on-${type}`));
      if (typeof fn === 'function') fn(e);
    });
  });
});

// ---------- Animaciones ----------
function initAnim() {
  const ease = 'cubic-bezier(.2,.7,.1,1)';
  const reveal = el => {
    if (el.dataset.words) {
      el.querySelectorAll('[data-word]').forEach((w, i) => {
        const from = getComputedStyle(w).color, to = w.dataset.to || '#041c2c';
        w.animate([{ color: from }, { color: to }], { duration: 500, delay: 200 + i * 55, fill: 'both', easing: 'ease-out' });
      });
    } else {
      el.style.opacity = '';
      el.animate([{ opacity: 0, transform: el.dataset.from || 'translateY(48px)' }, { opacity: 1, transform: 'none' }],
        { duration: 1000, delay: +el.dataset.delay || 0, easing: ease, fill: 'backwards' });
    }
  };

  // Entradas al hacer scroll
  const pending = document.querySelectorAll('[data-reveal],[data-words]');
  pending.forEach(el => { if (el.dataset.reveal) el.style.opacity = '0'; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    pending.forEach(el => io.observe(el));
  } else {
    pending.forEach(reveal);
  }

  // Formas flotantes
  document.querySelectorAll('[data-float]').forEach(el => {
    const [dx, dy, deg, dur] = el.dataset.float.split(',').map(Number);
    const base = el.style.transform || '';
    el.animate([
      { transform: `${base} translate(0,0) rotate(0deg)` },
      { transform: `${base} translate(${dx}px,${dy}px) rotate(${deg}deg)` },
      { transform: `${base} translate(0,0) rotate(0deg)` },
    ], { duration: dur, iterations: Infinity, easing: 'ease-in-out' });
  });
  // Sellos giratorios
  document.querySelectorAll('[data-spin]').forEach(el => {
    el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: +el.dataset.spin, iterations: Infinity });
  });
  // Cintas de texto
  document.querySelectorAll('[data-marquee]').forEach(el => {
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: +el.dataset.marquee, iterations: Infinity });
  });
}

// ---------- Vista escritorio / móvil ----------
const scaler = document.querySelector('.scaler');
function fit() {
  // Escala el diseño de 1440 px para que quepa en pantallas más chicas
  if (!scaler) return;
  const avail = document.documentElement.clientWidth - 48;
  scaler.style.zoom = Math.min(1, avail / 1440);
}
function showView(name) {
  document.querySelectorAll('[data-view-panel]').forEach(p => { p.hidden = p.dataset.viewPanel !== name; });
  document.querySelectorAll('.pres-switch [data-view]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === name)));
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  window.scrollTo(0, 0);
  fit();
}
document.querySelectorAll('.pres-switch [data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
window.addEventListener('resize', fit);
// Los enlaces de muestra (href="#") no deben cambiar la vista
document.querySelectorAll('.card a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

showView(location.hash === '#movil' ? 'movil' : 'escritorio');
render();
setTimeout(initAnim, 60);
