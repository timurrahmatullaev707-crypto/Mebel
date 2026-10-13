/**
 * MebelHisob - Kalkulyator Boshqaruv Moduli (calculator.js)
 * Holat boshqaruvi, kirish sinxronizatsiyasi, narx yangilanishi va harakatlar
 */
import { FURNITURE_LIMITS, calculateQuote, formatSum, clamp } from './calc.js';
import { fetchCatalog, requestServerQuote } from './api.js';
import { showToast, animateNumber } from './ui.js';

export class FurnitureCalculator {
  constructor(visualizer) {
    this.visualizer = visualizer;

    // Boshlang'ich holat (Eman rangli Shkaf-kupe)
    this.state = {
      type: 'shkaf',
      width: 200,
      height: 240,
      depth: 60,
      shelves: 5,
      drawers: 2,
      doors: 2,
      bodyMaterial: 'dsp_standart',
      facadeMaterial: 'pvc_facade',
      edgeType: 'pvc_10',
      hardwareTier: 'standard',
      deliveryZone: 'city',
      installation: true,
      color: 'oak',
      colorHex: '#B88654',
      isWood: true
    };

    this.catalog = null;
    this.currentDisplayedPrice = 0;
  }

  init() {
    // 1. Zudlik bilan sinxron hodisalar va dastlabki hisobni yoqish (kutmasdan!)
    this.bindEvents();
    this.applyTypeLimits(this.state.type, false);
    this.updateCalculation(true);

    // 2. Fonda serverdan yangi katalogni yuklash
    fetchCatalog().then(catalog => {
      this.catalog = catalog;
    }).catch(err => {
      console.warn('Katalog fon rejimida yuklanmadi, lokal parametrlardan foydalaniladi:', err);
    });
  }

  bindEvents() {
    // 1. Mebel turlari tugmalari
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedType = btn.dataset.type;
        if (selectedType === this.state.type) return;

        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.state.type = selectedType;
        this.applyTypeLimits(selectedType, true);
        this.updateCalculation();
      });
    });

    // 2. O'lchamlar (Eni, Bo'yi, Chuqurligi) - Slider va Input sinxronizatsiyasi
    ['width', 'height', 'depth'].forEach(dim => {
      const slider = document.getElementById(`${dim}-slider`);
      const input = document.getElementById(`${dim}-input`);
      const errorEl = document.getElementById(`${dim}-error`);

      if (slider && input) {
        slider.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          input.value = val;
          this.state[dim] = val;
          if (errorEl) errorEl.classList.remove('visible');
          this.updateCalculation();
        });

        input.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          const limits = FURNITURE_LIMITS[this.state.type][dim];
          
          if (val < limits.min || val > limits.max) {
            if (errorEl) {
              errorEl.textContent = `${limits.min} va ${limits.max} sm orasida kiriting`;
              errorEl.classList.add('visible');
            }
          } else {
            if (errorEl) errorEl.classList.remove('visible');
            slider.value = val;
            this.state[dim] = val;
            this.updateCalculation();
          }
        });

        input.addEventListener('blur', (e) => {
          const limits = FURNITURE_LIMITS[this.state.type][dim];
          const clamped = clamp(e.target.value, limits.min, limits.max);
          input.value = clamped;
          slider.value = clamped;
          this.state[dim] = clamped;
          if (errorEl) errorEl.classList.remove('visible');
          this.updateCalculation();
        });
      }
    });

    // 3. [-] son [+] hisoblagichlar (Javonlar, Tortmalar, Eshiklar)
    ['shelves', 'drawers', 'doors'].forEach(item => {
      const minusBtn = document.getElementById(`${item}-minus`);
      const plusBtn = document.getElementById(`${item}-plus`);
      const valEl = document.getElementById(`${item}-val`);

      if (minusBtn && plusBtn && valEl) {
        minusBtn.addEventListener('click', () => {
          const limits = FURNITURE_LIMITS[this.state.type][item];
          if (this.state[item] > limits.min) {
            this.state[item] -= limits.step || 1;
            valEl.textContent = this.state[item];
            this.updateStepperButtons(item);
            this.updateCalculation();
          }
        });

        plusBtn.addEventListener('click', () => {
          const limits = FURNITURE_LIMITS[this.state.type][item];
          if (this.state[item] < limits.max) {
            this.state[item] += limits.step || 1;
            valEl.textContent = this.state[item];
            this.updateStepperButtons(item);
            this.updateCalculation();
          }
        });
      }
    });

    // 4. Material tanlash chipslari
    this.setupChipsGroup('bodyMaterial', 'body-material-chips');
    this.setupChipsGroup('facadeMaterial', 'facade-material-chips');
    this.setupChipsGroup('edgeType', 'edge-chips');
    this.setupChipsGroup('hardwareTier', 'hardware-chips');
    this.setupChipsGroup('deliveryZone', 'delivery-chips');

    // 5. O'rnatish switchi
    const installToggle = document.getElementById('installation-toggle');
    if (installToggle) {
      installToggle.addEventListener('change', (e) => {
        this.state.installation = e.target.checked;
        this.updateCalculation();
      });
    }

    // 6. Rang tanlash namunalari (swatches)
    const swatches = document.querySelectorAll('.swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');

        this.state.color = swatch.dataset.colorId;
        this.state.colorHex = swatch.dataset.colorHex;
        this.state.isWood = swatch.dataset.isWood === 'true';

        this.visualizer.update({
          colorHex: this.state.colorHex,
          isWood: this.state.isWood
        });
      });
    });

    // 7. Narx kartasi tugmalari
    const copyBtn = document.getElementById('btn-copy-quote');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyQuoteToClipboard());
    }

    const shareBtn = document.getElementById('btn-share-tg');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareToTelegram());
    }

    // Mobildagi pastki sticky bar tugmasi
    const mobileOrderBtn = document.getElementById('mobile-order-btn');
    if (mobileOrderBtn) {
      mobileOrderBtn.addEventListener('click', () => {
        const orderSection = document.getElementById('buyurtma');
        if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  setupChipsGroup(stateKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', (e) => {
      const chip = e.target.closest('.option-chip');
      if (!chip) return;

      container.querySelectorAll('.option-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      this.state[stateKey] = chip.dataset.value;
      this.updateCalculation();
    });
  }

  // Mebel turi almashganda boshqaruvlarni moslashtirish
  applyTypeLimits(type, resetToDefaults = false) {
    const limits = FURNITURE_LIMITS[type] || FURNITURE_LIMITS.shkaf;

    // 1. O'lchamlar slider/input min, max va defaultlarini sozlash
    ['width', 'height', 'depth'].forEach(dim => {
      const lim = limits[dim];
      const slider = document.getElementById(`${dim}-slider`);
      const input = document.getElementById(`${dim}-input`);
      const minLabel = document.getElementById(`${dim}-min`);
      const maxLabel = document.getElementById(`${dim}-max`);

      if (slider && input) {
        slider.min = lim.min;
        slider.max = lim.max;
        slider.step = lim.step;
        input.min = lim.min;
        input.max = lim.max;

        if (minLabel) minLabel.textContent = `${lim.min} ${lim.unit}`;
        if (maxLabel) maxLabel.textContent = `${lim.max} ${lim.unit}`;

        if (resetToDefaults || this.state[dim] < lim.min || this.state[dim] > lim.max) {
          this.state[dim] = lim.default;
        }

        slider.value = this.state[dim];
        input.value = this.state[dim];
      }
    });

    // 2. Elementlar (javonlar, tortmalar, eshiklar) bloklarini ko'rsatish/yashirish
    this.toggleControlVisibility('shelves-stepper-box', limits.hasShelves);
    this.toggleControlVisibility('drawers-stepper-box', limits.hasDrawers);
    this.toggleControlVisibility('doors-stepper-box', limits.hasDoors);

    // Default sonlarni yangilash
    ['shelves', 'drawers', 'doors'].forEach(item => {
      const lim = limits[item];
      if (resetToDefaults || this.state[item] < lim.min || this.state[item] > lim.max) {
        this.state[item] = lim.default;
      }
      const valEl = document.getElementById(`${item}-val`);
      if (valEl) valEl.textContent = this.state[item];
      this.updateStepperButtons(item);
    });

    // Vizualizatorni ham xabardor qilish
    this.visualizer.update({
      type: this.state.type,
      width: this.state.width,
      height: this.state.height,
      depth: this.state.depth,
      shelves: this.state.shelves,
      drawers: this.state.drawers,
      doors: this.state.doors,
      colorHex: this.state.colorHex,
      isWood: this.state.isWood
    });
  }

  toggleControlVisibility(elementId, isVisible) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (isVisible) {
      el.style.display = 'flex';
      el.style.opacity = '1';
    } else {
      el.style.display = 'none';
      el.style.opacity = '0';
    }
  }

  updateStepperButtons(item) {
    const limits = FURNITURE_LIMITS[this.state.type][item];
    const minusBtn = document.getElementById(`${item}-minus`);
    const plusBtn = document.getElementById(`${item}-plus`);
    
    if (minusBtn) minusBtn.disabled = this.state[item] <= limits.min;
    if (plusBtn) plusBtn.disabled = this.state[item] >= limits.max;
  }

  // Hisob-kitobni yangilash
  async updateCalculation(instant = false) {
    this.visualizer.update({
      width: this.state.width,
      height: this.state.height,
      depth: this.state.depth,
      shelves: this.state.shelves,
      drawers: this.state.drawers,
      doors: this.state.doors
    });

    const quote = calculateQuote(this.state);
    this.renderPriceAndBreakdown(quote, instant);

    const statusEl = document.getElementById('quote-sync-status');
    requestServerQuote(this.state, (status) => {
      if (!statusEl) return;
      if (status.loading) {
        statusEl.className = 'quote-sync-status loading';
        statusEl.innerHTML = '<span>●</span> Hisoblanmoqda...';
      } else if (status.error) {
        statusEl.className = 'quote-sync-status error';
        statusEl.innerHTML = `<span>●</span> Lokal hisob (oflayn)`;
      } else {
        statusEl.className = 'quote-sync-status';
        statusEl.innerHTML = '<span>●</span> Jonli hisoblandi';
      }
    });
  }

  renderPriceAndBreakdown(quote, instant = false) {
    const priceEl = document.getElementById('big-price-value');
    const mobilePriceEl = document.getElementById('mobile-bar-price-val');
    
    const targetPrice = quote.totalPrice;
    const startPrice = this.currentDisplayedPrice || targetPrice;

    if (instant) {
      if (priceEl) priceEl.textContent = quote.formattedTotal;
      if (mobilePriceEl) mobilePriceEl.textContent = quote.formattedTotal;
      this.currentDisplayedPrice = targetPrice;
    } else {
      animateNumber(priceEl, startPrice, targetPrice, 500, (n) => formatSum(n));
      if (mobilePriceEl) {
        animateNumber(mobilePriceEl, startPrice, targetPrice, 500, (n) => formatSum(n));
      }
      this.currentDisplayedPrice = targetPrice;
    }

    const bd = quote.breakdown;
    this.setBreakdownValue('bd-materials', bd.materials);
    this.setBreakdownValue('bd-edge', bd.edge);
    this.setBreakdownValue('bd-hardware', bd.hardware);
    this.setBreakdownValue('bd-labor', bd.labor);
    this.setBreakdownValue('bd-delivery', bd.delivery);
    this.setBreakdownValue('bd-installation', bd.installation);
    this.setBreakdownValue('bd-total', bd.total);
  }

  setBreakdownValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = formatSum(value);
  }

  copyQuoteToClipboard() {
    const typeName = FURNITURE_LIMITS[this.state.type].name;
    const text = `📋 MebelHisob Hisobi:\n` +
      `Mebel: ${typeName}\n` +
      `O'lchamlari: ${this.state.width} x ${this.state.height} x ${this.state.depth} sm\n` +
      `Jami taxminiy narx: ${formatSum(this.currentDisplayedPrice)}\n` +
      `Kafolat: 7 kun amal qiladi\n` +
      `Sayt: ${window.location.href}`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Hisob xulosasi nusxalandi!', 'success');
    }).catch(() => {
      showToast('Nusxalab bo\'lmadi, qo\'lda nusxa oling', 'error');
    });
  }

  shareToTelegram() {
    const typeName = FURNITURE_LIMITS[this.state.type].name;
    const text = encodeURIComponent(
      `MebelHisob da ${typeName} narxini hisobladim:\n` +
      `O'lchami: ${this.state.width}x${this.state.height}x${this.state.depth} sm\n` +
      `Jami narx: ${formatSum(this.currentDisplayedPrice)}`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }
}
