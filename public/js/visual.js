/**
 * MebelHisob - Jonli SVG Vizualizatsiya Moduli (visual.js)
 * Toza SVG bilan 6 ta mebel turini real vaqtda, proporsional va silliq chizish.
 */

class FurnitureVisualizer {
  constructor(svgElement) {
    this.svg = svgElement;
    
    // Hozirgi animatsiya holati (standart: Eman yog'ochi)
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

    // Maqsadli holat
    this.target = { ...this.current };

    this.isAnimating = false;
    this.interactiveState = {
      doorSlideOffset: 0,
      drawerOpenOffset: 0
    };

    this.initPatterns();
    this.setupInteractivity();
    this.render();
  }

  // SVG gradientlari va yog'och teksturalari
  initPatterns() {
    this.svg.innerHTML = `
      <defs>
        <!-- O'lchov chizig'i strelkasi (Yuqori kontrastli to'q sariq) -->
        <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706" />
        </marker>
        <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706" />
        </marker>

        <!-- Hajmli gradientlar -->
        <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.18" />
        </linearGradient>

        <linearGradient id="depth-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.30" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
        </linearGradient>

        <!-- Yog'och tekstura namunasi (Wood Grain Pattern) -->
        <pattern id="wood-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
          <line x1="0" y1="12" x2="60" y2="12" stroke="rgba(0,0,0,0.12)" stroke-width="1.5" stroke-dasharray="10 5" />
          <line x1="0" y1="30" x2="60" y2="30" stroke="rgba(255,255,255,0.12)" stroke-width="1.2" />
          <line x1="0" y1="46" x2="60" y2="46" stroke="rgba(0,0,0,0.10)" stroke-width="1.8" stroke-dasharray="16 8" />
        </pattern>

        <!-- Metall furnitura gradienti -->
        <linearGradient id="metal-handle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#E5E7EB" />
          <stop offset="50%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#9CA3AF" />
        </linearGradient>
      </defs>
      <g id="visual-drawing-group"></g>
      <g id="dimension-lines-group"></g>
    `;
    this.drawingGroup = this.svg.querySelector('#visual-drawing-group');
    this.dimGroup = this.svg.querySelector('#dimension-lines-group');
  }

  // Interaktiv ochilib-yopilish (hover / click)
  setupInteractivity() {
    this.svg.addEventListener('mouseenter', () => {
      this.animateInteractive(15, 12);
    });
    this.svg.addEventListener('mouseleave', () => {
      this.animateInteractive(0, 0);
    });

    // Mobil bosish uchun
    this.svg.addEventListener('click', () => {
      const isOpened = this.interactiveState.drawerOpenOffset > 0;
      this.animateInteractive(isOpened ? 0 : 15, isOpened ? 0 : 12);
    });
  }

  animateInteractive(targetDoor, targetDrawer) {
    const startDoor = this.interactiveState.doorSlideOffset;
    const startDrawer = this.interactiveState.drawerOpenOffset;
    const startTime = performance.now();
    const duration = 250;

    const step = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      this.interactiveState.doorSlideOffset = startDoor + (targetDoor - startDoor) * progress;
      this.interactiveState.drawerOpenOffset = startDrawer + (targetDrawer - startDrawer) * progress;
      this.render();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Parametrlarni yangilash
  update(newParams) {
    const typeChanged = newParams.type && newParams.type !== this.current.type;

    if (typeChanged) {
      this.svg.style.opacity = '0.3';
      setTimeout(() => {
        this.current.type = newParams.type;
        this.target = { ...this.current, ...newParams };
        this.svg.style.opacity = '1';
        this.startTween();
      }, 100);
      return;
    }

    this.target = { ...this.target, ...newParams };
    this.startTween();
  }

  startTween() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.current = { ...this.target };
      this.render();
      this.isAnimating = false;
      return;
    }

    const animate = () => {
      let needsMore = false;
      const ease = 0.25;

      ['width', 'height', 'depth', 'shelves', 'drawers', 'doors'].forEach(prop => {
        const diff = this.target[prop] - this.current[prop];
        if (Math.abs(diff) > 0.05) {
          this.current[prop] += diff * ease;
          needsMore = true;
        } else {
          this.current[prop] = this.target[prop];
        }
      });

      this.current.colorHex = this.target.colorHex || this.current.colorHex;
      this.current.isWood = this.target.isWood !== undefined ? this.target.isWood : this.current.isWood;

      this.render();

      if (needsMore) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
      }
    };

    requestAnimationFrame(animate);
  }

  // Chizish funksiyasi
  render() {
    if (!this.drawingGroup || !this.dimGroup) return;

    const { type, width, height, depth, shelves, drawers, doors, colorHex, isWood } = this.current;

    // Viewport va masshtab hisobi (600x450 koordinata tizimi)
    const paddingX = 85;
    const paddingY = 75;
    const maxDrawWidth = 600 - (paddingX * 2);
    const maxDrawHeight = 450 - (paddingY * 2);

    const scale = Math.min(maxDrawWidth / width, maxDrawHeight / height);

    const drawW = width * scale;
    const drawH = height * scale;
    const originX = (600 - drawW) / 2;
    const originY = 50 + (maxDrawHeight - drawH) / 2;

    let furnitureHtml = '';

    switch (type) {
      case 'shkaf':
        furnitureHtml = this.drawWardrobe(originX, originY, drawW, drawH, shelves, drawers, doors, colorHex, isWood);
        break;
      case 'oshxona':
        furnitureHtml = this.drawKitchen(originX, originY, drawW, drawH, shelves, drawers, doors, colorHex, isWood);
        break;
      case 'tumba':
        furnitureHtml = this.drawCabinet(originX, originY, drawW, drawH, shelves, drawers, doors, colorHex, isWood);
        break;
      case 'stol':
        furnitureHtml = this.drawTable(originX, originY, drawW, drawH, drawers, colorHex, isWood);
        break;
      case 'krovat':
        furnitureHtml = this.drawBed(originX, originY, drawW, drawH, drawers, colorHex, isWood);
        break;
      case 'ofis':
        furnitureHtml = this.drawOfficeDesk(originX, originY, drawW, drawH, shelves, drawers, doors, colorHex, isWood);
        break;
      default:
        furnitureHtml = this.drawWardrobe(originX, originY, drawW, drawH, shelves, drawers, doors, colorHex, isWood);
    }

    this.drawingGroup.innerHTML = furnitureHtml;
    this.dimGroup.innerHTML = this.drawDimensionLines(originX, originY, drawW, drawH, Math.round(width), Math.round(height));
  }

  // 1. Shkaf-kupe
  drawWardrobe(x, y, w, h, shelves, drawers, doors, color, isWood) {
    const doorCount = Math.max(Math.round(doors), 2);
    const drawCount = Math.max(Math.round(drawers), 0);
    const plinthH = 14;
    const slideOffset = this.interactiveState.doorSlideOffset;

    const hasDrawers = drawCount > 0;
    const drawersH = hasDrawers ? Math.min(h * 0.34, Math.max(drawCount * 22, 50)) : 0;
    const doorH = h - plinthH - drawersH;
    const doorWidth = w / doorCount;

    let doorsHtml = '';
    for (let i = 0; i < doorCount; i++) {
      const doorX = x + (i * doorWidth) + (i % 2 === 1 ? slideOffset : 0);
      doorsHtml += `
        <!-- Eshik ${i + 1} -->
        <g class="sliding-door">
          <rect x="${doorX + 2}" y="${y + 2}" width="${doorWidth - 4}" height="${doorH - 4}" rx="4"
                fill="${color}" stroke="#1E1B18" stroke-width="2" />
          ${isWood ? `<rect x="${doorX + 2}" y="${y + 2}" width="${doorWidth - 4}" height="${doorH - 4}" fill="url(#wood-pattern)" />` : ''}
          <rect x="${doorX + 2}" y="${y + 2}" width="${doorWidth - 4}" height="${doorH - 4}" fill="url(#body-grad)" />
          
          <!-- Alyumin tutqich profili -->
          <line x1="${doorX + (i % 2 === 0 ? doorWidth - 8 : 8)}" y1="${y + doorH * 0.15}" 
                x2="${doorX + (i % 2 === 0 ? doorWidth - 8 : 8)}" y2="${y + doorH * 0.85}" 
                stroke="url(#metal-handle)" stroke-width="4.5" stroke-linecap="round" />
        </g>
      `;
    }

    // Ichki javonlar chiziqlari
    let internalShelvesHtml = '';
    const shelfCount = Math.round(shelves);
    for (let s = 1; s <= shelfCount; s++) {
      const shelfY = y + (s * (doorH / (shelfCount + 1)));
      internalShelvesHtml += `
        <line x1="${x + 6}" y1="${shelfY}" x2="${x + w - 6}" y2="${shelfY}" stroke="rgba(0,0,0,0.22)" stroke-width="2.5" stroke-dasharray="6 4" />
      `;
    }

    // Pastki Tortmalar Bloki
    let drawHtml = '';
    if (hasDrawers) {
      const drawerStartY = y + doorH;
      const useTwoCols = drawCount >= 4 && doorCount >= 3;
      const cols = useTwoCols ? 2 : 1;
      const rowsPerCol = Math.ceil(drawCount / cols);
      const colWidth = (w - (cols > 1 ? 6 : 0)) / cols;
      const rowHeight = (drawersH - 6) / rowsPerCol;

      for (let d = 0; d < drawCount; d++) {
        const colIdx = useTwoCols ? (d % 2) : 0;
        const rowIdx = useTwoCols ? Math.floor(d / 2) : d;
        const drawX = x + colIdx * (colWidth + 6);
        const drawY = drawerStartY + 3 + rowIdx * rowHeight;
        const isFirst = d === 0;

        drawHtml += `
          <g transform="translate(${isFirst ? this.interactiveState.drawerOpenOffset : 0}, 0)">
            <rect x="${drawX + 3}" y="${drawY + 2}" width="${colWidth - 6}" height="${rowHeight - 4}" rx="3" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
            ${isWood ? `<rect x="${drawX + 3}" y="${drawY + 2}" width="${colWidth - 6}" height="${rowHeight - 4}" fill="url(#wood-pattern)" />` : ''}
            <rect x="${drawX + 3}" y="${drawY + 2}" width="${colWidth - 6}" height="${rowHeight - 4}" fill="url(#body-grad)" />
            <line x1="${drawX + colWidth * 0.35}" y1="${drawY + rowHeight * 0.5}" x2="${drawX + colWidth * 0.65}" y2="${drawY + rowHeight * 0.5}" stroke="url(#metal-handle)" stroke-width="3.5" stroke-linecap="round" />
          </g>
        `;
      }
    }

    return `
      <!-- Shkaf Korpusi -->
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#2E2824" stroke="#181512" stroke-width="2.5" />
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${color}" fill-opacity="0.85" />
      ${isWood ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="url(#wood-pattern)" />` : ''}

      ${internalShelvesHtml}
      ${doorsHtml}

      <!-- Pastki va tepa relslar -->
      <rect x="${x}" y="${y}" width="${w}" height="4.5" fill="url(#metal-handle)" stroke="#222" stroke-width="0.5" />
      <rect x="${x}" y="${y + doorH - 4.5}" width="${w}" height="4.5" fill="url(#metal-handle)" stroke="#222" stroke-width="0.5" />
      ${hasDrawers ? `
        <rect x="${x + 2}" y="${y + doorH}" width="${w - 4}" height="${drawersH}" fill="#241E1A" stroke="#181512" stroke-width="1.5" />
        ${drawHtml}
      ` : ''}
      <rect x="${x + 4}" y="${y + h - plinthH}" width="${w - 8}" height="${plinthH}" fill="#1E1B18" stroke="#111" stroke-width="1" />
    `;
  }

  // 2. Oshxona garnituri
  drawKitchen(x, y, w, h, shelves, drawers, doors, color, isWood) {
    const lowerH = h * 0.42;
    const apronH = h * 0.22;
    const upperH = h * 0.36;
    const lowerY = y + upperH + apronH;
    const counterH = 9;
    const doorCount = Math.max(Math.round(doors), 2);
    const drawCount = Math.max(Math.round(drawers), 0);

    const topDoorCount = Math.max(Math.ceil(doorCount / 2), 2);
    const uW = w / topDoorCount;
    let upperHtml = '';
    for (let u = 0; u < topDoorCount; u++) {
      const uX = x + u * uW;
      upperHtml += `
        <rect x="${uX + 2}" y="${y + 2}" width="${uW - 4}" height="${upperH - 4}" rx="3" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
        ${isWood ? `<rect x="${uX + 2}" y="${y + 2}" width="${uW - 4}" height="${upperH - 4}" fill="url(#wood-pattern)" />` : ''}
        <rect x="${uX + 2}" y="${y + 2}" width="${uW - 4}" height="${upperH - 4}" fill="url(#body-grad)" />
        <circle cx="${uX + (u % 2 === 0 ? uW - 10 : 10)}" cy="${y + upperH - 18}" r="3.5" fill="url(#metal-handle)" stroke="#333" stroke-width="0.8" />
      `;
    }

    const lowDoorCount = Math.max(doorCount - topDoorCount, 1);
    const hasDrawers = drawCount > 0;
    const totalBottomModules = lowDoorCount + (hasDrawers ? 1 : 0);
    const modW = w / totalBottomModules;
    let lowerHtml = '';

    if (hasDrawers) {
      const dwX = x;
      const dH = (lowerH - counterH - 3) / drawCount;
      for (let d = 0; d < drawCount; d++) {
        const dY = lowerY + counterH + d * dH;
        lowerHtml += `
          <g transform="translate(${d === 0 ? this.interactiveState.drawerOpenOffset : 0}, 0)">
            <rect x="${dwX + 2}" y="${dY + 2}" width="${modW - 4}" height="${dH - 4}" rx="3" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
            ${isWood ? `<rect x="${dwX + 2}" y="${dY + 2}" width="${modW - 4}" height="${dH - 4}" fill="url(#wood-pattern)" />` : ''}
            <rect x="${dwX + 2}" y="${dY + 2}" width="${modW - 4}" height="${dH - 4}" fill="url(#body-grad)" />
            <line x1="${dwX + modW * 0.28}" y1="${dY + dH * 0.5}" x2="${dwX + modW * 0.72}" y2="${dY + dH * 0.5}" stroke="url(#metal-handle)" stroke-width="3.5" stroke-linecap="round" />
          </g>
        `;
      }
    }

    const doorStartMod = hasDrawers ? 1 : 0;
    for (let ld = 0; ld < lowDoorCount; ld++) {
      const ldx = x + (doorStartMod + ld) * modW;
      lowerHtml += `
        <rect x="${ldx + 2}" y="${lowerY + counterH + 2}" width="${modW - 4}" height="${lowerH - counterH - 4}" rx="3" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
        ${isWood ? `<rect x="${ldx + 2}" y="${lowerY + counterH + 2}" width="${modW - 4}" height="${lowerH - counterH - 4}" fill="url(#wood-pattern)" />` : ''}
        <rect x="${ldx + 2}" y="${lowerY + counterH + 2}" width="${modW - 4}" height="${lowerH - counterH - 4}" fill="url(#body-grad)" />
        <circle cx="${ldx + (ld % 2 === 0 ? modW - 12 : 12)}" cy="${lowerY + counterH + 25}" r="3.5" fill="url(#metal-handle)" stroke="#333" stroke-width="0.8" />
      `;
    }

    return `
      <!-- Fartuk (Plitka orqa fon) -->
      <rect x="${x}" y="${y + upperH}" width="${w}" height="${apronH}" fill="#EDE7DF" stroke="#D3CCC2" stroke-width="1.5" />
      <line x1="${x}" y1="${y + upperH + apronH / 2}" x2="${x + w}" y2="${y + upperH + apronH / 2}" stroke="#D3CCC2" stroke-dasharray="8 6" />

      <!-- Yuqori shkaflar -->
      <g>${upperHtml}</g>

      <!-- Stoleshnitsa -->
      <rect x="${x - 4}" y="${lowerY}" width="${w + 8}" height="${counterH}" rx="2" fill="#2E2824" stroke="#111" stroke-width="1.5" />

      <!-- Pastki bo'limlar -->
      <g>${lowerHtml}</g>
    `;
  }

  // 3. Tumba va Komod
  drawCabinet(x, y, w, h, shelves, drawers, doors, color, isWood) {
    const legH = 14;
    const bodyH = h - legH;
    const drawCount = Math.max(Math.round(drawers), 0);
    const doorCount = Math.max(Math.round(doors), 0);
    const openOffset = this.interactiveState.drawerOpenOffset;

    let content = '';
    if (doorCount > 0 && drawCount > 0) {
      const leftW = w * 0.52;
      const rightW = w - leftW;
      const dH = bodyH / drawCount;

      for (let i = 0; i < drawCount; i++) {
        const dY = y + i * dH;
        content += `
          <g transform="translate(${i === 0 ? openOffset : 0}, 0)">
            <rect x="${x + 3}" y="${dY + 3}" width="${leftW - 6}" height="${dH - 6}" rx="3" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
            ${isWood ? `<rect x="${x + 3}" y="${dY + 3}" width="${leftW - 6}" height="${dH - 6}" fill="url(#wood-pattern)" />` : ''}
            <rect x="${x + 3}" y="${dY + 3}" width="${leftW - 6}" height="${dH - 6}" fill="url(#body-grad)" />
            <line x1="${x + leftW * 0.3}" y1="${dY + dH * 0.5}" x2="${x + leftW * 0.7}" y2="${dY + dH * 0.5}" stroke="url(#metal-handle)" stroke-width="3.5" stroke-linecap="round" />
          </g>
        `;
      }

      const rDoorW = rightW / doorCount;
      for (let ed = 0; ed < doorCount; ed++) {
        const edx = x + leftW + ed * rDoorW;
        content += `
          <rect x="${edx + 3}" y="${y + 3}" width="${rDoorW - 6}" height="${bodyH - 6}" rx="3" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
          ${isWood ? `<rect x="${edx + 3}" y="${y + 3}" width="${rDoorW - 6}" height="${bodyH - 6}" fill="url(#wood-pattern)" />` : ''}
          <rect x="${edx + 3}" y="${y + 3}" width="${rDoorW - 6}" height="${bodyH - 6}" fill="url(#body-grad)" />
          <circle cx="${edx + (ed % 2 === 0 ? rDoorW - 12 : 12)}" cy="${y + bodyH * 0.4}" r="3.5" fill="url(#metal-handle)" stroke="#333" stroke-width="0.8" />
        `;
      }
    } else if (doorCount > 0 && drawCount === 0) {
      const edW = w / doorCount;
      for (let ed = 0; ed < doorCount; ed++) {
        const edx = x + ed * edW;
        content += `
          <rect x="${edx + 3}" y="${y + 3}" width="${edW - 6}" height="${bodyH - 6}" rx="4" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
          ${isWood ? `<rect x="${edx + 3}" y="${y + 3}" width="${edW - 6}" height="${bodyH - 6}" fill="url(#wood-pattern)" />` : ''}
          <rect x="${edx + 3}" y="${y + 3}" width="${edW - 6}" height="${bodyH - 6}" fill="url(#body-grad)" />
          <circle cx="${edx + (ed % 2 === 0 ? edW - 14 : 14)}" cy="${y + bodyH * 0.4}" r="3.5" fill="url(#metal-handle)" stroke="#333" stroke-width="0.8" />
        `;
      }
    } else {
      const actualDraws = Math.max(drawCount, 1);
      const dH = bodyH / actualDraws;
      for (let i = 0; i < actualDraws; i++) {
        const dY = y + i * dH;
        content += `
          <g transform="translate(${i === 0 ? openOffset : 0}, 0)">
            <rect x="${x + 3}" y="${dY + 3}" width="${w - 6}" height="${dH - 6}" rx="4" fill="${color}" stroke="#1E1B18" stroke-width="1.8" />
            ${isWood ? `<rect x="${x + 3}" y="${dY + 3}" width="${w - 6}" height="${dH - 6}" fill="url(#wood-pattern)" />` : ''}
            <rect x="${x + 3}" y="${dY + 3}" width="${w - 6}" height="${dH - 6}" fill="url(#body-grad)" />
            <line x1="${x + w * 0.38}" y1="${dY + dH * 0.5}" x2="${x + w * 0.62}" y2="${dY + dH * 0.5}" stroke="url(#metal-handle)" stroke-width="4" stroke-linecap="round" />
          </g>
        `;
      }
    }

    return `
      <rect x="${x}" y="${y}" width="${w}" height="${bodyH}" rx="6" fill="#2E2824" stroke="#1E1B18" stroke-width="2.5" />
      ${content}

      <line x1="${x + 12}" y1="${y + bodyH}" x2="${x + 8}" y2="${y + h}" stroke="url(#metal-handle)" stroke-width="5.5" stroke-linecap="round" />
      <line x1="${x + w - 12}" y1="${y + bodyH}" x2="${x + w - 8}" y2="${y + h}" stroke="url(#metal-handle)" stroke-width="5.5" stroke-linecap="round" />
    `;
  }

  // 4. Stol
  drawTable(x, y, w, h, drawers, color, isWood) {
    const topH = 16;
    const legW = 14;
    const apronH = 22;
    const hasDrawer = Math.round(drawers) > 0;
    const openOffset = this.interactiveState.drawerOpenOffset;

    let drawerHtml = '';
    if (hasDrawer) {
      drawerHtml = `
        <g transform="translate(${openOffset}, 0)">
          <rect x="${x + w * 0.35}" y="${y + topH + 2}" width="${w * 0.3}" height="${apronH - 4}" rx="2" fill="${color}" stroke="#1E1B18" stroke-width="1.5" />
          <circle cx="${x + w * 0.5}" cy="${y + topH + apronH * 0.5}" r="3.5" fill="url(#metal-handle)" stroke="#333" stroke-width="0.8" />
        </g>
      `;
    }

    return `
      <rect x="${x + legW}" y="${y + topH}" width="${w - legW * 2}" height="${apronH}" fill="#2E2824" stroke="#1E1B18" stroke-width="1.5" />
      ${drawerHtml}

      <rect x="${x + 6}" y="${y + topH}" width="${legW}" height="${h - topH}" rx="2" fill="${color}" stroke="#1E1B18" stroke-width="2" />
      <rect x="${x + w - legW - 6}" y="${y + topH}" width="${legW}" height="${h - topH}" rx="2" fill="${color}" stroke="#1E1B18" stroke-width="2" />
      ${isWood ? `
        <rect x="${x + 6}" y="${y + topH}" width="${legW}" height="${h - topH}" fill="url(#wood-pattern)" />
        <rect x="${x + w - legW - 6}" y="${y + topH}" width="${legW}" height="${h - topH}" fill="url(#wood-pattern)" />
      ` : ''}

      <rect x="${x}" y="${y}" width="${w}" height="${topH}" rx="4" fill="${color}" stroke="#1E1B18" stroke-width="2.5" />
      ${isWood ? `<rect x="${x}" y="${y}" width="${w}" height="${topH}" rx="4" fill="url(#wood-pattern)" />` : ''}
      <rect x="${x}" y="${y}" width="${w}" height="${topH}" rx="4" fill="url(#body-grad)" />
    `;
  }

  // 5. Krovat
  drawBed(x, y, w, h, drawers, color, isWood) {
    const headboardH = h * 0.65;
    const mattressH = 26;
    const frameH = 24;
    const legH = 14;

    const frameY = y + h - legH - frameH;
    const mattressY = frameY - mattressH;

    return `
      <!-- Bosh qismi -->
      <rect x="${x + 4}" y="${y}" width="${w - 8}" height="${headboardH}" rx="8" fill="${color}" stroke="#1E1B18" stroke-width="2.5" />
      ${isWood ? `<rect x="${x + 4}" y="${y}" width="${w - 8}" height="${headboardH}" fill="url(#wood-pattern)" />` : ''}
      <rect x="${x + 4}" y="${y}" width="${w - 8}" height="${headboardH}" fill="url(#body-grad)" />
      
      <line x1="${x + w * 0.25}" y1="${y + 10}" x2="${x + w * 0.25}" y2="${y + headboardH - 10}" stroke="rgba(0,0,0,0.18)" stroke-width="2" />
      <line x1="${x + w * 0.5}" y1="${y + 10}" x2="${x + w * 0.5}" y2="${y + headboardH - 10}" stroke="rgba(0,0,0,0.18)" stroke-width="2" />
      <line x1="${x + w * 0.75}" y1="${y + 10}" x2="${x + w * 0.75}" y2="${y + headboardH - 10}" stroke="rgba(0,0,0,0.18)" stroke-width="2" />

      <!-- Matras -->
      <rect x="${x + 10}" y="${mattressY}" width="${w - 20}" height="${mattressH}" rx="6" fill="#F4EFEB" stroke="#B8AFA5" stroke-width="2" />
      <line x1="${x + 15}" y1="${mattressY + 12}" x2="${x + w - 15}" y2="${mattressY + 12}" stroke="#D1C7BA" stroke-width="1.5" />

      <!-- Karkas -->
      <rect x="${x}" y="${frameY}" width="${w}" height="${frameH}" rx="4" fill="${color}" stroke="#1E1B18" stroke-width="2.2" />
      ${isWood ? `<rect x="${x}" y="${frameY}" width="${w}" height="${frameH}" fill="url(#wood-pattern)" />` : ''}

      <!-- Oyoqlar -->
      <rect x="${x + 10}" y="${y + h - legH}" width="14" height="${legH}" rx="2" fill="#1E1B18" />
      <rect x="${x + w - 24}" y="${y + h - legH}" width="14" height="${legH}" rx="2" fill="#1E1B18" />
    `;
  }

  // 6. Ofis mebeli
  drawOfficeDesk(x, y, w, h, shelves, drawers, doors, color, isWood) {
    const deskW = w * 0.65;
    const cabinetW = w * 0.35;
    const topH = 15;

    return `
      <!-- Stol yuzasi -->
      <rect x="${x}" y="${y}" width="${deskW}" height="${topH}" rx="3" fill="${color}" stroke="#1E1B18" stroke-width="2.5" />
      ${isWood ? `<rect x="${x}" y="${y}" width="${deskW}" height="${topH}" fill="url(#wood-pattern)" />` : ''}
      <rect x="${x}" y="${y}" width="${deskW}" height="${topH}" fill="url(#body-grad)" />

      <!-- Chap panel -->
      <rect x="${x + 4}" y="${y + topH}" width="16" height="${h - topH}" fill="${color}" stroke="#1E1B18" stroke-width="2" />
      ${isWood ? `<rect x="${x + 4}" y="${y + topH}" width="16" height="${h - topH}" fill="url(#wood-pattern)" />` : ''}

      <!-- Tumba / Javon -->
      <g transform="translate(${x + deskW - 8}, 0)">
        <rect x="0" y="${y + 10}" width="${cabinetW + 8}" height="${h - 10}" rx="4" fill="#2E2824" stroke="#1E1B18" stroke-width="2.5" />
        
        <!-- Tortma 1 -->
        <rect x="3" y="${y + 14}" width="${cabinetW + 2}" height="${(h - 20) * 0.3}" rx="2" fill="${color}" stroke="#1E1B18" stroke-width="1.5" />
        <line x1="${cabinetW * 0.35}" y1="${y + 14 + (h - 20) * 0.15}" x2="${cabinetW * 0.65}" y2="${y + 14 + (h - 20) * 0.15}" stroke="url(#metal-handle)" stroke-width="3.5" stroke-linecap="round" />

        <!-- Tortma 2 -->
        <rect x="3" y="${y + 18 + (h - 20) * 0.3}" width="${cabinetW + 2}" height="${(h - 20) * 0.3}" rx="2" fill="${color}" stroke="#1E1B18" stroke-width="1.5" />
        <line x1="${cabinetW * 0.35}" y1="${y + 18 + (h - 20) * 0.45}" x2="${cabinetW * 0.65}" y2="${y + 18 + (h - 20) * 0.45}" stroke="url(#metal-handle)" stroke-width="3.5" stroke-linecap="round" />

        <!-- Pastki javon -->
        <rect x="3" y="${y + 22 + (h - 20) * 0.6}" width="${cabinetW + 2}" height="${(h - 20) * 0.36}" rx="2" fill="${color}" stroke="#1E1B18" stroke-width="1.5" />
        <circle cx="${cabinetW - 8}" cy="${y + 22 + (h - 20) * 0.78}" r="3.5" fill="url(#metal-handle)" stroke="#333" stroke-width="0.8" />
      </g>
    `;
  }

  // O'lchov chiziqlari (Width va Height strelkalari va matnlar)
  drawDimensionLines(x, y, w, h, widthCm, heightCm) {
    const bottomLineY = y + h + 24;
    const leftLineX = Math.max(x - 24, 20);

    return `
      <!-- Eni o'lchov chizig'i (pastda) -->
      <g class="dim-line">
        <line x1="${x}" y1="${y + h + 4}" x2="${x}" y2="${bottomLineY + 6}" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="3 3" />
        <line x1="${x + w}" y1="${y + h + 4}" x2="${x + w}" y2="${bottomLineY + 6}" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="3 3" />
        
        <line x1="${x + 6}" y1="${bottomLineY}" x2="${x + w - 6}" y2="${bottomLineY}" 
              stroke="#D97706" stroke-width="2" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
        
        <rect x="${x + w / 2 - 34}" y="${bottomLineY - 10}" width="68" height="20" rx="4" fill="var(--blueprint-bg)" stroke="#D97706" stroke-width="0.8" />
        <text x="${x + w / 2}" y="${bottomLineY + 4}" font-family="var(--font-mono)" font-size="12" font-weight="800" 
              fill="#D97706" text-anchor="middle">${widthCm} sm</text>
      </g>

      <!-- Bo'yi o'lchov chizig'i (chapda) -->
      <g class="dim-line">
        <line x1="${x - 4}" y1="${y}" x2="${leftLineX - 6}" y2="${y}" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="3 3" />
        <line x1="${x - 4}" y1="${y + h}" x2="${leftLineX - 6}" y2="${y + h}" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="3 3" />
        
        <line x1="${leftLineX}" y1="${y + 6}" x2="${leftLineX}" y2="${y + h - 6}" 
              stroke="#D97706" stroke-width="2" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
        
        <rect x="${leftLineX - 10}" y="${y + h / 2 - 28}" width="20" height="56" rx="4" fill="var(--blueprint-bg)" stroke="#D97706" stroke-width="0.8" />
        <text x="${leftLineX + 4}" y="${y + h / 2}" font-family="var(--font-mono)" font-size="12" font-weight="800" 
              fill="#D97706" text-anchor="middle" transform="rotate(-90 ${leftLineX + 4} ${y + h / 2})">${heightCm} sm</text>
      </g>
    `;
  }
}

export function createVisualizer(svgElement) {
  return new FurnitureVisualizer(svgElement);
}
