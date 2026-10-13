/**
 * MebelHisob - Foydalanuvchi interfeysi yordamchilari (ui.js)
 * Mavzu, Toast, Akkordeon, Count-Up animatsiyalari
 */

// 1. MAVZU (THEME) BOSHQARUVI
export function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('mebel_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let currentTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(currentTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
      localStorage.setItem('mebel_theme', currentTheme);
      showToast(`Mavzu: ${currentTheme === 'dark' ? 'Qorong\'i' : 'Yorug\''} rejim yoqildi`, 'info');
    });
  }

  // Tizim o'zgarishini tinglash
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('mebel_theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  // Qorong'i bo'lsa Quyosh, Yorug' bo'lsa Oy ikonkasini ko'rsatish
  if (theme === 'dark') {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    toggleBtn.setAttribute('aria-label', 'Yorug\' mavzuga o\'tish');
  } else {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    toggleBtn.setAttribute('aria-label', 'Qorong\'i mavzuga o\'tish');
  }
}

// 2. TOAST XABARLARI
let toastContainer = null;

export function showToast(message, type = 'success', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const iconSvg = type === 'success' 
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
    : type === 'error' 
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  toast.innerHTML = `<span style="display:inline-flex; align-items:center;">${iconSvg}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Animatsiyali paydo bo'lish
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// 3. AKKORDEON
export function initAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      
      // Boshqalarini yopish (optional)
      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('active');
      });

      if (!isOpen) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  });

  // Hisob tafsiloti tugmasi
  const detailBtn = document.getElementById('toggle-breakdown-btn');
  const detailContent = document.getElementById('breakdown-content');
  if (detailBtn && detailContent) {
    detailBtn.addEventListener('click', () => {
      const isOpen = detailContent.classList.contains('open');
      detailContent.classList.toggle('open');
      detailBtn.classList.toggle('active');
      detailBtn.setAttribute('aria-expanded', !isOpen);
    });
  }
}

// 4. RAQAMLAR COUNT-UP / TWEEN
export function animateNumber(element, start, end, duration = 500, formatter = (n) => Math.round(n).toString()) {
  if (!element) return;
  
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    element.textContent = formatter(end);
    return;
  }

  const startTime = performance.now();
  const diff = end - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Smooth easeOutCubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentVal = start + diff * easeOut;

    element.textContent = formatter(currentVal);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatter(end);
    }
  }

  requestAnimationFrame(update);
}

// 5. MOBIL MENYU
export function initMobileMenu() {
  const burgerBtn = document.getElementById('burger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!burgerBtn || !mobileMenu) return;

  burgerBtn.addEventListener('click', () => {
    const isOpen = burgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });

  mobileMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burgerBtn.classList.remove('active');
      mobileMenu.classList.remove('open');
    });
  });
}
