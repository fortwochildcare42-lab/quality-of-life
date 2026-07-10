/* =====================================================
   QOL v7 — Main JS
===================================================== */

/* ─── Header scroll state ─── */
const header = document.getElementById('site-header');
const onScroll = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ─── Drawer (mobile menu) ─── */
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerFocusable = () =>
  drawer.querySelectorAll('a, button, select, textarea, input, [tabindex]:not([tabindex="-1"])');

function openDrawer() {
  drawer.hidden = false;
  // 次フレームで is-open を付与し、transition を発火させる
  requestAnimationFrame(() => drawer.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
  burger.setAttribute('aria-expanded', 'true');
  const focusables = drawerFocusable();
  if (focusables.length) focusables[0].focus();
}
function closeDrawer() {
  drawer.classList.remove('is-open');
  document.body.style.overflow = '';
  burger.setAttribute('aria-expanded', 'false');
  // transition 終了後に hidden へ（reduced-motion時は即時）
  window.setTimeout(() => { drawer.hidden = true; }, 600);
  burger.focus();
}
burger.addEventListener('click', () => {
  if (drawer.classList.contains('is-open')) closeDrawer();
  else openDrawer();
});
drawerClose.addEventListener('click', closeDrawer);
drawer.addEventListener('click', (e) => {
  if (e.target === drawer) closeDrawer();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !drawer.classList.contains('is-open')) return;
  closeDrawer();
});
/* フォーカストラップ：ドロワー内でTabがループするように */
drawer.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
  const focusables = Array.from(drawerFocusable());
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* ─── Reveal on scroll ─── */
const revealSelectors = [
  '.chapter__head',
  '.about__grid > *',
  '.awards__grid > *',
  '.school',
  '.kids-video',
  '.clinic__hero',
  '.clinic__body > *',
  '.bento',
  '.kitchen-map',
  '.town-card',
  '.town-home',
  '.town__aside',
  '.bonus',
  '.rec-block',
  '.voice',
  '.contact-box',
  '.mission__grid > *',
  '.hero__copy > *',
  '.hero__services',
];

revealSelectors.forEach((selector) => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    // stagger delay for lists
    if (i > 0 && i < 6) el.classList.add(`d-${i}`);
  });
});

const revealIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

/* ─── Count up numbers ───
   HTMLには最初から実際の数値を書いておき（JSが動かない場合の保険）、
   JSが動く場合のみ一旦0にしてからカウントアップさせる */
document.querySelectorAll('[data-count]').forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  if (Number.isNaN(target)) return;
  el.textContent = '0';
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const dur = target > 100 ? 1600 : 1100;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(ease * target).toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toLocaleString();
          };
          requestAnimationFrame(tick);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  io.observe(el);
});

/* ─── Nav active state (based on section in view) ─── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.site-header__nav a');
const navIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach((a) => {
          a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.35 }
);
sections.forEach((s) => navIO.observe(s));

/* ─── Smooth scroll for anchor links (with header offset) ─── */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    if (!id || id === 'top') {
      if (id === 'top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeDrawer();
      }
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const offset = 68;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    closeDrawer();
  });
});

/* ─── Recruit slider: 移動距離を実測して算出 ───
   track には同じ画像列を2セット並べて無限ループに見せている。
   ここでは「1セット分の実測幅」を --rec-slide-distance にセットすることで、
   画像の枚数や幅がCSS側と食い違っても途切れたりガタつかないようにする。 */
const recTrack = document.querySelector('.rec-slider__track');
function updateRecSlideDistance() {
  if (!recTrack) return;
  const halfWidth = recTrack.scrollWidth / 2;
  if (halfWidth > 0) {
    recTrack.style.setProperty('--rec-slide-distance', `${halfWidth}px`);
  }
}
if (recTrack) {
  window.addEventListener('load', updateRecSlideDistance);
  window.addEventListener('resize', updateRecSlideDistance, { passive: true });
  updateRecSlideDistance();
}

/* ─── Subtle parallax for hero mega text on scroll ─── */
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const megaLines = document.querySelectorAll('.hero__mega-line');
  const heroVisual = document.querySelector('.hero__visual-inner');

  const onScrollParallax = () => {
    const y = window.scrollY;
    if (y < 900) {
      // 階段状の静的オフセット（--mega-base-x）を消さないよう、
      // スクロール分は別変数 --mega-scroll-x に渡してCSS側のtransformで合成する
      megaLines.forEach((line) => {
        line.style.setProperty('--mega-scroll-x', `${y * 0.05}px`);
      });
      if (heroVisual) heroVisual.style.transform = `translateY(${y * 0.08}px)`;
    }
  };
  window.addEventListener('scroll', onScrollParallax, { passive: true });
}
