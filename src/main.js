import './style.css'

const DESIGN_WIDTH = 1920;
const MIN_SCALE_BREAKPOINT = 768;

function supportsZoomProperty() {
  const testEl = document.createElement('div');
  return 'zoom' in testEl.style;
}

function ensureScaleContainer() {
  let wrapper = document.getElementById('scale-wrapper');
  let container = document.getElementById('scale-container');

  if (wrapper && container) return { wrapper, container };

  wrapper = document.createElement('div');
  wrapper.id = 'scale-wrapper';
  wrapper.style.width = '100%';
  // wrapper.style.overflowX = 'hidden';

  container = document.createElement('div');
  container.id = 'scale-container';
  container.style.transformOrigin = 'top left';
  container.style.marginLeft = 'auto';
  container.style.marginRight = 'auto';
  container.style.width = `${DESIGN_WIDTH}px`;

  // Insert wrapper at the top and move all existing children into container
  document.body.insertBefore(wrapper, document.body.firstChild);
  const nodesToMove = Array.from(document.body.children).filter((n) => n !== wrapper);
  nodesToMove.forEach((node) => container.appendChild(node));
  wrapper.appendChild(container);

  return { wrapper, container };
}

function applyScale(scale) {
  const container = document.getElementById('scale-container');
  if (!container) return;

  if (supportsZoomProperty()) {
    container.style.zoom = String(scale);
    container.style.transform = '';
    container.style.width = `${DESIGN_WIDTH}px`;
    container.style.marginLeft = 'auto';
    container.style.marginRight = 'auto';
  } else {
    container.style.zoom = '';
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'top left';
    const viewportWidth = window.innerWidth;
    const visualWidth = DESIGN_WIDTH * scale;
    const leftOffset = Math.max(0, (viewportWidth - visualWidth) / 2);
    container.style.marginLeft = `${leftOffset}px`;
    container.style.marginRight = '0px';
    container.style.width = `${DESIGN_WIDTH}px`;
  }
}

function updateScale() {
  const { wrapper, container } = ensureScaleContainer();
  const viewportWidth = window.innerWidth;

  if (viewportWidth >= MIN_SCALE_BREAKPOINT) {
    const scale = Math.max(viewportWidth / DESIGN_WIDTH, 0.01);
    applyScale(scale);
    // wrapper.style.overflowX = 'hidden';
  } else {
    container.style.zoom = '';
    container.style.transform = '';
    container.style.marginLeft = 'auto';
    container.style.marginRight = 'auto';
    container.style.width = '100%';
    // wrapper.style.overflowX = 'visible';
  }
}

window.addEventListener('resize', updateScale);
window.addEventListener('orientationchange', updateScale);
document.addEventListener('DOMContentLoaded', updateScale);
updateScale();

// Checklist interactions and confetti trigger
function initChecklist() {
  const checks = Array.from(document.querySelectorAll('.check'));
  if (checks.length === 0) return;

  let confettiFired = false;

  async function maybeConfetti() {
    if (confettiFired) return;
    const allActive = checks.every((el) => el.classList.contains('active'));
    if (!allActive) return;
    confettiFired = true;
    try {
      const { default: confetti } = await import(
        'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.module.mjs'
      );

      const duration = 2000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.5 }
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.5 }
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } catch (err) {
      console.error('Confetti failed to load', err);
    }
  }

  checks.forEach((el) => {
    el.addEventListener('click', () => {
      if (!el.classList.contains('active')) {
        el.classList.add('active');
      }
      maybeConfetti();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChecklist);
} else {
  initChecklist();
}

// Scroll-tied horizontal marquee in the blue section (lines 90-156 in index.html)
function initScrollMarquee() {
  // Heuristic: find the section that contains many "креативная дисрапция" lines
  const sections = Array.from(document.querySelectorAll('section'));
  let marqueeSection = null;
  for (const s of sections) {
    const ps = Array.from(s.querySelectorAll('p'));
    const count = ps.filter((p) =>
      (p.textContent || '').toLowerCase().includes('креативная дисрапция')
    ).length;
    if (count >= 6) {
      marqueeSection = s;
      break;
    }
  }
  if (!marqueeSection) return;

  // Select the absolute-positioned rows inside this section
  const rowDivs = Array.from(marqueeSection.querySelectorAll('div.absolute'));
  if (rowDivs.length === 0) return;

  rowDivs.forEach((row) => {
    row.style.willChange = 'transform';
  });

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function update() {
    const rect = marqueeSection.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const total = rect.height + viewportH;
    const passed = Math.max(0, Math.min(total, viewportH - rect.top));
    const progress = clamp01(passed / total); // 0 when below view, 1 when fully passed

    const maxShift = Math.round(window.innerWidth * 0.5); // pixels

    rowDivs.forEach((row, idx) => {
      const dir = idx % 2 === 0 ? -1 : 1; // left, right, left, ...
      const x = dir * progress * maxShift;
      row.style.transform = `translate3d(${x}px, 0, 0)`;
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  document.addEventListener('DOMContentLoaded', update);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollMarquee);
} else {
  initScrollMarquee();
}

// Scroll-driven rotation for the star image (index.html 43-44)
function initStarSpin() {
  const star = document.querySelector('img[src="/Star.png"]');
  if (!star) return;

  star.style.willChange = 'transform';
  star.style.transformOrigin = '50% 50%';

  function update() {
    const y = window.scrollY || window.pageYOffset || 0;
    const angle = y * 0.15; // degrees per pixel scrolled
    star.style.transform = `rotate(${angle}deg)`;
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  document.addEventListener('DOMContentLoaded', update);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStarSpin);
} else {
  initStarSpin();
}

// Smooth anchor scrolling (JS fallback/enhancement)
function initSmoothAnchors() {
  function isHashLink(el) {
    return el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').startsWith('#') && el.getAttribute('href') !== '#';
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('a');
    if (!el || !isHashLink(el)) return;

    const hash = el.getAttribute('href');
    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // update URL hash without jumping
    history.pushState(null, '', hash);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSmoothAnchors);
} else {
  initSmoothAnchors();
}
