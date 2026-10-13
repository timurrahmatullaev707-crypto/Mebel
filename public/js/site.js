/**
 * MebelHisob - Mijoz Sayti Asosiy Skripti (site.js)
 * Hero parallax, suzuvchi mebel konturlari, scroll reveal va ishga tushirish
 */
import { initTheme, initAccordions, initMobileMenu, animateNumber } from './ui.js';
import { createVisualizer } from './visual.js';
import { FurnitureCalculator } from './calculator.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Asosiy interfeys boshqaruvlari
  initTheme();
  initAccordions();
  initMobileMenu();

  // 2. Jonli vizualizatsiya va Kalkulyatorni ishga tushirish
  const visualSvg = document.getElementById('mebel-visual-svg');
  if (visualSvg) {
    const visualizer = createVisualizer(visualSvg);
    const calculator = new FurnitureCalculator(visualizer);
    calculator.init();
  }

  // 3. Hero bo'limi suzuvchi mebel konturlari va parallaks
  initHeroFloatingFurniture();

  // 4. Scroll Reveal va Raqamlar animatsiyasi
  initScrollAnimations();

  // 5. Mobilda pastki yopishqoq narx paneli
  initMobileStickyBar();
});

/**
 * Hero bo'limida suzuvchi SVG mebel konturlari va cursor/scroll parallaksi
 */
function initHeroFloatingFurniture() {
  const heroCanvas = document.getElementById('hero-furniture-canvas');
  if (!heroCanvas) return;

  // Stul, shkaf, stol, lampa SVG konturlari (barcha ekranlarda ko'rinadigan qilib markazlashtirilgan)
  heroCanvas.innerHTML = `
    <g id="hero-floating-elements" style="transition: transform 0.2s cubic-bezier(0.2, 0, 0.4, 1);">
      <!-- 1. Stul (Chair) - Chap yuqori -->
      <g id="float-chair" class="float-item" transform="translate(60, 50)" stroke="#D97706" stroke-width="2" fill="none" opacity="0.45">
        <path d="M10 50 L10 10 Q10 5 15 5 L35 5 Q40 5 40 10 L40 50 Z" />
        <line x1="5" y1="50" x2="45" y2="50" stroke-width="3" />
        <line x1="10" y1="50" x2="8" y2="85" />
        <line x1="40" y1="50" x2="42" y2="85" />
        <line x1="8" y1="68" x2="42" y2="68" />
      </g>

      <!-- 2. Shkaf (Wardrobe) - O'ng yuqori -->
      <g id="float-wardrobe" class="float-item" transform="translate(740, 40)" stroke="#B45309" stroke-width="2" fill="none" opacity="0.40">
        <rect x="0" y="0" width="75" height="115" rx="4" />
        <line x1="37" y1="0" x2="37" y2="115" />
        <circle cx="30" cy="58" r="2.5" fill="#B45309" />
        <circle cx="44" cy="58" r="2.5" fill="#B45309" />
        <line x1="0" y1="100" x2="75" y2="100" />
      </g>

      <!-- 3. Stol (Table) - Chap pastki -->
      <g id="float-table" class="float-item" transform="translate(90, 240)" stroke="#D97706" stroke-width="2" fill="none" opacity="0.42">
        <rect x="0" y="0" width="110" height="15" rx="3" />
        <line x1="15" y1="15" x2="15" y2="70" />
        <line x1="95" y1="15" x2="95" y2="70" />
        <line x1="15" y1="38" x2="95" y2="38" stroke-dasharray="4 3" />
      </g>

      <!-- 4. Lampa (Floor Lamp) - O'ng pastki -->
      <g id="float-lamp" class="float-item" transform="translate(780, 210)" stroke="#F59E0B" stroke-width="2" fill="none" opacity="0.45">
        <path d="M10 35 L40 10 L55 35 Z" />
        <line x1="35" y1="35" x2="35" y2="110" />
        <ellipse cx="35" cy="110" rx="22" ry="5" />
        <line x1="25" y1="45" x2="45" y2="45" stroke-dasharray="2 2" />
      </g>
    </g>
  `;

  const floatingGroup = document.getElementById('hero-floating-elements');
  if (!floatingGroup) return;

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;

  window.addEventListener('mousemove', (e) => {
    const { innerWidth, innerHeight } = window;
    mouseX = (e.clientX - innerWidth / 2) / innerWidth;
    mouseY = (e.clientY - innerHeight / 2) / innerHeight;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  let t = 0;
  function updateFloat() {
    t += 0.015;
    const slowDriftX = Math.sin(t) * 10;
    const slowDriftY = Math.cos(t * 0.8) * 8;

    const px = mouseX * 22 + slowDriftX;
    const py = mouseY * 18 + (scrollY * 0.12) + slowDriftY;

    if (floatingGroup) {
      floatingGroup.setAttribute('transform', `translate(${px}, ${-py})`);
    }

    requestAnimationFrame(updateFloat);
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    requestAnimationFrame(updateFloat);
  }
}

/**
 * Scroll Reveal va Statistikani kuzatish
 */
function initScrollAnimations() {
  const statsSection = document.getElementById('stats-section');
  let statsAnimated = false;

  const triggerStats = () => {
    if (!statsAnimated) {
      statsAnimated = true;
      animateStats();
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-fade-in');
          if (entry.target === statsSection) triggerStats();
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-init').forEach(el => observer.observe(el));
    if (statsSection) observer.observe(statsSection);
  } else {
    triggerStats();
  }

  // 1 soniyadan so'ng statistika baribir sanalishini kafolatlash
  setTimeout(triggerStats, 1200);
}

function animateStats() {
  const stat1 = document.getElementById('stat-time');
  const stat2 = document.getElementById('stat-types');
  const stat3 = document.getElementById('stat-precision');
  const stat4 = document.getElementById('stat-quotes');

  if (stat1) animateNumber(stat1, 0, 1, 600, n => `${Math.round(n)} daqiqa`);
  if (stat2) animateNumber(stat2, 0, 6, 700, n => `${Math.round(n)} xil`);
  if (stat3) animateNumber(stat3, 0, 100, 800, n => `${Math.round(n)}% shaffof`);
  if (stat4) animateNumber(stat4, 0, 15000, 1000, n => `${Math.round(n).toLocaleString()}+`);
}

/**
 * Mobilda Kalkulyator ko'rinishida bo'lganda sticky bar'ni ko'rsatish
 */
function initMobileStickyBar() {
  const calcSection = document.getElementById('kalkulyator');
  const mobileBar = document.getElementById('mobile-sticky-bar');
  if (!calcSection || !mobileBar) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          mobileBar.classList.add('visible');
        } else {
          mobileBar.classList.remove('visible');
        }
      });
    }, { threshold: 0.05 });

    observer.observe(calcSection);
  }
}
