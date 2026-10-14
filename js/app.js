/**
 * MebelPro - Universal Mijoz Skripti (app.js)
 * Tashqi modul cheklovlarisiz to'liq universal ishlaydi (file:/// va http:// uchun mos)
 */

(function () {
  'use strict';

  // 1. MEBEL CHEGARALARI VA LIMITLARI
  const FURNITURE_LIMITS = {
    shkaf: {
      name: 'Shkaf-kupe',
      width: { min: 100, max: 400, default: 200, step: 5, unit: 'sm' },
      height: { min: 180, max: 280, default: 240, step: 5, unit: 'sm' },
      depth: { min: 40, max: 80, default: 60, step: 5, unit: 'sm' },
      shelves: { min: 2, max: 12, default: 5, step: 1 },
      drawers: { min: 0, max: 8, default: 2, step: 1 },
      doors: { min: 2, max: 5, default: 2, step: 1 },
      hasDoors: true,
      hasDrawers: true,
      hasShelves: true
    },
    oshxona: {
      name: 'Oshxona garnituri',
      width: { min: 120, max: 500, default: 260, step: 10, unit: 'sm' },
      height: { min: 200, max: 270, default: 230, step: 5, unit: 'sm' },
      depth: { min: 50, max: 70, default: 60, step: 5, unit: 'sm' },
      shelves: { min: 2, max: 10, default: 4, step: 1 },
      drawers: { min: 2, max: 8, default: 4, step: 1 },
      doors: { min: 2, max: 10, default: 6, step: 1 },
      hasDoors: true,
      hasDrawers: true,
      hasShelves: true
    },
    tumba: {
      name: 'Tumba va Komod',
      width: { min: 40, max: 120, default: 60, step: 5, unit: 'sm' },
      height: { min: 40, max: 100, default: 55, step: 5, unit: 'sm' },
      depth: { min: 35, max: 60, default: 45, step: 5, unit: 'sm' },
      shelves: { min: 0, max: 3, default: 1, step: 1 },
      drawers: { min: 1, max: 4, default: 2, step: 1 },
      doors: { min: 0, max: 2, default: 0, step: 1 },
      hasDoors: true,
      hasDrawers: true,
      hasShelves: true
    },
    stol: {
      name: 'Zamonaviy Stol',
      width: { min: 80, max: 240, default: 140, step: 5, unit: 'sm' },
      height: { min: 65, max: 90, default: 75, step: 5, unit: 'sm' },
      depth: { min: 50, max: 110, default: 70, step: 5, unit: 'sm' },
      shelves: { min: 0, max: 0, default: 0, step: 0 },
      drawers: { min: 0, max: 3, default: 1, step: 1 },
      doors: { min: 0, max: 0, default: 0, step: 0 },
      hasDoors: false,
      hasDrawers: true,
      hasShelves: false
    },
    krovat: {
      name: 'Krovat va Yotoqxona',
      width: { min: 90, max: 220, default: 160, step: 10, unit: 'sm' },
      height: { min: 70, max: 140, default: 100, step: 5, unit: 'sm' },
      depth: { min: 190, max: 220, default: 200, step: 5, unit: 'sm' },
      shelves: { min: 0, max: 0, default: 0, step: 0 },
      drawers: { min: 0, max: 4, default: 2, step: 1 },
      doors: { min: 0, max: 0, default: 0, step: 0 },
      hasDoors: false,
      hasDrawers: true,
      hasShelves: false
    },
    ofis: {
      name: 'Ofis mebeli',
      width: { min: 120, max: 260, default: 160, step: 5, unit: 'sm' },
      height: { min: 70, max: 200, default: 75, step: 5, unit: 'sm' },
      depth: { min: 60, max: 120, default: 80, step: 5, unit: 'sm' },
      shelves: { min: 0, max: 6, default: 2, step: 1 },
      drawers: { min: 2, max: 6, default: 3, step: 1 },
      doors: { min: 0, max: 4, default: 2, step: 1 },
      hasDoors: true,
      hasDrawers: true,
      hasShelves: true
    }
  };

  // NARXLAR VA KOEFFITSIYENTLAR
  const DEFAULT_PRICES = {
    body: {
      dsp_standart: { name: 'DSP Standart (Laminat)', pricePerM2: 120000, badge: 'Standart' },
      mdf_standart: { name: 'MDF Oddiy', pricePerM2: 175000, badge: 'Sifatli' },
      lmdf_premium: { name: 'LMDF Premium', pricePerM2: 230000, badge: 'Premium' },
      akril_korpus: { name: 'MDF Akril', pricePerM2: 290000, badge: 'Lyuks' }
    },
    facade: {
      dsp_facade: { name: 'DSP Fasad', pricePerM2: 140000, badge: 'Oddiy' },
      pvc_facade: { name: 'MDF PVX plyonka', pricePerM2: 240000, badge: 'Ommabop' },
      emal_facade: { name: 'MDF Bo\'yoq (Emal)', pricePerM2: 360000, badge: 'Yuqori sifat' },
      akril_facade: { name: 'Akril High-Gloss', pricePerM2: 440000, badge: 'Lyuks' }
    },
    edge: {
      pvc_04: { name: 'PVX 0.4 mm', pricePerM: 4000, badge: 'Standart' },
      pvc_10: { name: 'PVX 1.0 mm', pricePerM: 7000, badge: 'Mustahkam' },
      pvc_20: { name: 'PVX 2.0 mm', pricePerM: 11000, badge: 'Zarbaga chidamli' }
    },
    hardware: {
      standard: { name: 'Standart furnitura', multiplier: 1.0, drawerCost: 65000, doorCost: 35000, badge: 'Standart' },
      premium: { name: 'Premium (Dovodchikli Blum)', multiplier: 1.85, drawerCost: 155000, doorCost: 75000, badge: 'Blum / GTV' }
    },
    delivery: {
      city: { name: 'Toshkent shahar ichida', cost: 150000 },
      suburb: { name: 'Toshkent viloyati', cost: 280000 },
      region: { name: 'Boshqa viloyatlarga', cost: 450000 }
    },
    installationRate: 0.10
  };

  function clamp(val, min, max) {
    const n = Number(val);
    if (isNaN(n)) return min;
    return Math.min(Math.max(n, min), max);
  }

  function formatSum(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0 so\'m';
    const parts = Math.round(num).toString().split('');
    let formatted = '';
    for (let i = 0; i < parts.length; i++) {
      const revIndex = parts.length - 1 - i;
      formatted = parts[revIndex] + formatted;
      if (i % 3 === 2 && revIndex > 0) {
        formatted = ' ' + formatted;
      }
    }
    return `${formatted} so'm`;
  }

  function calculateQuote(params, customPrices = DEFAULT_PRICES) {
    const type = params.type || 'shkaf';
    const limits = FURNITURE_LIMITS[type] || FURNITURE_LIMITS.shkaf;

    const width = clamp(params.width, limits.width.min, limits.width.max);
    const height = clamp(params.height, limits.height.min, limits.height.max);
    const depth = clamp(params.depth, limits.depth.min, limits.depth.max);

    const shelves = limits.hasShelves ? clamp(params.shelves, limits.shelves.min, limits.shelves.max) : 0;
    const drawers = limits.hasDrawers ? clamp(params.drawers, limits.drawers.min, limits.drawers.max) : 0;
    const doors = limits.hasDoors ? clamp(params.doors, limits.doors.min, limits.doors.max) : 0;

    const bodyKey = params.bodyMaterial || 'dsp_standart';
    const facadeKey = params.facadeMaterial || 'pvc_facade';
    const edgeKey = params.edgeType || 'pvc_10';
    const hwKey = params.hardwareTier || 'standard';
    const delivKey = params.deliveryZone || 'city';
    const needInstall = Boolean(params.installation);

    const bodyMat = customPrices.body[bodyKey] || customPrices.body.dsp_standart;
    const facadeMat = customPrices.facade[facadeKey] || customPrices.facade.pvc_facade;
    const edgeMat = customPrices.edge[edgeKey] || customPrices.edge.pvc_10;
    const hwTier = customPrices.hardware[hwKey] || customPrices.hardware.standard;
    const delivZone = customPrices.delivery[delivKey] || customPrices.delivery.city;

    const wM = width / 100;
    const hM = height / 100;
    const dM = depth / 100;

    let bodyArea = 0;
    let facadeArea = 0;
    let edgeLinearMeters = 0;
    let baseHardware = 50000;

    switch (type) {
      case 'shkaf':
        bodyArea = (2 * hM * dM) + (2 * wM * dM) + (wM * hM * 0.9) + (shelves * (wM / (doors || 2)) * dM);
        facadeArea = wM * hM;
        edgeLinearMeters = (hM * 4 + wM * 4 + shelves * 2);
        baseHardware = 120000;
        break;
      case 'oshxona':
        const lowerBody = (2 * 0.85 * dM) + (wM * dM * 2) + (shelves * 0.5 * wM * dM);
        const upperBody = (2 * 0.75 * (dM * 0.6)) + (wM * (dM * 0.6) * 2);
        bodyArea = lowerBody + upperBody;
        facadeArea = wM * 1.6;
        edgeLinearMeters = wM * 6 + 10;
        baseHardware = 150000;
        break;
      case 'tumba':
        bodyArea = (2 * hM * dM) + (2 * wM * dM) + (wM * hM * 0.7) + (shelves * wM * dM);
        facadeArea = wM * hM * 0.85;
        edgeLinearMeters = (hM + wM + dM) * 3;
        baseHardware = 40000;
        break;
      case 'stol':
        bodyArea = (wM * dM * 1.5) + (2 * hM * dM * 0.8) + (wM * 0.3);
        facadeArea = drawers > 0 ? (drawers * 0.15 * wM * 0.4) : 0;
        edgeLinearMeters = (wM + dM) * 3 + hM * 2;
        baseHardware = 60000;
        break;
      case 'krovat':
        bodyArea = (wM * hM) + (2 * 2.0 * 0.35) + (wM * 0.35) + (wM * 1.9 * 0.7);
        facadeArea = (wM * hM * 0.6);
        edgeLinearMeters = (wM + 2.0) * 4;
        baseHardware = 110000;
        break;
      case 'ofis':
        bodyArea = (wM * dM * 1.3) + (hM * dM * 1.5) + (shelves * 0.8 * dM);
        facadeArea = (doors * 0.6 * 0.4) + (drawers * 0.2 * 0.4);
        edgeLinearMeters = (wM + hM + dM) * 3.5;
        baseHardware = 90000;
        break;
      default:
        bodyArea = 3.0;
        facadeArea = 1.5;
        edgeLinearMeters = 15;
    }

    const bodyCost = Math.round(bodyArea * bodyMat.pricePerM2);
    const facadeCost = Math.round(facadeArea * facadeMat.pricePerM2);
    const materialsSubtotal = bodyCost + facadeCost;
    const edgeCost = Math.round(edgeLinearMeters * edgeMat.pricePerM);
    const drawerHwCost = drawers * hwTier.drawerCost;
    const doorHwCost = doors * hwTier.doorCost;
    const hardwareTotal = Math.round((baseHardware + drawerHwCost + doorHwCost) * hwTier.multiplier);
    const laborCost = Math.round((materialsSubtotal + edgeCost + hardwareTotal) * 0.28);
    const furnitureTotal = materialsSubtotal + edgeCost + hardwareTotal + laborCost;
    const deliveryCost = delivZone.cost || 0;
    const installationCost = needInstall ? Math.round(furnitureTotal * (customPrices.installationRate || 0.10)) : 0;
    const totalPrice = Math.round(furnitureTotal + deliveryCost + installationCost);
    const roundedTotal = Math.ceil(totalPrice / 1000) * 1000;

    return {
      valid: true,
      type,
      dimensions: { width, height, depth },
      counts: { shelves, drawers, doors },
      totalPrice: roundedTotal,
      formattedTotal: formatSum(roundedTotal),
      validDays: 7,
      breakdown: {
        materials: materialsSubtotal,
        edge: edgeCost,
        hardware: hardwareTotal,
        labor: laborCost,
        delivery: deliveryCost,
        installation: installationCost,
        total: roundedTotal
      }
    };
  }

  // TOAST XABARLARI
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    const iconSvg = type === 'success' 
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
      : type === 'error' 
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    toast.innerHTML = `<span style="display:inline-flex; align-items:center;">${iconSvg}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // COUNT-UP ANIMATSIYA
  function animateNumber(element, start, end, duration = 450, formatter = (n) => Math.round(n).toString()) {
    if (!element) return;
    const startTime = performance.now();
    const diff = end - start;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatter(start + diff * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = formatter(end);
      }
    }
    requestAnimationFrame(step);
  }

  // JONLI VIZUALIZATSIYA (Pure SVG)
  class Visualizer {
    constructor(svg) {
      this.svg = svg;
      this.current = {
        type: 'shkaf',
        width: 200,
        height: 240,
        depth: 60,
        shelves: 5,
        drawers: 2,
        doors: 2,
        colorHex: '#B88654',
        isWood: true
      };
      this.target = { ...this.current };
      this.isAnimating = false;
      this.interactiveOffset = 0;
      this.initPatterns();
      this.setupHover();
      this.render();
    }

    initPatterns() {
      this.svg.innerHTML = `
        <defs>
          <!-- O'lchov chizig'i strelkasi -->
          <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706" />
          </marker>
          <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706" />
          </marker>

          <!-- Hajmli gradientlar va yorug'liklar -->
          <linearGradient id="body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.22" />
          </linearGradient>

          <linearGradient id="bevel-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
            <stop offset="50%" stop-color="#ffffff" stop-opacity="0.05" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
          </linearGradient>

          <!-- Yog'och fakturasi -->
          <pattern id="wood-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
            <line x1="0" y1="16" x2="80" y2="16" stroke="rgba(0,0,0,0.12)" stroke-width="1.2" stroke-dasharray="14 6" />
            <line x1="0" y1="38" x2="80" y2="38" stroke="rgba(255,255,255,0.14)" stroke-width="1.0" />
            <line x1="0" y1="58" x2="80" y2="58" stroke="rgba(0,0,0,0.10)" stroke-width="1.5" stroke-dasharray="20 10" />
          </pattern>

          <!-- Qora metall Loft profili -->
          <linearGradient id="loft-metal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1f2937" />
            <stop offset="40%" stop-color="#374151" />
            <stop offset="70%" stop-color="#1f2937" />
            <stop offset="100%" stop-color="#111827" />
          </linearGradient>

          <!-- Xrom va Oltin metall tutqichlar -->
          <linearGradient id="metal-handle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d1d5db" />
            <stop offset="50%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#9ca3af" />
          </linearGradient>

          <linearGradient id="gold-accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d97706" />
            <stop offset="50%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>

          <!-- Polga tushgan soya (Floor ambient shadow) -->
          <radialGradient id="floor-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.32" />
            <stop offset="70%" stop-color="#000000" stop-opacity="0.10" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <g id="draw-group"></g>
        <g id="dim-group"></g>
      `;
      this.drawGroup = this.svg.querySelector('#draw-group');
      this.dimGroup = this.svg.querySelector('#dim-group');
    }

    setupHover() {
      this.svg.addEventListener('mouseenter', () => this.setInteractive(1));
      this.svg.addEventListener('mouseleave', () => this.setInteractive(0));
    }

    setInteractive(val) {
      this.interactiveOffset = val;
      this.render();
    }

    update(params) {
      if (params.type && params.type !== this.current.type) {
        this.svg.style.opacity = '0.4';
        setTimeout(() => {
          this.current.type = params.type;
          this.target = { ...this.current, ...params };
          this.svg.style.opacity = '1';
          this.startTween();
        }, 90);
        return;
      }
      this.target = { ...this.target, ...params };
      this.startTween();
    }

    startTween() {
      if (this.isAnimating) return;
      this.isAnimating = true;

      const loop = () => {
        let more = false;
        ['width', 'height', 'depth', 'shelves', 'drawers', 'doors'].forEach(p => {
          const d = this.target[p] - this.current[p];
          if (Math.abs(d) > 0.08) {
            this.current[p] += d * 0.28;
            more = true;
          } else {
            this.current[p] = this.target[p];
          }
        });
        this.current.colorHex = this.target.colorHex || this.current.colorHex;
        this.current.isWood = this.target.isWood !== undefined ? this.target.isWood : this.current.isWood;

        this.render();
        if (more) {
          requestAnimationFrame(loop);
        } else {
          this.isAnimating = false;
        }
      };
      requestAnimationFrame(loop);
    }

    render() {
      if (!this.drawGroup || !this.dimGroup) return;
      const { type, width, height, shelves, drawers, doors, colorHex, isWood } = this.current;
      const padX = 85, padY = 75;
      const maxW = 600 - padX * 2, maxH = 450 - padY * 2;
      const scale = Math.min(maxW / width, maxH / height);
      const drawW = width * scale, drawH = height * scale;
      const originX = (600 - drawW) / 2;
      const originY = 50 + (maxH - drawH) / 2;

      let html = '';

      // 1. ZAMONAVIY SHKAF-KUPE
      if (type === 'shkaf') {
        const dCount = Math.max(Math.round(doors), 2);
        const drawCount = Math.max(Math.round(drawers), 0);
        const plinthH = 16;
        const doorsH = drawH - plinthH;
        const doorsW = drawW / dCount;

        // Fasadlar (Kupe eshiklari)
        let dHtml = '';
        for (let i = 0; i < dCount; i++) {
          const dx = originX + i * doorsW;
          const isLeft = i % 2 === 0;
          dHtml += `
            <g class="wardrobe-door">
              <!-- Eshik paneli -->
              <rect x="${dx + 2}" y="${originY + 4}" width="${doorsW - 4}" height="${doorsH - 6}" rx="3" fill="${colorHex}" stroke="#181512" stroke-width="1.8" />
              ${isWood ? `<rect x="${dx + 2}" y="${originY + 4}" width="${doorsW - 4}" height="${doorsH - 6}" rx="3" fill="url(#wood-pattern)" />` : ''}
              <rect x="${dx + 2}" y="${originY + 4}" width="${doorsW - 4}" height="${doorsH - 6}" rx="3" fill="url(#body-grad)" />

              <!-- Zamonaviy gorizontal dekorativ chiziqlar (bo'linmalar) -->
              <line x1="${dx + 6}" y1="${originY + doorsH * 0.33}" x2="${dx + doorsW - 6}" y2="${originY + doorsH * 0.33}" stroke="rgba(0,0,0,0.22)" stroke-width="1.8" />
              <line x1="${dx + 6}" y1="${originY + doorsH * 0.66}" x2="${dx + doorsW - 6}" y2="${originY + doorsH * 0.66}" stroke="rgba(0,0,0,0.22)" stroke-width="1.8" />

              <!-- Alyuminiy vertikal tutqich-profil (Aristo / Modus) -->
              <rect x="${isLeft ? dx + doorsW - 8 : dx + 4}" y="${originY + 8}" width="4.5" height="${doorsH - 14}" rx="2" fill="url(#metal-handle)" stroke="#1f2937" stroke-width="0.8" />
            </g>
          `;
        }

        html = `
          <!-- Pol soyasi -->
          <ellipse cx="${originX + drawW / 2}" cy="${originY + drawH + 4}" rx="${drawW * 0.48}" ry="6" fill="url(#floor-shadow)" />

          <!-- Tashqi korpus -->
          <rect x="${originX}" y="${originY}" width="${drawW}" height="${drawH}" rx="5" fill="#241e1a" stroke="#111827" stroke-width="2.5" />
          <rect x="${originX + 2}" y="${originY + 2}" width="${drawW - 4}" height="${drawH - 4}" fill="${colorHex}" fill-opacity="0.9" />

          <!-- Yuqori va pastki alyuminiy relslar -->
          <rect x="${originX + 2}" y="${originY + 2}" width="${drawW - 4}" height="6" fill="url(#loft-metal)" />
          <rect x="${originX + 2}" y="${originY + doorsH - 3}" width="${drawW - 4}" height="6" fill="url(#loft-metal)" />

          <!-- Kupe eshiklari -->
          ${dHtml}

          <!-- Pastki sokol (Plintus) -->
          <rect x="${originX + 6}" y="${originY + drawH - plinthH}" width="${drawW - 12}" height="${plinthH}" fill="#181512" />
        `;

      // 2. ZAMONAVIY OSHXONA GARNITURI
      } else if (type === 'oshxona') {
        const upH = drawH * 0.35;
        const aprH = drawH * 0.23;
        const lowH = drawH * 0.42;
        const lowY = originY + upH + aprH;
        const doorCount = Math.max(Math.round(doors), 2);
        const drawCount = Math.max(Math.round(drawers), 0);

        // Yuqori shkaflar
        const topCount = Math.max(Math.ceil(doorCount / 2), 2);
        const uW = drawW / topCount;
        let upHtml = '';
        for (let u = 0; u < topCount; u++) {
          const ux = originX + u * uW;
          upHtml += `
            <g>
              <rect x="${ux + 1.5}" y="${originY + 2}" width="${uW - 3}" height="${upH - 4}" rx="2" fill="${colorHex}" stroke="#1f2937" stroke-width="1.8" />
              ${isWood ? `<rect x="${ux + 1.5}" y="${originY + 2}" width="${uW - 3}" height="${upH - 4}" rx="2" fill="url(#wood-pattern)" />` : ''}
              <rect x="${ux + 1.5}" y="${originY + 2}" width="${uW - 3}" height="${upH - 4}" rx="2" fill="url(#body-grad)" />
              <!-- Tutqichsiz fasad pastki chizig'i (Gola profili) -->
              <rect x="${ux + 3}" y="${originY + upH - 5}" width="${uW - 6}" height="2.5" fill="#111827" />
            </g>
          `;
        }

        // Pastki qavat (Tortmalar va eshiklar)
        const lowDoorCount = Math.max(doorCount - topCount, 1);
        const hasDrawers = drawCount > 0;
        const totalBottomMods = lowDoorCount + (hasDrawers ? 1 : 0);
        const modW = drawW / totalBottomMods;
        let lowHtml = '';

        if (hasDrawers) {
          const dH = (lowH - 16) / drawCount;
          for (let d = 0; d < drawCount; d++) {
            const dy = lowY + 12 + d * dH;
            lowHtml += `
              <g>
                <rect x="${originX + 2}" y="${dy + 1.5}" width="${modW - 4}" height="${dH - 3}" rx="2" fill="${colorHex}" stroke="#1f2937" stroke-width="1.8" />
                ${isWood ? `<rect x="${originX + 2}" y="${dy + 1.5}" width="${modW - 4}" height="${dH - 3}" rx="2" fill="url(#wood-pattern)" />` : ''}
                <rect x="${originX + 2}" y="${dy + 1.5}" width="${modW - 4}" height="${dH - 3}" rx="2" fill="url(#body-grad)" />
                <!-- Zamonaviy qora profil tutqich -->
                <rect x="${originX + modW * 0.25}" y="${dy + 3.5}" width="${modW * 0.5}" height="2.8" rx="1" fill="#111827" />
              </g>
            `;
          }
        }

        const startIdx = hasDrawers ? 1 : 0;
        for (let ld = 0; ld < lowDoorCount; ld++) {
          const ldx = originX + (startIdx + ld) * modW;
          lowHtml += `
            <g>
              <rect x="${ldx + 1.5}" y="${lowY + 12}" width="${modW - 3}" height="${lowH - 16}" rx="2" fill="${colorHex}" stroke="#1f2937" stroke-width="1.8" />
              ${isWood ? `<rect x="${ldx + 1.5}" y="${lowY + 12}" width="${modW - 3}" height="${lowH - 16}" rx="2" fill="url(#wood-pattern)" />` : ''}
              <rect x="${ldx + 1.5}" y="${lowY + 12}" width="${modW - 3}" height="${lowH - 16}" rx="2" fill="url(#body-grad)" />
              <!-- Vertikal tutqich -->
              <rect x="${ld % 2 === 0 ? ldx + modW - 10 : ldx + 6}" y="${lowY + 22}" width="3.5" height="24" rx="1" fill="#111827" />
            </g>
          `;
        }

        html = `
          <!-- Pol soyasi -->
          <ellipse cx="${originX + drawW / 2}" cy="${originY + drawH + 4}" rx="${drawW * 0.48}" ry="6" fill="url(#floor-shadow)" />

          <!-- Oshxona fartuki (Marmar / Plitka) -->
          <rect x="${originX}" y="${originY + upH}" width="${drawW}" height="${aprH}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1.5" />
          <line x1="${originX}" y1="${originY + upH + aprH / 2}" x2="${originX + drawW}" y2="${originY + upH + aprH / 2}" stroke="#e5e7eb" stroke-dasharray="8 6" />

          <!-- Yuqori qator shkaflar -->
          <g>${upHtml}</g>

          <!-- Qalin tosh/yog'och stoleshnitsa (38mm) -->
          <rect x="${originX - 3}" y="${lowY}" width="${drawW + 6}" height="12" rx="2" fill="#1f2937" stroke="#111827" stroke-width="1.5" />
          <rect x="${originX - 3}" y="${lowY}" width="${drawW + 6}" height="3" fill="rgba(255,255,255,0.2)" />

          <!-- Pastki qator -->
          <g>${lowHtml}</g>

          <!-- Pastki sokol (Plintus) -->
          <rect x="${originX + 4}" y="${originY + drawH - 5}" width="${drawW - 8}" height="5" fill="#111827" />
        `;

      // 3. ZAMONAVIY TUMBA VA KOMOD (Skandinav / Modern)
      } else if (type === 'tumba') {
        const legH = 22;
        const bodyH = drawH - legH;
        const drawCount = Math.max(Math.round(drawers), 0);
        const actualDraws = Math.max(drawCount, 2);
        const dH = bodyH / actualDraws;

        let drawerHtml = '';
        for (let i = 0; i < actualDraws; i++) {
          const dy = originY + i * dH;
          drawerHtml += `
            <g>
              <!-- Tortma fasadi -->
              <rect x="${originX + 4}" y="${dy + 2}" width="${drawW - 8}" height="${dH - 4}" rx="3" fill="${colorHex}" stroke="#1f2937" stroke-width="1.8" />
              ${isWood ? `<rect x="${originX + 4}" y="${dy + 2}" width="${drawW - 8}" height="${dH - 4}" rx="3" fill="url(#wood-pattern)" />` : ''}
              <rect x="${originX + 4}" y="${dy + 2}" width="${drawW - 8}" height="${dH - 4}" rx="3" fill="url(#body-grad)" />

              <!-- Zamonaviy minimalistik yupqa profil tutqich (Edge pull) -->
              <rect x="${originX + drawW * 0.35}" y="${dy + 4}" width="${drawW * 0.3}" height="3" rx="1.5" fill="#111827" stroke="#374151" stroke-width="0.5" />
            </g>
          `;
        }

        html = `
          <!-- Pol soyasi -->
          <ellipse cx="${originX + drawW / 2}" cy="${originY + drawH + 2}" rx="${drawW * 0.44}" ry="6" fill="url(#floor-shadow)" />

          <!-- Skandinav qiya konus metall oyoqlar (Old va orqa) -->
          <line x1="${originX + 22}" y1="${originY + bodyH}" x2="${originX + 10}" y2="${originY + drawH}" stroke="#111827" stroke-width="7" stroke-linecap="round" />
          <line x1="${originX + drawW - 22}" y1="${originY + bodyH}" x2="${originX + drawW - 10}" y2="${originY + drawH}" stroke="#111827" stroke-width="7" stroke-linecap="round" />
          <!-- Oltin/Xrom podpyatniklar -->
          <ellipse cx="${originX + 10}" cy="${originY + drawH}" rx="5" ry="2" fill="url(#gold-accent)" />
          <ellipse cx="${originX + drawW - 10}" cy="${originY + drawH}" rx="5" ry="2" fill="url(#gold-accent)" />

          <!-- Tumba asosiy monolit korpusi (45° faska) -->
          <rect x="${originX}" y="${originY}" width="${drawW}" height="${bodyH}" rx="5" fill="#1f2937" stroke="#111827" stroke-width="2.5" />

          <!-- Tortmalar -->
          ${drawerHtml}
        `;

      // 4. ZAMONAVIY STOL (Modern Loft & Scandinavian Desk)
      } else if (type === 'stol') {
        const topH = 18;
        const legW = 16;
        const apronH = 24;
        const drawCount = Math.max(Math.round(drawers), 0);

        let drawersSection = '';
        if (drawCount === 1) {
          // Stoleshnitsa tagiga o'rnatilgan zamonaviy yashirin tortma
          const tW = drawW * 0.46;
          drawersSection = `
            <g>
              <rect x="${originX + (drawW - tW) / 2}" y="${originY + topH + 2}" width="${tW}" height="${apronH - 4}" rx="2" fill="${colorHex}" stroke="#111827" stroke-width="1.8" />
              ${isWood ? `<rect x="${originX + (drawW - tW) / 2}" y="${originY + topH + 2}" width="${tW}" height="${apronH - 4}" fill="url(#wood-pattern)" />` : ''}
              <rect x="${originX + (drawW - tW) / 2}" y="${originY + topH + 2}" width="${tW}" height="${apronH - 4}" fill="url(#body-grad)" />
              <!-- Yupqa qora tutqich -->
              <rect x="${originX + drawW / 2 - 24}" y="${originY + topH + apronH / 2 - 1.5}" width="48" height="3" rx="1.5" fill="#111827" />
            </g>
          `;
        } else if (drawCount >= 2) {
          // O'ng tomondagi tumba bloki
          const cabW = drawW * 0.32;
          const cabH = (drawH - topH - 18);
          const cabX = originX + drawW - cabW - 18;
          const dH = cabH / drawCount;

          let cHtml = '';
          for (let d = 0; d < drawCount; d++) {
            const dy = originY + topH + 3 + d * dH;
            cHtml += `
              <rect x="${cabX + 2}" y="${dy}" width="${cabW - 4}" height="${dH - 3}" rx="2" fill="${colorHex}" stroke="#111827" stroke-width="1.8" />
              ${isWood ? `<rect x="${cabX + 2}" y="${dy}" width="${cabW - 4}" height="${dH - 3}" fill="url(#wood-pattern)" />` : ''}
              <rect x="${cabX + cabW * 0.25}" y="${dy + dH * 0.4}" width="${cabW * 0.5}" height="2.8" rx="1" fill="#111827" />
            `;
          }

          drawersSection = `
            <rect x="${cabX}" y="${originY + topH}" width="${cabW}" height="${cabH}" rx="3" fill="#1f2937" stroke="#111827" stroke-width="2" />
            ${cHtml}
            <!-- Tumba oyoqlari -->
            <rect x="${cabX + 6}" y="${originY + topH + cabH}" width="8" height="12" fill="#111827" />
            <rect x="${cabX + cabW - 14}" y="${originY + topH + cabH}" width="8" height="12" fill="#111827" />
          `;
        }

        html = `
          <!-- Pol soyasi -->
          <ellipse cx="${originX + drawW / 2}" cy="${originY + drawH + 3}" rx="${drawW * 0.46}" ry="6" fill="url(#floor-shadow)" />

          <!-- Mustahkam orqa tsarga (bog'lovchi panel) -->
          <rect x="${originX + 24}" y="${originY + topH}" width="${drawW - 48}" height="${apronH}" fill="#181512" stroke="#111827" stroke-width="1.5" />
          <rect x="${originX + 24}" y="${originY + topH}" width="${drawW - 48}" height="${apronH}" fill="${colorHex}" fill-opacity="0.85" />

          <!-- Tortmalar qismi -->
          ${drawersSection}

          <!-- Zamonaviy Loft A-Frame metall oyoqlar -->
          <!-- Chap oyoq (Qiya burchakli loft profil) -->
          <polygon points="${originX + 16},${originY + topH} ${originX + 30},${originY + topH} ${originX + 18},${originY + drawH} ${originX + 6},${originY + drawH}" fill="url(#loft-metal)" stroke="#111827" stroke-width="1.5" />
          <ellipse cx="${originX + 12}" cy="${originY + drawH}" rx="8" ry="2.5" fill="url(#metal-handle)" />

          <!-- O'ng oyoq (agar o'ngda tumba bo'lmasa yoki tumba yonida) -->
          ${drawCount < 2 ? `
            <polygon points="${originX + drawW - 30},${originY + topH} ${originX + drawW - 16},${originY + topH} ${originX + drawW - 6},${originY + drawH} ${originX + drawW - 18},${originY + drawH}" fill="url(#loft-metal)" stroke="#111827" stroke-width="1.5" />
            <ellipse cx="${originX + drawW - 12}" cy="${originY + drawH}" rx="8" ry="2.5" fill="url(#metal-handle)" />
          ` : ''}

          <!-- Qalin zamonaviy stoleshnitsa (38mm) -->
          <rect x="${originX}" y="${originY}" width="${drawW}" height="${topH}" rx="4" fill="${colorHex}" stroke="#181512" stroke-width="2.2" />
          ${isWood ? `<rect x="${originX}" y="${originY}" width="${drawW}" height="${topH}" rx="4" fill="url(#wood-pattern)" />` : ''}
          <rect x="${originX}" y="${originY}" width="${drawW}" height="${topH}" rx="4" fill="url(#body-grad)" />
          <!-- Stoleshnitsa ustki yorug'lik qaytishi -->
          <line x1="${originX + 4}" y1="${originY + 2}" x2="${originX + drawW - 4}" y2="${originY + 2}" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />
          <!-- Pastki soya faskasi -->
          <rect x="${originX + 2}" y="${originY + topH - 2.5}" width="${drawW - 4}" height="2.5" fill="rgba(0,0,0,0.35)" />
        `;

      // 5. ZAMONAVIY KROVAT (Luxury Modern Bed)
      } else if (type === 'krovat') {
        const frameH = 28;
        const legH = 14;
        const matH = 30;
        const frameY = originY + drawH - legH - frameH;
        const matY = frameY - matH + 8; // matras karkas ichiga 8px kirib turadi
        const headH = (frameY - originY) + 12; // Suyanchiq karkasgacha to'liq tutashadi!
        const drawCount = Math.max(Math.round(drawers), 0);

        // Karkas ichidagi tortmalar
        let bedDrawersHtml = '';
        if (drawCount > 0) {
          const bdW = (drawW - 28) / drawCount;
          for (let b = 0; b < drawCount; b++) {
            const bx = originX + 14 + b * bdW;
            bedDrawersHtml += `
              <g>
                <rect x="${bx + 2}" y="${frameY + 4}" width="${bdW - 4}" height="${frameH - 8}" rx="2" fill="${colorHex}" stroke="#111827" stroke-width="1.5" />
                ${isWood ? `<rect x="${bx + 2}" y="${frameY + 4}" width="${bdW - 4}" height="${frameH - 8}" fill="url(#wood-pattern)" />` : ''}
                <rect x="${bx + bdW * 0.35}" y="${frameY + frameH * 0.45}" width="${bdW * 0.3}" height="2.8" rx="1" fill="#111827" />
              </g>
            `;
          }
        }

        html = `
          <!-- Pol soyasi -->
          <ellipse cx="${originX + drawW / 2}" cy="${originY + drawH + 2}" rx="${drawW * 0.47}" ry="6" fill="url(#floor-shadow)" />

          <!-- Bosh suyanchi (Izgolovye) - Karkasgacha tutashgan, havoda osilmaydi! -->
          <rect x="${originX + 6}" y="${originY}" width="${drawW - 12}" height="${headH}" rx="8" fill="${colorHex}" stroke="#111827" stroke-width="2.5" />
          ${isWood ? `<rect x="${originX + 6}" y="${originY}" width="${drawW - 12}" height="${headH}" rx="8" fill="url(#wood-pattern)" />` : ''}
          <rect x="${originX + 6}" y="${originY}" width="${drawW - 12}" height="${headH}" rx="8" fill="url(#body-grad)" />

          <!-- Bosh suyanchiqdagi zamonaviy yumshoq vertikal fluted segmentlar -->
          <line x1="${originX + drawW * 0.25}" y1="${originY + 12}" x2="${originX + drawW * 0.25}" y2="${frameY}" stroke="rgba(0,0,0,0.3)" stroke-width="2.5" />
          <line x1="${originX + drawW * 0.50}" y1="${originY + 12}" x2="${originX + drawW * 0.50}" y2="${frameY}" stroke="rgba(0,0,0,0.3)" stroke-width="2.5" />
          <line x1="${originX + drawW * 0.75}" y1="${originY + 12}" x2="${originX + drawW * 0.75}" y2="${frameY}" stroke="rgba(0,0,0,0.3)" stroke-width="2.5" />

          <!-- 2 ta yumshoq dekorativ Yostiq silueti -->
          <rect x="${originX + drawW * 0.12}" y="${matY - 14}" width="${drawW * 0.34}" height="18" rx="5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.8" />
          <line x1="${originX + drawW * 0.16}" y1="${matY - 5}" x2="${originX + drawW * 0.42}" y2="${matY - 5}" stroke="#e2e8f0" stroke-width="1.5" />
          <rect x="${originX + drawW * 0.54}" y="${matY - 14}" width="${drawW * 0.34}" height="18" rx="5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.8" />
          <line x1="${originX + drawW * 0.58}" y1="${matY - 5}" x2="${originX + drawW * 0.84}" y2="${matY - 5}" stroke="#e2e8f0" stroke-width="1.5" />

          <!-- Qalin ortopedik matras (Karkas ichiga chiroyli o'tirgan) -->
          <rect x="${originX + 12}" y="${matY}" width="${drawW - 24}" height="${matH}" rx="6" fill="#fdfbf7" stroke="#cbd5e1" stroke-width="2" />
          <!-- Matras ustki qoplama relyefi -->
          <line x1="${originX + 18}" y1="${matY + 10}" x2="${originX + drawW - 18}" y2="${matY + 10}" stroke="#e2e8f0" stroke-width="1.5" />
          <line x1="${originX + 18}" y1="${matY + 18}" x2="${originX + drawW - 18}" y2="${matY + 18}" stroke="#e2e8f0" stroke-width="1.5" />

          <!-- Krovat mustahkam karkasi (Tsarga) -->
          <rect x="${originX}" y="${frameY}" width="${drawW}" height="${frameH}" rx="4" fill="${colorHex}" stroke="#111827" stroke-width="2.5" />
          ${isWood ? `<rect x="${originX}" y="${frameY}" width="${drawW}" height="${frameH}" rx="4" fill="url(#wood-pattern)" />` : ''}

          <!-- Podkrovatnie yashiklar -->
          ${bedDrawersHtml}

          <!-- Qora metall oyoqlar -->
          <rect x="${originX + 14}" y="${originY + drawH - legH}" width="16" height="${legH}" rx="2" fill="#111827" />
          <rect x="${originX + drawW - 30}" y="${originY + drawH - legH}" width="16" height="${legH}" rx="2" fill="#111827" />
        `;

      // 6. ZAMONAVIY OFIS MEBELI (Executive Office Suite)
      } else {
        const topH = 18;
        const cabW = drawW * 0.36;
        const deskW = drawW - cabW;
        const drawCount = Math.max(Math.round(drawers), 2);
        const cabH = drawH - topH - 12;
        const cabY = originY + topH;
        const dH = (cabH - 6) / drawCount;

        let cabHtml = '';
        for (let od = 0; od < drawCount; od++) {
          const ody = cabY + 3 + od * dH;
          cabHtml += `
            <g>
              <rect x="${originX + deskW + 3}" y="${ody}" width="${cabW - 6}" height="${dH - 3}" rx="2" fill="${colorHex}" stroke="#111827" stroke-width="1.8" />
              ${isWood ? `<rect x="${originX + deskW + 3}" y="${ody}" width="${cabW - 6}" height="${dH - 3}" rx="2" fill="url(#wood-pattern)" />` : ''}
              <rect x="${originX + deskW + 3}" y="${ody}" width="${cabW - 6}" height="${dH - 3}" rx="2" fill="url(#body-grad)" />
              <!-- Yupqa qora tutqich -->
              <rect x="${originX + deskW + cabW * 0.25}" y="${ody + dH * 0.4}" width="${cabW * 0.5}" height="2.8" rx="1" fill="#111827" />
            </g>
          `;
        }

        html = `
          <!-- Pol soyasi -->
          <ellipse cx="${originX + drawW / 2}" cy="${originY + drawH + 3}" rx="${drawW * 0.46}" ry="6" fill="url(#floor-shadow)" />

          <!-- Modesty panel (Orqa ekran) -->
          <rect x="${originX + 18}" y="${originY + topH}" width="${deskW - 18}" height="${(drawH - topH) * 0.55}" fill="#181512" stroke="#111827" stroke-width="1.5" />
          <rect x="${originX + 18}" y="${originY + topH}" width="${deskW - 18}" height="${(drawH - topH) * 0.55}" fill="${colorHex}" fill-opacity="0.8" />

          <!-- Chap tomondagi U-Frame Loft metall oyoq -->
          <rect x="${originX + 6}" y="${originY + topH}" width="16" height="${drawH - topH}" rx="2" fill="url(#loft-metal)" stroke="#111827" stroke-width="1.5" />
          <ellipse cx="${originX + 14}" cy="${originY + drawH}" rx="7" ry="2.5" fill="url(#metal-handle)" />

          <!-- O'ng tomondagi arxiv tumbasi (Stoleshnitsa ostiga to'liq integratsiya) -->
          <rect x="${originX + deskW}" y="${cabY}" width="${cabW}" height="${cabH}" rx="4" fill="#1f2937" stroke="#111827" stroke-width="2" />
          ${cabHtml}
          <!-- Tumba pastki metall oyoqlari -->
          <rect x="${originX + deskW + 6}" y="${cabY + cabH}" width="10" height="12" rx="1" fill="#111827" />
          <rect x="${originX + drawW - 16}" y="${cabY + cabH}" width="10" height="12" rx="1" fill="#111827" />

          <!-- Monolit stoleshnitsa (Stol va tumba ustini birlashtiruvchi) -->
          <rect x="${originX}" y="${originY}" width="${drawW}" height="${topH}" rx="4" fill="${colorHex}" stroke="#181512" stroke-width="2.5" />
          ${isWood ? `<rect x="${originX}" y="${originY}" width="${drawW}" height="${topH}" rx="4" fill="url(#wood-pattern)" />` : ''}
          <rect x="${originX}" y="${originY}" width="${drawW}" height="${topH}" rx="4" fill="url(#body-grad)" />
          <line x1="${originX + 4}" y1="${originY + 2}" x2="${originX + drawW - 4}" y2="${originY + 2}" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" />
        `;
      }

      this.drawGroup.innerHTML = html;

      // O'lchov chiziqlari
      const botY = originY + drawH + 24;
      const leftX = Math.max(originX - 24, 20);
      this.dimGroup.innerHTML = `
        <line x1="${originX + 6}" y1="${botY}" x2="${originX + drawW - 6}" y2="${botY}" stroke="#D97706" stroke-width="2" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
        <rect x="${originX + drawW / 2 - 34}" y="${botY - 10}" width="68" height="20" rx="4" fill="var(--blueprint-bg)" stroke="#D97706" stroke-width="0.8" />
        <text x="${originX + drawW / 2}" y="${botY + 4}" font-family="var(--font-mono)" font-size="12" font-weight="800" fill="#D97706" text-anchor="middle">${Math.round(width)} sm</text>

        <line x1="${leftX}" y1="${originY + 6}" x2="${leftX}" y2="${originY + drawH - 6}" stroke="#D97706" stroke-width="2" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
        <rect x="${leftX - 10}" y="${originY + drawH / 2 - 28}" width="20" height="56" rx="4" fill="var(--blueprint-bg)" stroke="#D97706" stroke-width="0.8" />
        <text x="${leftX + 4}" y="${originY + drawH / 2}" font-family="var(--font-mono)" font-size="12" font-weight="800" fill="#D97706" text-anchor="middle" transform="rotate(-90 ${leftX + 4} ${originY + drawH / 2})">${Math.round(height)} sm</text>
      `;
    }
  }

  // DASTURNI ISHGA TUSHIRISH
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Mavzu (Dark/Light mode)
    const storedTheme = localStorage.getItem('mebelpro_theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);

    // Savat hisoblagichini yangilash
    try {
      const cart = JSON.parse(localStorage.getItem('mebelpro_cart') || '[]');
      const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
      const badge = document.getElementById('cart-counter-badge');
      if (badge) badge.textContent = count;
    } catch (e) {}

    window.addDirectToCart = function(title, category, price) {
      try {
        const cart = JSON.parse(localStorage.getItem('mebelpro_cart') || '[]');
        const existing = cart.find(x => x.title === title);
        if (existing) {
          existing.qty = (existing.qty || 1) + 1;
        } else {
          cart.push({
            id: 'direct_' + Date.now(),
            title: title,
            category: category,
            specs: "Standart fabrika o'lchami • 2 yil kafolat",
            price: price,
            qty: 1
          });
        }
        localStorage.setItem('mebelpro_cart', JSON.stringify(cart));
        const badge = document.getElementById('cart-counter-badge');
        if (badge) {
          const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
          badge.textContent = count;
        }
        showToast(`"${title}" savatga qo'shildi!`, 'success');
      } catch (err) {
        console.error(err);
      }
    };

    // 1.1. MAVZU (DARK/LIGHT) VA QUYOSH/OY IKONKASI
    const sunIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    const moonIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

    function applyAppTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      localStorage.setItem('mebelpro_theme', theme);
      localStorage.setItem('mebel_theme', theme);

      document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.innerHTML = theme === 'dark' ? sunIconSvg : moonIconSvg;
        btn.setAttribute('aria-label', theme === 'dark' ? "Yorug' mavzuga o'tish" : "Qorong'i mavzuga o'tish");
        btn.setAttribute('title', theme === 'dark' ? "Yorug' mavzuga o'tish" : "Qorong'i mavzuga o'tish");
      });
    }

    const currentSavedTheme = localStorage.getItem('theme') || localStorage.getItem('mebelpro_theme') || localStorage.getItem('mebel_theme') || 'light';
    applyAppTheme(currentSavedTheme);

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        applyAppTheme(next);
        showToast(`Mavzu: ${next === 'dark' ? "Qorong'i" : "Yorug'"} rejim yoqildi`, 'info');
      });
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'theme' || e.key === 'mebelpro_theme' || e.key === 'mebel_theme') {
        if (e.newValue) applyAppTheme(e.newValue);
      }
    });

    // 2. Mobil burger menyu
    const burgerBtn = document.getElementById('burger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (burgerBtn && mobileMenu) {
      burgerBtn.addEventListener('click', () => {
        burgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('open');
      });
      mobileMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          burgerBtn.classList.remove('active');
          mobileMenu.classList.remove('open');
        });
      });
    }

    // 3. Vizualizator va Kalkulyator holati
    const svgEl = document.getElementById('mebel-visual-svg');
    let visualizer = null;
    if (svgEl) visualizer = new Visualizer(svgEl);

    const state = {
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

    let currentPrice = 0;

    function applyTypeLimits(type, reset = false) {
      const lim = FURNITURE_LIMITS[type] || FURNITURE_LIMITS.shkaf;
      ['width', 'height', 'depth'].forEach(dim => {
        const l = lim[dim];
        const s = document.getElementById(`${dim}-slider`);
        const inp = document.getElementById(`${dim}-input`);
        const minL = document.getElementById(`${dim}-min`);
        const maxL = document.getElementById(`${dim}-max`);
        if (s && inp) {
          s.min = l.min; s.max = l.max; s.step = l.step;
          inp.min = l.min; inp.max = l.max;
          if (minL) minL.textContent = `${l.min} ${l.unit}`;
          if (maxL) maxL.textContent = `${l.max} ${l.unit}`;
          if (reset || state[dim] < l.min || state[dim] > l.max) state[dim] = l.default;
          s.value = state[dim];
          inp.value = state[dim];
        }
      });

      // Stepperlarni ko'rsatish/yashirish
      const sBox = document.getElementById('shelves-stepper-box');
      const dBox = document.getElementById('drawers-stepper-box');
      const drBox = document.getElementById('doors-stepper-box');
      if (sBox) sBox.style.display = lim.hasShelves ? 'flex' : 'none';
      if (dBox) dBox.style.display = lim.hasDrawers ? 'flex' : 'none';
      if (drBox) drBox.style.display = lim.hasDoors ? 'flex' : 'none';

      ['shelves', 'drawers', 'doors'].forEach(item => {
        const l = lim[item];
        if (reset || state[item] < l.min || state[item] > l.max) state[item] = l.default;
        const vEl = document.getElementById(`${item}-val`);
        if (vEl) vEl.textContent = state[item];
      });

      if (visualizer) visualizer.update({ type, ...state });
      if (window.MebelProStudio) window.MebelProStudio.updateData({ type, ...state });
    }

    function updateQuote(instant = false) {
      if (visualizer) {
        visualizer.update({
          type: state.type,
          width: state.width,
          height: state.height,
          depth: state.depth,
          shelves: state.shelves,
          drawers: state.drawers,
          doors: state.doors,
          colorHex: state.colorHex,
          isWood: state.isWood
        });
      }
      if (window.MebelProStudio) {
        window.MebelProStudio.updateData({
          type: state.type,
          width: state.width,
          height: state.height,
          depth: state.depth,
          shelves: state.shelves,
          drawers: state.drawers,
          doors: state.doors,
          colorHex: state.colorHex,
          isWood: state.isWood
        });
      }

      const q = calculateQuote(state);
      const priceEl = document.getElementById('big-price-value');
      const mobPriceEl = document.getElementById('mobile-bar-price-val');
      const target = q.totalPrice;
      const start = currentPrice || target;

      if (instant) {
        if (priceEl) priceEl.textContent = q.formattedTotal;
        if (mobPriceEl) mobPriceEl.textContent = q.formattedTotal;
        currentPrice = target;
      } else {
        animateNumber(priceEl, start, target, 450, n => formatSum(n));
        if (mobPriceEl) animateNumber(mobPriceEl, start, target, 450, n => formatSum(n));
        currentPrice = target;
      }

      const bd = q.breakdown;
      const setBd = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatSum(val);
      };
      setBd('bd-materials', bd.materials);
      setBd('bd-edge', bd.edge);
      setBd('bd-hardware', bd.hardware);
      setBd('bd-labor', bd.labor);
      setBd('bd-delivery', bd.delivery);
      setBd('bd-installation', bd.installation);
      setBd('bd-total', bd.total);

      // 0% Bo'lib to'lash (Nasiya) oylik summasini yangilash
      updateInstallment(target);
    }

    let selectedInstallmentMonths = 6;
    function updateInstallment(total) {
      const monthlyEl = document.getElementById('installment-monthly-val');
      if (monthlyEl && total) {
        const monthly = Math.round(total / (selectedInstallmentMonths || 6));
        monthlyEl.textContent = formatSum(monthly) + ' / oy';
      }
    }

    // Hodisalarni ulash
    // Mebel turlari
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.type = btn.dataset.type;

        // Active toifa pill matnini yangilash
        const pill = document.getElementById('type-active-pill');
        if (pill) {
          const typeNames = {
            shkaf: 'Tanlangan: Shkaf-kupe (Garderob)',
            oshxona: 'Tanlangan: Oshxona Garnituri',
            tumba: 'Tanlangan: Tumba va Komod',
            stol: 'Tanlangan: Zamonaviy Stol',
            krovat: 'Tanlangan: Ortopedik Krovat',
            ofis: 'Tanlangan: Ofis Mebeli'
          };
          pill.textContent = typeNames[state.type] || `Tanlangan: ${state.type}`;
        }

        applyTypeLimits(state.type, true);
        updateQuote();
      });
    });

    // Slider va Inputlar
    ['width', 'height', 'depth'].forEach(dim => {
      const slider = document.getElementById(`${dim}-slider`);
      const input = document.getElementById(`${dim}-input`);
      const err = document.getElementById(`${dim}-error`);
      if (slider && input) {
        slider.addEventListener('input', (e) => {
          input.value = e.target.value;
          state[dim] = Number(e.target.value);
          if (err) err.classList.remove('visible');
          updateQuote();
        });
        input.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          const lim = FURNITURE_LIMITS[state.type][dim];
          if (val < lim.min || val > lim.max) {
            if (err) {
              err.textContent = `${lim.min} va ${lim.max} sm orasida kiriting`;
              err.classList.add('visible');
            }
          } else {
            if (err) err.classList.remove('visible');
            slider.value = val;
            state[dim] = val;
            updateQuote();
          }
        });
        input.addEventListener('blur', (e) => {
          const lim = FURNITURE_LIMITS[state.type][dim];
          const val = clamp(e.target.value, lim.min, lim.max);
          input.value = val;
          slider.value = val;
          state[dim] = val;
          if (err) err.classList.remove('visible');
          updateQuote();
        });
      }
    });

    // Stepperlar
    ['shelves', 'drawers', 'doors'].forEach(item => {
      const minus = document.getElementById(`${item}-minus`);
      const plus = document.getElementById(`${item}-plus`);
      const valEl = document.getElementById(`${item}-val`);
      if (minus && plus && valEl) {
        minus.addEventListener('click', () => {
          const lim = FURNITURE_LIMITS[state.type][item];
          if (state[item] > lim.min) {
            state[item] -= 1;
            valEl.textContent = state[item];
            updateQuote();
          }
        });
        plus.addEventListener('click', () => {
          const lim = FURNITURE_LIMITS[state.type][item];
          if (state[item] < lim.max) {
            state[item] += 1;
            valEl.textContent = state[item];
            updateQuote();
          }
        });
      }
    });

    // Chipslar
    function bindChips(containerId, stateKey) {
      const c = document.getElementById(containerId);
      if (!c) return;
      c.addEventListener('click', (e) => {
        const chip = e.target.closest('.option-chip');
        if (!chip) return;
        c.querySelectorAll('.option-chip').forEach(ch => ch.classList.remove('active'));
        chip.classList.add('active');
        state[stateKey] = chip.dataset.value;
        updateQuote();
      });
    }
    bindChips('body-material-chips', 'bodyMaterial');
    bindChips('facade-material-chips', 'facadeMaterial');
    bindChips('edge-chips', 'edgeType');
    bindChips('hardware-chips', 'hardwareTier');
    bindChips('delivery-chips', 'deliveryZone');

    // O'rnatish
    const inst = document.getElementById('installation-toggle');
    if (inst) {
      inst.addEventListener('change', (e) => {
        state.installation = e.target.checked;
        updateQuote();
      });
    }

    // Ranglar
    document.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        state.color = sw.dataset.colorId;
        state.colorHex = sw.dataset.colorHex;
        state.isWood = sw.dataset.isWood === 'true';
        updateQuote();
      });
    });

    // 1-bosishda tayyor dizayn uslublari (Presets)
    const presetConfigs = {
      scandi: {
        bodyMaterial: 'dsp_standart',
        facadeMaterial: 'akril_facade',
        edgeType: 'pvc_20',
        hardwareTier: 'premium',
        color: 'white',
        colorHex: '#FFFFFF',
        isWood: false,
        name: 'Skandinav Oq'
      },
      loft: {
        bodyMaterial: 'lmdf_premium',
        facadeMaterial: 'pvc_facade',
        edgeType: 'pvc_20',
        hardwareTier: 'premium',
        color: 'oak',
        colorHex: '#B88654',
        isWood: true,
        name: 'Loft & Eman'
      },
      neoclassic: {
        bodyMaterial: 'lmdf_premium',
        facadeMaterial: 'emal_facade',
        edgeType: 'pvc_20',
        hardwareTier: 'premium',
        color: 'graphite',
        colorHex: '#373A3C',
        isWood: false,
        name: 'Neo-Klassik Grafit'
      },
      dark: {
        bodyMaterial: 'lmdf_premium',
        facadeMaterial: 'emal_facade',
        edgeType: 'pvc_20',
        hardwareTier: 'premium',
        color: 'graphite',
        colorHex: '#373A3C',
        isWood: false,
        name: 'Neo-Klassik Grafit'
      },
      royal: {
        bodyMaterial: 'lmdf_premium',
        facadeMaterial: 'akril_facade',
        edgeType: 'pvc_20',
        hardwareTier: 'premium',
        color: 'walnut',
        colorHex: '#7A4B29',
        isWood: true,
        name: 'Royal Yong\'oq'
      }
    };

    document.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const pKey = card.dataset.preset;
        const cfg = presetConfigs[pKey];
        if (!cfg) return;

        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        state.bodyMaterial = cfg.bodyMaterial;
        state.facadeMaterial = cfg.facadeMaterial;
        state.edgeType = cfg.edgeType;
        state.hardwareTier = cfg.hardwareTier;
        state.color = cfg.color;
        state.colorHex = cfg.colorHex;
        state.isWood = cfg.isWood;

        const syncChip = (containerId, val) => {
          const cont = document.getElementById(containerId);
          if (!cont) return;
          cont.querySelectorAll('.option-chip').forEach(ch => {
            ch.classList.toggle('active', ch.dataset.value === val);
          });
        };
        syncChip('body-material-chips', cfg.bodyMaterial);
        syncChip('facade-material-chips', cfg.facadeMaterial);
        syncChip('edge-chips', cfg.edgeType);
        syncChip('hardware-chips', cfg.hardwareTier);

        document.querySelectorAll('.swatch').forEach(sw => {
          sw.classList.toggle('active', sw.dataset.colorId === cfg.color);
        });

        updateQuote();
        if (typeof showToast === 'function') {
          showToast(`"${cfg.name}" dizayn uslubi qo'llandi!`, 'success');
        }
      });
    });

    // Nusxalash
    const copyBtn = document.getElementById('btn-copy-quote');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = `MebelPro Hisob Xulosasi:\n` +
          `Mebel: ${FURNITURE_LIMITS[state.type].name}\n` +
          `O'lcham: ${state.width} x ${state.height} x ${state.depth} sm\n` +
          `Jami narx: ${formatSum(currentPrice)}\n` +
          `Kafolat: 2 yil rasmiy kafolat\n` +
          `Sayt: ${window.location.origin || 'MebelPro'}`;
        navigator.clipboard.writeText(text).then(() => {
          showToast('Hisob xulosasi nusxalandi!', 'success');
        }).catch(() => {
          showToast('Nusxalandi!', 'success');
        });
      });
    }

    // Telegram ulashish
    const tgBtn = document.getElementById('btn-share-tg');
    if (tgBtn) {
      tgBtn.addEventListener('click', () => {
        const msg = encodeURIComponent(`MebelPro da ${FURNITURE_LIMITS[state.type].name} hisobladim. Narxi: ${formatSum(currentPrice)}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${msg}`, '_blank');
      });
    }

    // Hisob tafsiloti accordion
    const toggleBd = document.getElementById('toggle-breakdown-btn');
    const bdContent = document.getElementById('breakdown-content');
    if (toggleBd && bdContent) {
      toggleBd.addEventListener('click', () => {
        bdContent.classList.toggle('open');
        toggleBd.classList.toggle('active');
      });
    }

    // FAQ accordion
    document.querySelectorAll('.faq-item').forEach(item => {
      const header = item.querySelector('.faq-header');
      if (header) {
        header.addEventListener('click', () => {
          item.classList.toggle('active');
        });
      }
    });

    // 4. BUYURTMA FORMASI VA MODAL (INVESTORLAR UCHUN TO'LIQ ISHCHI TIZIM)
    const orderModal = document.getElementById('order-modal');
    const openOrderBtns = document.querySelectorAll('.btn-open-order');
    const closeOrderBtn = document.getElementById('close-order-modal');
    const orderForm = document.getElementById('order-form');

    function openModal() {
      if (!orderModal) return;
      document.getElementById('modal-furniture-name').textContent = FURNITURE_LIMITS[state.type].name;
      document.getElementById('modal-furniture-dims').textContent = `${state.width}x${state.height}x${state.depth} sm`;
      document.getElementById('modal-furniture-price').textContent = formatSum(currentPrice);
      orderModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (!orderModal) return;
      orderModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    openOrderBtns.forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    }));

    if (closeOrderBtn) closeOrderBtn.addEventListener('click', closeModal);
    if (orderModal) {
      orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) closeModal();
      });
    }

    if (orderForm) {
      orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('order-client-name').value.trim();
        const clientPhone = document.getElementById('order-client-phone').value.trim();
        const clientAddress = document.getElementById('order-client-address').value.trim();

        if (!clientName || !clientPhone) {
          showToast('Ism va telefon raqamingizni kiriting', 'error');
          return;
        }

        const orderId = 'MP-' + Math.floor(1000 + Math.random() * 9000);
        const orderData = {
          id: orderId,
          date: new Date().toLocaleDateString('uz-UZ'),
          clientName,
          clientPhone,
          clientAddress,
          type: FURNITURE_LIMITS[state.type].name,
          dimensions: `${state.width} x ${state.height} x ${state.depth} sm`,
          color: state.color,
          totalPrice: currentPrice,
          formattedPrice: formatSum(currentPrice),
          status: 'Qabul qilindi' // Boshlang'ich holat
        };

        // LocalStorage'ga saqlash
        const orders = JSON.parse(localStorage.getItem('mebelpro_orders') || '[]');
        orders.unshift(orderData);
        localStorage.setItem('mebelpro_orders', JSON.stringify(orders));

        // Serverga yuborish (agar server ishlab turgan bo'lsa)
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        }).catch(() => {});

        closeModal();
        orderForm.reset();

        // Muvaffaqiyat xabari va Buyurtma ID ko'rsatish
        showToast(`Buyurtma qabul qilindi! ID: #${orderId}`, 'success');

        // Holat tekshirish blokini to'ldirish
        const trackInput = document.getElementById('track-order-input');
        if (trackInput) {
          trackInput.value = orderId;
          trackOrder(orderId);
          document.getElementById('buyurtma-holati')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // 4.5. MUDDATLI TO'LOV OYLIK TANLOVI (INSTALLMENT MONTH BUTTONS)
    document.querySelectorAll('.installment-month-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.installment-month-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedInstallmentMonths = Number(btn.dataset.months) || 6;
        updateInstallment(currentPrice);
      });
    });

    // 4.6. RANG PALITRASI TANLAGICHI (PALETTE SWITCHER)
    const paletteToggleBtn = document.getElementById('palette-toggle-btn');
    const paletteDropdown = document.getElementById('palette-dropdown');
    const paletteLabel = document.getElementById('palette-label-text');

    if (paletteToggleBtn && paletteDropdown) {
      paletteToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        paletteDropdown.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        paletteDropdown.classList.remove('open');
      });

      const paletteNames = {
        mocha: 'Mocha',
        emerald: 'Zümrad',
        japandi: 'Japandi',
        obsidian: 'Obsidian'
      };

      document.querySelectorAll('[data-set-palette]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const p = btn.dataset.setPalette;
          document.documentElement.setAttribute('data-palette', p);
          localStorage.setItem('mebelpro_palette', p);
          if (paletteLabel) paletteLabel.textContent = paletteNames[p] || p;
          document.querySelectorAll('[data-set-palette]').forEach(b => b.classList.toggle('active', b === btn));
          showToast(`"${paletteNames[p]}" rang uslubi tanlandi!`, 'success');
          paletteDropdown.classList.remove('open');
        });
      });

      // Default yoki saqlangan palitra
      const savedPalette = localStorage.getItem('mebelpro_palette') || 'mocha';
      document.documentElement.setAttribute('data-palette', savedPalette);
      if (paletteLabel) paletteLabel.textContent = paletteNames[savedPalette] || 'Mocha';
      document.querySelectorAll(`[data-set-palette="${savedPalette}"]`).forEach(b => b.classList.add('active'));
    }

    // 4.7. BEPUL LAZERLI O'LCHOVCHINI CHAQIRISH TIZIMI
    // Xona chiplari
    document.querySelectorAll('.room-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.room-chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Vaqt oralig'i tugmalari
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // O'lchovchi modali ochish/yopish
    const measureModal = document.getElementById('measure-modal');
    const openMeasureBtns = document.querySelectorAll('.btn-open-measure');
    const closeMeasureBtn = document.getElementById('close-measure-modal');

    openMeasureBtns.forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      if (measureModal) {
        measureModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }));

    if (closeMeasureBtn && measureModal) {
      closeMeasureBtn.addEventListener('click', () => {
        measureModal.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    // O'lchov formalarini yuborish
    function bindMeasureForm(formId) {
      const f = document.getElementById(formId);
      if (!f) return;
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = f.querySelector('#measure-name, #modal-measure-name')?.value || 'Hurmatli mijoz';
        const phone = f.querySelector('#measure-phone, #modal-measure-phone')?.value || '';
        const address = f.querySelector('#measure-address, #modal-measure-address')?.value || 'Toshkent';

        const booking = {
          id: 'MB-' + Math.floor(1000 + Math.random() * 9000),
          clientName: name,
          clientPhone: phone,
          address: address,
          createdAt: new Date().toISOString(),
          status: 'O\'lchov tayinlandi'
        };

        const bookings = JSON.parse(localStorage.getItem('mebelpro_measurements') || '[]');
        bookings.push(booking);
        localStorage.setItem('mebelpro_measurements', JSON.stringify(bookings));

        showToast(`Rahmat, ${name}! Bepul lazerli o'lchov so'rovi qabul qilindi. 15 daqiqada bog'lanamiz.`, 'success');
        f.reset();
        if (measureModal) {
          measureModal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
    bindMeasureForm('section-measure-form');
    bindMeasureForm('modal-measure-form');

    // 5. BUYURTMA HOLATINI TEKSHIRISH (5-BOSQICHLI TRACKING)
    const trackBtn = document.getElementById('track-order-btn');
    if (trackBtn) {
      trackBtn.addEventListener('click', () => {
        const id = document.getElementById('track-order-input').value.trim();
        trackOrder(id);
      });
    }

    function trackOrder(orderId) {
      const resultBox = document.getElementById('track-result-box');
      if (!resultBox) return;

      const cleanId = orderId.replace('#', '').trim().toUpperCase();
      const orders = JSON.parse(localStorage.getItem('mebelpro_orders') || '[]');
      let found = orders.find(o => o.id === cleanId || o.clientPhone.includes(cleanId));

      // Namunaviy demo buyurtmalar (Foydalanuvchi sinab ko'rishi uchun)
      if (!found && (cleanId === 'MP-1042' || cleanId === '1042' || cleanId === '')) {
        found = {
          id: 'MP-1042',
          type: 'Oshxona garnituri (Milano High-Gloss)',
          dimensions: '280x230x60 sm',
          clientName: 'Aziz Rahimov',
          clientPhone: '+998 (90) 876-54-32',
          status: 'Sexda kesilmoqda (Raskroy 75%)',
          formattedPrice: '5,800,000 so\'m',
          masterName: 'Usta Rustam (Tajriba: 12 yil)',
          masterPhone: '+998 (97) 712-34-56',
          targetDate: '15-Oktabr, 2026',
          step: 3
        };
      } else if (!found && (cleanId === 'MP-2026' || cleanId === '2026')) {
        found = {
          id: 'MP-2026',
          type: 'Verona Shkaf-Kupe 3 Eshikli',
          dimensions: '220x240x60 sm',
          clientName: 'Malika Karimova',
          clientPhone: '+998 (93) 123-45-67',
          status: 'Montajga tayyor (Yetkazilmoqda)',
          formattedPrice: '4,650,000 so\'m',
          masterName: 'Usta Bobur (Tajriba: 9 yil)',
          masterPhone: '+998 (90) 999-88-77',
          targetDate: 'Ertaga, 13-Oktabr',
          step: 4
        };
      }

      if (found) {
        const s = found.step || (found.status === 'Qabul qilindi' ? 1 : found.status === 'O\'lchov olindi' ? 2 : 3);
        resultBox.innerHTML = `
          <div class="track-card">
            <div class="track-card-header">
              <div>
                <span class="track-id">Buyurtma #${found.id}</span>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Rejali yetkazish: <strong>${found.targetDate || '7 ish kunida'}</strong></div>
              </div>
              <span class="track-badge">● ${found.status}</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin: 12px 0; font-size:13px;">
              <div><span style="color:var(--text-muted);">Mebel:</span> <strong>${found.type}</strong> (${found.dimensions})</div>
              <div><span style="color:var(--text-muted);">Mijoz:</span> <strong>${found.clientName}</strong></div>
              <div><span style="color:var(--text-muted);">Jami narx:</span> <strong style="color:var(--color-primary);">${found.formattedPrice}</strong></div>
              <div><span style="color:var(--text-muted);">Mas'ul usta:</span> <strong>${found.masterName || 'Usta Rustam'}</strong> (<a href="tel:+998901234567" style="color:var(--color-primary); text-decoration:underline;">Qo'ng'iroq</a>)</div>
            </div>

            <div class="track-timeline" style="grid-template-columns: repeat(5, 1fr); margin-top:16px;">
              <div class="track-step-rich ${s >= 1 ? 'done' : ''}">
                <div class="track-step-circle">${s > 1 ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '1'}</div>
                <div class="track-step-title">1. O'lchov</div>
                <div class="track-step-desc">Lazerli 3D</div>
              </div>
              <div class="track-step-rich ${s >= 2 ? 'done' : s === 2 ? 'active' : ''}">
                <div class="track-step-circle">${s > 2 ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '2'}</div>
                <div class="track-step-title">2. 3D Model</div>
                <div class="track-step-desc">Naryad & BOM</div>
              </div>
              <div class="track-step-rich ${s >= 3 ? (s === 3 ? 'active' : 'done') : ''}">
                <div class="track-step-circle">${s > 3 ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '3'}</div>
                <div class="track-step-title">3. Sexda Kesish</div>
                <div class="track-step-desc">Kromka & Raskroy</div>
              </div>
              <div class="track-step-rich ${s >= 4 ? (s === 4 ? 'active' : 'done') : ''}">
                <div class="track-step-circle">${s > 4 ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '4'}</div>
                <div class="track-step-title">4. Sifat Nazorati</div>
                <div class="track-step-desc">Yig'ish & QC</div>
              </div>
              <div class="track-step-rich ${s >= 5 ? 'done' : ''}">
                <div class="track-step-circle">5</div>
                <div class="track-step-title">5. Montaj</div>
                <div class="track-step-desc">Yetkazish & O'rnatish</div>
              </div>
            </div>
          </div>
        `;
        resultBox.style.display = 'block';
      } else {
        resultBox.innerHTML = `
          <div class="track-card" style="border-color:var(--color-error); text-align:center;">
            <p style="color:var(--color-error); font-weight:800; font-size:15px;">Buyurtma topilmadi!</p>
            <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">Namunaviy buyurtmalarni tekshirib ko'ring: <strong>MP-1042</strong> yoki <strong>MP-2026</strong></p>
          </div>
        `;
        resultBox.style.display = 'block';
      }
    }

    // Boshlang'ich hisob
    applyTypeLimits(state.type, false);
    updateQuote(true);

    // Agar catalog.html yoki boshqa joydan mebel turi tanlab o'tilgan bo'lsa
    const openType = localStorage.getItem('mebelpro_open_type');
    if (openType) {
      localStorage.removeItem('mebelpro_open_type');
      const targetBtn = document.querySelector(`.type-btn[data-type="${openType}"]`);
      if (targetBtn) {
        targetBtn.click();
        setTimeout(() => {
          document.getElementById('kalkulyator')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }

    // Hero parallax suzuvchi mebel
    initHeroFloatingFurniture();
  });

  function initHeroFloatingFurniture() {
    const heroCanvas = document.getElementById('hero-furniture-canvas');
    if (!heroCanvas) return;

    heroCanvas.innerHTML = `
      <g id="hero-floating-elements" style="transition: transform 0.2s cubic-bezier(0.2, 0, 0.4, 1);">
        <g id="float-chair" transform="translate(60, 50)" stroke="#D97706" stroke-width="2" fill="none" opacity="0.45">
          <path d="M10 50 L10 10 Q10 5 15 5 L35 5 Q40 5 40 10 L40 50 Z" />
          <line x1="5" y1="50" x2="45" y2="50" stroke-width="3" />
          <line x1="10" y1="50" x2="8" y2="85" />
          <line x1="40" y1="50" x2="42" y2="85" />
          <line x1="8" y1="68" x2="42" y2="68" />
        </g>
        <g id="float-wardrobe" transform="translate(740, 40)" stroke="#B45309" stroke-width="2" fill="none" opacity="0.40">
          <rect x="0" y="0" width="75" height="115" rx="4" />
          <line x1="37" y1="0" x2="37" y2="115" />
          <circle cx="30" cy="58" r="2.5" fill="#B45309" />
          <circle cx="44" cy="58" r="2.5" fill="#B45309" />
          <line x1="0" y1="100" x2="75" y2="100" />
        </g>
        <g id="float-table" transform="translate(90, 240)" stroke="#D97706" stroke-width="2" fill="none" opacity="0.42">
          <rect x="0" y="0" width="110" height="15" rx="3" />
          <line x1="15" y1="15" x2="15" y2="70" />
          <line x1="95" y1="15" x2="95" y2="70" />
          <line x1="15" y1="38" x2="95" y2="38" stroke-dasharray="4 3" />
        </g>
        <g id="float-lamp" transform="translate(780, 210)" stroke="#F59E0B" stroke-width="2" fill="none" opacity="0.45">
          <path d="M10 35 L40 10 L55 35 Z" />
          <line x1="35" y1="35" x2="35" y2="110" />
          <ellipse cx="35" cy="110" rx="22" ry="5" />
          <line x1="25" y1="45" x2="45" y2="45" stroke-dasharray="2 2" />
        </g>
      </g>
    `;

    const el = document.getElementById('hero-floating-elements');
    if (!el) return;

    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      my = (e.clientY - window.innerHeight / 2) / window.innerHeight;
    }, { passive: true });

    let t = 0;
    function loop() {
      t += 0.015;
      const sx = Math.sin(t) * 10, sy = Math.cos(t * 0.8) * 8;
      const px = mx * 22 + sx, py = my * 18 + (window.scrollY * 0.12) + sy;
      el.setAttribute('transform', `translate(${px}, ${-py})`);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
