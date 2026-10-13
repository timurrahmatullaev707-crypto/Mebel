/**
 * MebelPro Studio (studio.js)
 * 1. 3D Interaktiv Xona va Ergonomika Simulyatori (3D Studio)
 * 2. Aqlli Mebel Raskroyi va Detallar Spetsifikatsiyasi (Cutting Optimizer & BOM)
 */

(function () {
  'use strict';

  // Standart DSP plita o'lchamlari (Kronospan/Kastamonu: 2800 x 2070 mm)
  const SHEET_W = 2800; // mm
  const SHEET_H = 2070; // mm
  const SAW_KERF = 4;   // pichoq qirqish qalinligi mm

  // Studio holati
  const studioState = {
    mode: '2d', // '2d' | '3d' | 'raskroy'
    activeSheetIndex: 0,
    doorsOpen: false,
    drawersOpen: false,
    ledLight: true,
    showHuman: true,
    isNightMode: false,
    roomWallColor: '#ede7df',
    roomFloorType: 'oak', // 'oak' | 'walnut' | 'marble'
    // 3D kamera burchaklari
    yaw: -0.65,      // gorizontal aylanish
    pitch: 0.32,     // vertikal burchak
    zoom: 1.0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    doorAnimProgress: 0, // 0..1
    animating: false
  };

  class MebelProStudio {
    constructor() {
      this.initElements();
      this.bindEvents();
      this.currentData = null;
    }

    initElements() {
      // Tab tugmalari
      this.tabs = document.querySelectorAll('.studio-tab-btn');
      this.view2D = document.getElementById('view-container-2d');
      this.view3D = document.getElementById('view-container-3d');
      this.viewRaskroy = document.getElementById('view-container-raskroy');

      // 3D Canvas (Asosiy kalkulyator kartasida)
      this.canvas3D = document.getElementById('canvas-3d-room');
      this.ctx3D = this.canvas3D ? this.canvas3D.getContext('2d') : null;

      // 3D Canvas (Katta ekranli modalda)
      this.canvasModal = document.getElementById('canvas-3d-modal');
      this.ctxModal = this.canvasModal ? this.canvasModal.getContext('2d') : null;

      // Fullscreen Modal
      this.modal = document.getElementById('studio-modal');
      this.openModalBtn = document.getElementById('open-full-studio-btn');
      this.closeModalBtn = document.getElementById('close-studio-modal');

      // Modal info elementlari
      this.modalTitle = document.getElementById('modal-furniture-title');
      this.modalDims = document.getElementById('modal-furniture-dims-info');
      this.modalPrice = document.getElementById('modal-furniture-price-info');

      // Raskroy elementlari
      this.raskroyCanvas = document.getElementById('sheet-canvas');
      this.raskroyCtx = this.raskroyCanvas ? this.raskroyCanvas.getContext('2d') : null;
      this.sheetTabsContainer = document.getElementById('sheet-tabs-list');
      this.bomTableBody = document.getElementById('bom-table-tbody');

      // Metrikalar
      this.statSheets = document.getElementById('raskroy-stat-sheets');
      this.statEfficiency = document.getElementById('raskroy-stat-efficiency');
      this.statWaste = document.getElementById('raskroy-stat-waste');
      this.statEdge = document.getElementById('raskroy-stat-edge');

      // 3D boshqaruv tugmalari
      this.btnToggleDoors = document.getElementById('btn-toggle-doors-3d');
      this.btnToggleLed = document.getElementById('btn-toggle-led-3d');
      this.btnToggleHuman = document.getElementById('btn-toggle-human-3d');
      this.btnResetCamera = document.getElementById('btn-reset-cam-3d');
      this.btnPrintNaryad = document.getElementById('btn-print-naryad');
      this.btnExportSnapshot = document.getElementById('btn-export-snapshot');
      this.btnToggleNight = document.getElementById('btn-toggle-night');
      this.camPills = document.querySelectorAll('.cam-pill');
    }

    bindEvents() {
      // Rejim tablari almashinuvi
      this.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.vmode;
          this.switchMode(mode);
        });
      });

      // Fullscreen modalni ochish/yopish
      if (this.openModalBtn) {
        this.openModalBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openModal();
        });
      }
      if (this.closeModalBtn) {
        this.closeModalBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeModal();
        });
      }
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) this.closeModal();
        });
      }

      // ESC tugmasi bilan modalni yopish
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
          this.closeModal();
        }
      });

      // 3D Canvas boshqaruvi (Asosiy sahifada)
      if (this.canvas3D) {
        this.attachOrbitControls(this.canvas3D);
      }

      // 3D Canvas boshqaruvi (Katta modalda)
      if (this.canvasModal) {
        this.attachOrbitControls(this.canvasModal);
      }

      // Eshiklarni ochish/yopish tugmasi
      if (this.btnToggleDoors) {
        this.btnToggleDoors.addEventListener('click', () => this.toggleDoors());
      }

      // LED chiroqlarni yoqish/o'chirish
      if (this.btnToggleLed) {
        this.btnToggleLed.addEventListener('click', () => this.toggleLed());
      }

      // Inson siluetini yoqish/o'chirish
      if (this.btnToggleHuman) {
        this.btnToggleHuman.addEventListener('click', () => this.toggleHuman());
      }

      // Kamerani dastlabki holatga qaytarish
      if (this.btnResetCamera) {
        this.btnResetCamera.addEventListener('click', () => this.resetCamera());
      }

      // HD Rasm yuklab olish
      if (this.btnExportSnapshot) {
        this.btnExportSnapshot.addEventListener('click', () => this.exportSnapshot());
      }

      // Tun / Kun yorug'lik rejimi
      if (this.btnToggleNight) {
        this.btnToggleNight.addEventListener('click', () => this.toggleNightMode());
      }

      // Kamera burchaklari (Oldi, 3D Izometriya, Plan)
      this.camPills.forEach(pill => {
        pill.addEventListener('click', () => {
          const cam = pill.dataset.cam;
          this.setCameraView(cam);
        });
      });

      // Ustaxona Naryadini chop etish
      if (this.btnPrintNaryad) {
        this.btnPrintNaryad.addEventListener('click', () => this.printProductionSheet());
      }

      // Modal ichidagi devor va pol ranglarini o'zgartirish
      document.querySelectorAll('.studio-wall-pick').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.studio-wall-pick').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          studioState.roomWallColor = btn.dataset.wallColor;
          this.renderAll3D();
        });
      });

      document.querySelectorAll('.studio-floor-pick').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.studio-floor-pick').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          studioState.roomFloorType = btn.dataset.floorType;
          this.renderAll3D();
        });
      });

      // Oyna o'lchami o'zgarganda qayta chizish
      window.addEventListener('resize', () => {
        if (studioState.mode === '3d') this.resize3DCanvas();
        if (this.modal && this.modal.classList.contains('active')) this.resizeModalCanvas();
        if (studioState.mode === 'raskroy') this.renderRaskroy();
      });
    }

    attachOrbitControls(canvas) {
      canvas.addEventListener('mousedown', (e) => {
        studioState.isDragging = true;
        studioState.lastMouseX = e.clientX;
        studioState.lastMouseY = e.clientY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!studioState.isDragging) return;
        const dx = e.clientX - studioState.lastMouseX;
        const dy = e.clientY - studioState.lastMouseY;
        studioState.lastMouseX = e.clientX;
        studioState.lastMouseY = e.clientY;

        studioState.yaw += dx * 0.007;
        studioState.pitch += dy * 0.007;
        studioState.pitch = Math.max(-0.25, Math.min(1.2, studioState.pitch));
        this.renderAll3D();
      });

      window.addEventListener('mouseup', () => {
        studioState.isDragging = false;
      });

      // Sensorli ekranlar (Smartfon/Planshet)
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          studioState.isDragging = true;
          studioState.lastMouseX = e.touches[0].clientX;
          studioState.lastMouseY = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (studioState.isDragging && e.touches.length === 1) {
          const dx = e.touches[0].clientX - studioState.lastMouseX;
          const dy = e.touches[0].clientY - studioState.lastMouseY;
          studioState.lastMouseX = e.touches[0].clientX;
          studioState.lastMouseY = e.touches[0].clientY;

          studioState.yaw += dx * 0.008;
          studioState.pitch += dy * 0.008;
          studioState.pitch = Math.max(-0.2, Math.min(1.2, studioState.pitch));
          this.renderAll3D();
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        studioState.isDragging = false;
      });

      // Zoom (Wheel)
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        studioState.zoom += e.deltaY * -0.001;
        studioState.zoom = Math.max(0.65, Math.min(1.6, studioState.zoom));
        this.renderAll3D();
      }, { passive: false });
    }

    // Rejimni almashtirish (2D / 3D / Raskroy)
    switchMode(mode) {
      studioState.mode = mode;

      this.tabs.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.vmode === mode);
      });

      if (this.view2D) this.view2D.classList.toggle('active', mode === '2d');
      if (this.view3D) this.view3D.classList.toggle('active', mode === '3d');
      if (this.viewRaskroy) this.viewRaskroy.classList.toggle('active', mode === 'raskroy');

      if (mode === '3d') {
        this.resize3DCanvas();
        this.render3D(this.canvas3D, this.ctx3D);
      } else if (mode === 'raskroy') {
        this.updateRaskroyData();
      }
    }

    // Fullscreen Modalni ochish
    openModal() {
      if (!this.modal) this.modal = document.getElementById('studio-modal');
      if (!this.modal) return;

      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Ma'lumotlarni yangilash
      this.updateModalInfo();

      // Canvasni o'lchamga moslab chizish
      setTimeout(() => {
        this.resizeModalCanvas();
        this.render3D(this.canvasModal, this.ctxModal);
      }, 50);
    }

    // Fullscreen Modalni yopish
    closeModal() {
      if (!this.modal) this.modal = document.getElementById('studio-modal');
      if (!this.modal) return;

      this.modal.classList.remove('active');
      document.body.style.overflow = '';

      if (studioState.mode === '3d') {
        this.resize3DCanvas();
        this.render3D(this.canvas3D, this.ctx3D);
      }
    }

    updateModalInfo() {
      const d = this.currentData || {
        type: 'shkaf',
        width: 200,
        height: 240,
        depth: 60
      };

      const typeNames = {
        shkaf: 'Shkaf-kupe',
        oshxona: 'Oshxona garnituri',
        tumba: 'Tumba va Komod',
        stol: 'Zamonaviy Stol',
        krovat: 'Krovat va Yotoqxona',
        ofis: 'Ofis mebeli'
      };

      if (!this.modalTitle) this.modalTitle = document.getElementById('modal-furniture-title');
      if (!this.modalDims) this.modalDims = document.getElementById('modal-furniture-dims-info');
      if (!this.modalPrice) this.modalPrice = document.getElementById('modal-furniture-price-info');

      if (this.modalTitle) this.modalTitle.textContent = typeNames[d.type] || 'Maxsus Mebel';
      if (this.modalDims) this.modalDims.textContent = `${d.width} × ${d.height} × ${d.depth} sm`;

      const priceVal = document.getElementById('big-price-value');
      if (this.modalPrice && priceVal) {
        this.modalPrice.textContent = priceVal.textContent || '0 so\'m';
      }
    }

    // Eshiklarni ochish/yopish animatsiyasi
    toggleDoors() {
      const target = studioState.doorsOpen ? 0 : 1;
      studioState.doorsOpen = !studioState.doorsOpen;

      document.querySelectorAll('#btn-toggle-doors-3d, #modal-btn-doors').forEach(btn => {
        btn.classList.toggle('active', studioState.doorsOpen);
      });

      const start = studioState.doorAnimProgress;
      const startTime = performance.now();
      const duration = 380; // ms

      const animate = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        studioState.doorAnimProgress = start + (target - start) * ease;

        this.renderAll3D();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          studioState.doorAnimProgress = target;
          this.renderAll3D();
        }
      };

      requestAnimationFrame(animate);
    }

    toggleLed() {
      studioState.ledLight = !studioState.ledLight;
      document.querySelectorAll('#btn-toggle-led-3d, #modal-btn-led').forEach(btn => {
        btn.classList.toggle('active', studioState.ledLight);
      });
      this.renderAll3D();
    }

    toggleHuman() {
      studioState.showHuman = !studioState.showHuman;
      document.querySelectorAll('#btn-toggle-human-3d, #modal-btn-human').forEach(btn => {
        btn.classList.toggle('active', studioState.showHuman);
      });
      this.renderAll3D();
    }

    resetCamera() {
      this.setCameraView('iso');
    }

    setCameraView(view) {
      if (view === 'front') {
        studioState.yaw = 0;
        studioState.pitch = 0.04;
      } else if (view === 'top') {
        studioState.yaw = 0;
        studioState.pitch = 1.34;
      } else { // 'iso'
        studioState.yaw = -0.65;
        studioState.pitch = 0.32;
      }
      studioState.zoom = 1.0;
      document.querySelectorAll('.cam-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.cam === view);
      });
      this.renderAll3D();
    }

    toggleNightMode() {
      studioState.isNightMode = !studioState.isNightMode;
      const btn = document.getElementById('btn-toggle-night');
      if (btn) {
        btn.classList.toggle('active', studioState.isNightMode);
        btn.title = studioState.isNightMode ? "Kunduzgi yorug'likka qaytish" : "Tungi yorug'lik va LED muhit";
      }
      this.renderAll3D();
    }

    // HD 3D Rasm eksport qilish (Branded Watermark & Specifications)
    exportSnapshot() {
      const activeCanvas = (this.modal && this.modal.classList.contains('active') && this.canvasModal) 
        ? this.canvasModal 
        : this.canvas3D;
      if (!activeCanvas) return;

      const expCanvas = document.createElement('canvas');
      expCanvas.width = 1280;
      expCanvas.height = 920;
      const expCtx = expCanvas.getContext('2d');

      // Lux fon gradienti
      const bgGrad = expCtx.createLinearGradient(0, 0, 1280, 920);
      if (studioState.isNightMode) {
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(1, '#111726');
      } else {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
      }
      expCtx.fillStyle = bgGrad;
      expCtx.fillRect(0, 0, 1280, 920);

      // 3D Canvas rasmini markazga chizish
      expCtx.save();
      expCtx.shadowColor = 'rgba(0,0,0,0.55)';
      expCtx.shadowBlur = 35;
      expCtx.shadowOffsetY = 15;
      expCtx.drawImage(activeCanvas, 64, 90, 1152, 700);
      expCtx.restore();

      // Yuqori Header
      expCtx.fillStyle = '#ffffff';
      expCtx.font = 'bold 28px Inter, sans-serif';
      expCtx.fillText('MebelPro 3D Studio', 64, 58);

      expCtx.fillStyle = '#f59e0b';
      expCtx.font = 'bold 16px Inter, sans-serif';
      expCtx.fillText('3-IN-1 PROFESSIONAL MEBEL PLATFORMASI', 370, 56);

      const d = this.currentData || { type: 'shkaf', width: 200, height: 240, depth: 60 };
      const typeNames = {
        shkaf: 'Shkaf-kupe (Garderob)',
        oshxona: 'Zamonaviy Oshxona Garnituri',
        tumba: 'TV Tumba va Komod',
        stol: 'Zamonaviy Smart Stol',
        krovat: 'Ortopedik Krovat & Yotoqxona',
        ofis: 'Rahbar Ofis Mebeli'
      };
      const furnName = typeNames[d.type] || 'Maxsus Mebel';
      const priceText = document.getElementById('big-price-value')?.textContent || '';

      // Pastki spetsifikatsiya paneli
      expCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      expCtx.fillRect(0, 815, 1280, 105);

      expCtx.fillStyle = '#f8fafc';
      expCtx.font = 'bold 22px Inter, sans-serif';
      expCtx.fillText(`${furnName} — ${d.width} × ${d.height} × ${d.depth} sm`, 64, 856);

      expCtx.fillStyle = '#94a3b8';
      expCtx.font = '14px Inter, sans-serif';
      expCtx.fillText(`3D Render sanasi: ${new Date().toLocaleDateString('uz-UZ')} | Rasmiy kafolat: 2 yil | mebelpro.uz`, 64, 888);

      if (priceText) {
        expCtx.textAlign = 'right';
        expCtx.fillStyle = '#10b981';
        expCtx.font = 'bold 26px JetBrains Mono, monospace';
        expCtx.fillText(`Narx: ${priceText}`, 1216, 860);
      }

      // Yuklab olish triggeri
      const link = document.createElement('a');
      link.download = `mebelpro-${d.type || '3d'}-${Date.now()}.png`;
      link.href = expCanvas.toDataURL('image/png');
      link.click();
    }

    // Ergonomika va xona ko'rsatkichlarini yangilash
    updateErgonomicsInfo(data) {
      const d = data || this.currentData || { width: 200, height: 240, depth: 60 };
      const w = Number(d.width) || 200;
      const h = Number(d.height) || 240;
      const dp = Number(d.depth) || 60;

      const ceilEl = document.getElementById('ergo-ceiling-rem');
      const footEl = document.getElementById('ergo-footprint');
      const volEl = document.getElementById('ergo-volume');
      const passEl = document.getElementById('ergo-pass-status');

      const ceilRem = Math.max(0, 270 - h);
      if (ceilEl) {
        ceilEl.textContent = `${ceilRem} sm ${ceilRem <= 10 ? '(Shiftgacha to\'liq)' : ''}`;
      }

      const footprint = (w * dp / 10000).toFixed(2);
      if (footEl) footEl.textContent = `${footprint} m²`;

      const volume = (w * h * dp / 1000000).toFixed(2);
      if (volEl) volEl.textContent = `${volume} m³`;

      if (passEl) {
        if (w > 280 || dp > 85) {
          passEl.textContent = "Katta hajm (Keng xona tavsiya)";
          passEl.className = 'ergo-m-val ergo-warn';
        } else {
          passEl.textContent = "A'lo darajada (O'tish qulay)";
          passEl.className = 'ergo-m-val ergo-pass';
        }
      }
    }

    // Ikkala 3D canvasni ham qayta chizish
    renderAll3D() {
      if (this.canvas3D && this.ctx3D && studioState.mode === '3d') {
        this.render3D(this.canvas3D, this.ctx3D);
      }
      if (this.modal && this.modal.classList.contains('active') && this.canvasModal && this.ctxModal) {
        this.render3D(this.canvasModal, this.ctxModal);
      }
    }

    // Kalkulyatordan yangilangan mebel parametrlarini qabul qilish
    updateData(data) {
      this.currentData = { ...data };
      this.updateModalInfo();
      this.updateErgonomicsInfo(this.currentData);

      if (studioState.mode === '3d') {
        this.render3D(this.canvas3D, this.ctx3D);
      } else if (studioState.mode === 'raskroy') {
        this.updateRaskroyData();
      }

      if (this.modal && this.modal.classList.contains('active')) {
        this.render3D(this.canvasModal, this.ctxModal);
      }
    }

    /* ========================================================================
       3D PROJECTION & RENDERING ENGINE
       ======================================================================== */
    resize3DCanvas() {
      if (!this.canvas3D) return;
      const rect = this.canvas3D.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas3D.width = rect.width * dpr;
      this.canvas3D.height = rect.height * dpr;
      if (this.ctx3D) this.ctx3D.resetTransform && this.ctx3D.resetTransform();
      if (this.ctx3D) this.ctx3D.scale(dpr, dpr);
      this.canvas3D._w = rect.width;
      this.canvas3D._h = rect.height;
    }

    resizeModalCanvas() {
      if (!this.canvasModal) this.canvasModal = document.getElementById('canvas-3d-modal');
      if (!this.canvasModal) return;
      this.ctxModal = this.canvasModal.getContext('2d');

      const rect = this.canvasModal.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvasModal.width = rect.width * dpr;
      this.canvasModal.height = rect.height * dpr;
      if (this.ctxModal && this.ctxModal.resetTransform) this.ctxModal.resetTransform();
      if (this.ctxModal) this.ctxModal.scale(dpr, dpr);
      this.canvasModal._w = rect.width;
      this.canvasModal._h = rect.height;
    }

    render3D(canvas, ctx) {
      if (!canvas || !ctx) return;
      const w = canvas._w || canvas.parentElement.getBoundingClientRect().width;
      const h = canvas._h || canvas.parentElement.getBoundingClientRect().height;

      if (!w || !h) return;

      ctx.clearRect(0, 0, w, h);

      const d = this.currentData || {
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

      const cx = w * 0.5;
      const cy = h * 0.62;
      const baseScale = Math.min(w / 380, h / 360) * 0.95 * studioState.zoom;

      const project = (x, y, z) => {
        const cosY = Math.cos(studioState.yaw);
        const sinY = Math.sin(studioState.yaw);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        const cosP = Math.cos(studioState.pitch);
        const sinP = Math.sin(studioState.pitch);
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;

        const cameraDist = 800;
        const fov = cameraDist / (cameraDist + z2);

        return {
          px: cx + x1 * baseScale * fov,
          py: cy - y2 * baseScale * fov,
          depth: z2
        };
      };

      this.render3DRoom(ctx, project, w, h);
      this.render3DShadow(ctx, project, d);
      this.render3DFurniture(ctx, project, d);

      if (studioState.showHuman) {
        this.render3DHumanScale(ctx, project, d);
      }

      if (studioState.ledLight) {
        this.render3DLedGlow(ctx, project, d);
      }

      this.render3DDimensions(ctx, project, d);
    }

    render3DRoom(ctx, project, w, h) {
      ctx.save();
      const floorP1 = project(-320, 0, -180);
      const floorP2 = project(320, 0, -180);
      const floorP3 = project(320, 0, 220);
      const floorP4 = project(-320, 0, 220);

      ctx.beginPath();
      ctx.moveTo(floorP1.px, floorP1.py);
      ctx.lineTo(floorP2.px, floorP2.py);
      ctx.lineTo(floorP3.px, floorP3.py);
      ctx.lineTo(floorP4.px, floorP4.py);
      ctx.closePath();

      if (studioState.isNightMode) {
        if (studioState.roomFloorType === 'walnut') {
          ctx.fillStyle = '#1c1510';
        } else if (studioState.roomFloorType === 'marble') {
          ctx.fillStyle = '#222932';
        } else {
          ctx.fillStyle = '#282017';
        }
      } else {
        if (studioState.roomFloorType === 'walnut') {
          ctx.fillStyle = '#3a2b21';
        } else if (studioState.roomFloorType === 'marble') {
          ctx.fillStyle = '#e8ecf0';
        } else {
          ctx.fillStyle = '#dfcbb5'; // Oak laminat
        }
      }
      ctx.fill();

      // Pol taxtalari chiziqlari
      ctx.strokeStyle = studioState.isNightMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = 1;
      for (let z = -160; z <= 200; z += 40) {
        const l1 = project(-300, 0, z);
        const l2 = project(300, 0, z);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      }
      for (let x = -280; x <= 280; x += 50) {
        const l1 = project(x, 0, -180);
        const l2 = project(x, 0, 220);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      }

      // Xona devori
      const wallH = 300;
      const wallP1 = project(-320, wallH, -180);
      const wallP2 = project(320, wallH, -180);

      ctx.beginPath();
      ctx.moveTo(floorP1.px, floorP1.py);
      ctx.lineTo(floorP2.px, floorP2.py);
      ctx.lineTo(wallP2.px, wallP2.py);
      ctx.lineTo(wallP1.px, wallP1.py);
      ctx.closePath();

      ctx.fillStyle = studioState.isNightMode ? '#10141f' : studioState.roomWallColor;
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(floorP1.px, floorP1.py);
      ctx.lineTo(floorP2.px, floorP2.py);
      ctx.stroke();

      ctx.restore();
    }

    render3DShadow(ctx, project, d) {
      const mw = d.width * 0.8;
      const md = d.depth * 0.8;

      ctx.save();
      const s1 = project(-mw / 2, 0, -md / 2);
      const s2 = project(mw / 2, 0, -md / 2);
      const s3 = project(mw / 2, 0, md / 2);
      const s4 = project(-mw / 2, 0, md / 2);

      ctx.beginPath();
      ctx.moveTo(s1.px, s1.py);
      ctx.lineTo(s2.px, s2.py);
      ctx.lineTo(s3.px, s3.py);
      ctx.lineTo(s4.px, s4.py);
      ctx.closePath();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.filter = 'blur(8px)';
      ctx.fill();
      ctx.restore();
    }

    render3DFurniture(ctx, project, d) {
      const type = d.type || 'shkaf';

      // Poligon chizish
      const drawPoly = (points, fillColor, strokeColor = 'rgba(0,0,0,0.15)', lineWidth = 1) => {
        ctx.beginPath();
        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        });
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // 3D Cuboid (quti) chizish - orqa yuzlarni o'tkazib yuborish & yorug'lik hisobi bilan
      const drawBox = (x1, y1, z1, x2, y2, z2, baseHex, options = {}) => {
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);

        const p000 = project(minX, minY, minZ);
        const p100 = project(maxX, minY, minZ);
        const p110 = project(maxX, maxY, minZ);
        const p010 = project(minX, maxY, minZ);
        const p001 = project(minX, minY, maxZ);
        const p101 = project(maxX, minY, maxZ);
        const p111 = project(maxX, maxY, maxZ);
        const p011 = project(minX, maxY, maxZ);

        const cTop = options.topColor || this.adjustColor(baseHex, 26);
        const cFront = options.frontColor || this.adjustColor(baseHex, 4);
        const cBack = options.backColor || this.adjustColor(baseHex, -32);
        const cLeft = options.leftColor || this.adjustColor(baseHex, -14);
        const cRight = options.rightColor || this.adjustColor(baseHex, -22);
        const cBottom = options.bottomColor || this.adjustColor(baseHex, -42);
        const stroke = options.stroke !== undefined ? options.stroke : 'rgba(0,0,0,0.18)';
        const lWidth = options.lineWidth || 1;

        const faces = [
          { pts: [p000, p100, p110, p010], col: cBack, nz: -1, nx: 0, ny: 0, cz: minZ, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 },
          { pts: [p000, p001, p011, p010], col: cLeft, nz: 0, nx: -1, ny: 0, cz: (minZ + maxZ) / 2, cx: minX, cy: (minY + maxY) / 2 },
          { pts: [p100, p101, p111, p110], col: cRight, nz: 0, nx: 1, ny: 0, cz: (minZ + maxZ) / 2, cx: maxX, cy: (minY + maxY) / 2 },
          { pts: [p000, p100, p101, p001], col: cBottom, nz: 0, nx: 0, ny: -1, cz: (minZ + maxZ) / 2, cx: (minX + maxX) / 2, cy: minY },
          { pts: [p010, p110, p111, p011], col: cTop, nz: 0, nx: 0, ny: 1, cz: (minZ + maxZ) / 2, cx: (minX + maxX) / 2, cy: maxY },
          { pts: [p001, p101, p111, p011], col: cFront, nz: 1, nx: 0, ny: 0, cz: maxZ, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
        ];

        const cosY = Math.cos(studioState.yaw);
        const sinY = Math.sin(studioState.yaw);
        const cosP = Math.cos(studioState.pitch);
        const sinP = Math.sin(studioState.pitch);

        const visibleFaces = faces.filter(f => {
          const z1 = f.nx * sinY + f.nz * cosY;
          const z2 = f.ny * sinP + z1 * cosP;
          return z2 >= -0.01;
        });

        visibleFaces.sort((a, b) => {
          const az = (a.cx * sinY + a.cz * cosY) * cosP + a.cy * sinP;
          const bz = (b.cx * sinY + b.cz * cosY) * cosP + b.cy * sinP;
          return az - bz;
        });

        visibleFaces.forEach(f => {
          drawPoly(f.pts, f.col, stroke, lWidth);
        });
      };

      // 6 ta mebel turini o'ziga xos 3D geometriyada chizish
      switch (type) {
        case 'oshxona':
          this.render3DKitchen(ctx, project, d, drawBox, drawPoly);
          break;
        case 'tumba':
          this.render3DCabinet(ctx, project, d, drawBox, drawPoly);
          break;
        case 'stol':
          this.render3DTable(ctx, project, d, drawBox, drawPoly);
          break;
        case 'krovat':
          this.render3DBed(ctx, project, d, drawBox, drawPoly);
          break;
        case 'ofis':
          this.render3DOfficeDesk(ctx, project, d, drawBox, drawPoly);
          break;
        case 'shkaf':
        default:
          this.render3DWardrobe(ctx, project, d, drawBox, drawPoly);
          break;
      }
    }

    /* ------------------------------------------------------------------------
       1. 3D SHKAF-KUPE (Garderob, Javonlar, Kiyim osgich & Sürgülü eshiklar)
       ------------------------------------------------------------------------ */
    render3DWardrobe(ctx, project, d, drawBox, drawPoly) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;
      const dp = d.depth * 0.75;
      const hw = w / 2;
      const hd = dp / 2;
      const color = d.colorHex || '#B88654';

      const plinthH = 8;
      const wallT = 4;

      // 1. Pastki tsokol (Plinth)
      drawBox(-hw + 3, 0, -hd + 3, hw - 3, plinthH, hd - 3, '#1E1B18');

      // 2. Tashqi karkas (Chap, O'ng, Yuqori, Pastki devorlar)
      drawBox(-hw, plinthH, -hd, -hw + wallT, h, hd, color);
      drawBox(hw - wallT, plinthH, -hd, hw, h, hd, color);
      drawBox(-hw, h - wallT, -hd, hw, h, hd, color);
      drawBox(-hw, plinthH, -hd, hw, plinthH + wallT, hd, color);

      // 3. Orqa devor (DVP)
      drawBox(-hw + wallT, plinthH + wallT, -hd, hw - wallT, h - wallT, -hd + 2, this.adjustColor(color, -35));

      // 4. Markaziy vertikal to'siq (Bo'limlarga ajratish)
      const splitX = -hw + w * 0.46;
      drawBox(splitX - wallT / 2, plinthH + wallT, -hd + 2, splitX + wallT / 2, h - wallT, hd - 5, color);

      // 5. Ichki javonlar (Chap bo'limda)
      const shelvesCount = Math.max(2, Math.min(8, d.shelves || 4));
      const leftInnerW = splitX - (-hw + wallT);
      for (let s = 1; s <= shelvesCount; s++) {
        const sy = plinthH + wallT + ((h - plinthH - wallT * 2) / (shelvesCount + 1)) * s;
        drawBox(-hw + wallT, sy, -hd + 3, splitX - wallT / 2, sy + 3, hd - 6, this.adjustColor(color, 12));
      }

      // 6. Garderob kiyim osgich trubasi & Kiyimlar (O'ng bo'limda)
      const railY = h * 0.76;
      const railZ = 0;
      const rX1 = splitX + wallT / 2 + 2;
      const rX2 = hw - wallT - 2;
      
      // Xrom truba
      drawBox(rX1, railY, railZ - 2, rX2, railY + 3, railZ + 2, '#e5e7eb', { stroke: '#9ca3af' });

      // 3D Ilgichlar va kiyimlar
      const clothesStep = 24;
      for (let cx = rX1 + 18; cx <= rX2 - 16; cx += clothesStep) {
        // Ilgich ilgagi
        const pHook = project(cx, railY + 6, railZ);
        const pClothTop = project(cx, railY - 2, railZ);
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pHook.px, pHook.py);
        ctx.lineTo(pClothTop.px, pClothTop.py);
        ctx.stroke();

        // Kiyim/Ko'ylak hajmi
        const clothColor = ((cx % 48) === 0) ? '#3b82f6' : (((cx % 72) === 0) ? '#64748b' : '#d97706');
        drawBox(cx - 7, railY - 42, railZ - 8, cx + 7, railY - 4, railZ + 8, clothColor, { stroke: 'rgba(0,0,0,0.2)' });
      }

      // 7. Pastki tortmalar (O'ng bo'lim pastida)
      const drawersCount = d.drawers || 0;
      const drawerSlide = studioState.doorAnimProgress * 25;
      const dSectionH = Math.min(50, (h - plinthH) * 0.3);
      if (drawersCount > 0) {
        const eachDH = dSectionH / Math.min(drawersCount, 3);
        for (let j = 0; j < Math.min(drawersCount, 3); j++) {
          const dy = plinthH + wallT + j * eachDH;
          const dFrontZ = hd - 6 + drawerSlide;
          // Tortma qutisi
          drawBox(splitX + wallT / 2 + 2, dy + 1, hd - 24 + drawerSlide, hw - wallT - 2, dy + eachDH - 2, dFrontZ, this.adjustColor(color, -8));
          // Tortma tutqichi
          drawBox(splitX + (hw - splitX) * 0.4, dy + eachDH * 0.45, dFrontZ + 1, splitX + (hw - splitX) * 0.6, dy + eachDH * 0.55, dFrontZ + 3, '#e5e7eb');
        }
      }

      // 8. Alyumin yo'naltiruvchi relslar (Yuqori va Pastki)
      drawBox(-hw, h - wallT - 2.5, hd - 4, hw, h - wallT, hd, '#9ca3af');
      drawBox(-hw, plinthH + wallT, hd - 4, hw, plinthH + wallT + 2.5, hd, '#9ca3af');

      // 9. Sürgülü Kupe Eshiklari (Animatsiya bilan suriladi)
      const doorsCount = Math.max(2, Math.min(4, d.doors || 2));
      const doorW = (w - 2) / doorsCount + 5; // bir-birining ustiga o'tish (overlap)
      const doorH = h - plinthH - wallT * 2 - 3;
      const slideOffset = studioState.doorAnimProgress * (doorW * 0.7);

      for (let k = 0; k < doorsCount; k++) {
        const isOuter = (k % 2 === 1);
        const baseDoorX = -hw + 1 + k * (w / doorsCount);
        const actualX = isOuter ? (baseDoorX + slideOffset) : (baseDoorX - slideOffset * 0.2);
        const doorZ = isOuter ? (hd - 1.5) : (hd - 4.5);
        const doorLeafColor = this.adjustColor(color, isOuter ? 5 : -4);

        // Eshik paneli
        drawBox(actualX, plinthH + wallT + 2, doorZ - 1.5, actualX + doorW - 2, plinthH + wallT + 2 + doorH, doorZ + 1.5, doorLeafColor, {
          stroke: '#27272a',
          lineWidth: 1.2
        });

        // Alyumin vertikal profil tutqichi
        const handleSideX = isOuter ? (actualX + 2) : (actualX + doorW - 4);
        drawBox(handleSideX, plinthH + wallT + 12, doorZ + 1.5, handleSideX + 2.5, plinthH + wallT + doorH - 12, doorZ + 3.5, '#e5e7eb', { stroke: '#6b7280' });
      }
    }

    /* ------------------------------------------------------------------------
       2. 3D OSHXONA GARNITURI (Yuqori shkaflar, Fartuk, Stoleshnitsa, Moyka & Plita)
       ------------------------------------------------------------------------ */
    render3DKitchen(ctx, project, d, drawBox, drawPoly) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;
      const dp = d.depth * 0.75;
      const hw = w / 2;
      const hd = dp / 2;
      const color = d.colorHex || '#B88654';

      const lowerH = h * 0.42;
      const apronH = h * 0.22;
      const upperH = h * 0.36;
      const upperDepth = dp * 0.6;
      const counterThick = 4.5;
      const plinthH = 7;

      // 1. Pastki tsokol
      drawBox(-hw + 3, 0, -hd + 5, hw - 3, plinthH, hd - 5, '#18181b');

      // 2. Pastki shkaflar korpusi
      drawBox(-hw, plinthH, -hd, hw, lowerH - counterThick, hd - 2, color);

      // 3. Stoleshnitsa (Tosh/kvarts yoki massiv yog'och)
      const counterColor = '#24211e';
      drawBox(-hw - 3, lowerH - counterThick, -hd - 3, hw + 3, lowerH, hd + 3, counterColor, {
        topColor: '#38332e',
        frontColor: '#24211e',
        stroke: '#18181b',
        lineWidth: 1.5
      });

      // 4. Stoleshnitsa ustidagi aksessuarlar:
      // a) Zanglamas po'lat Moyka (Sink) - Chap tomonda
      const sinkX = -hw + w * 0.28;
      const sinkZ = hd * 0.15;
      drawBox(sinkX - 18, lowerH, sinkZ - 13, sinkX + 18, lowerH + 1, sinkZ + 13, '#94a3b8', { stroke: '#475569' });
      drawBox(sinkX - 15, lowerH - 1, sinkZ - 10, sinkX + 15, lowerH + 0.8, sinkZ + 10, '#334155');
      // Xrom egilgan oqqush kran (Swan-neck faucet)
      const pTapBase = project(sinkX, lowerH + 1, sinkZ - 11);
      const pTapTop = project(sinkX, lowerH + 18, sinkZ - 11);
      const pTapSpout = project(sinkX, lowerH + 13, sinkZ - 3);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(pTapBase.px, pTapBase.py);
      ctx.lineTo(pTapTop.px, pTapTop.py);
      ctx.lineTo(pTapSpout.px, pTapSpout.py);
      ctx.stroke();

      // b) Shisha-keramika Plita (Induction Cooktop) - O'ng tomonda
      const stoveX = hw - w * 0.3;
      const stoveZ = hd * 0.15;
      drawBox(stoveX - 18, lowerH, stoveZ - 14, stoveX + 18, lowerH + 1, stoveZ + 14, '#09090b', { stroke: '#27272a' });
      // 4 ta pishirish halqalari (Burner rings)
      const offsets = [
        [-8, -6, 5], [8, -6, 5],
        [-8, 6, 6], [8, 6, 6]
      ];
      offsets.forEach(([ox, oz, r]) => {
        const ringCenter = project(stoveX + ox, lowerH + 1.2, stoveZ + oz);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(ringCenter.px, ringCenter.py, r * 0.85, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 5. Pastki Eshiklar va Tortmalar (Ochiladigan)
      const lowModules = Math.max(3, Math.min(5, Math.ceil(w / 45)));
      const modW = w / lowModules;
      const doorOpenAngle = studioState.doorAnimProgress * 1.2;
      const drawerSlide = studioState.doorAnimProgress * 22;

      for (let m = 0; m < lowModules; m++) {
        const mX = -hw + m * modW;
        const isDrawerCol = (m === 0); // 1-ustun tortmalar

        if (isDrawerCol) {
          const drawCount = Math.max(2, Math.min(4, d.drawers || 3));
          const eachH = (lowerH - counterThick - plinthH) / drawCount;
          for (let dr = 0; dr < drawCount; dr++) {
            const dy = plinthH + dr * eachH;
            const dz = hd + drawerSlide;
            drawBox(mX + 1.5, dy + 1, hd - 20 + drawerSlide, mX + modW - 1.5, dy + eachH - 1.5, dz, color, { stroke: 'rgba(0,0,0,0.25)' });
            // Gorizontal keng tutqich
            drawBox(mX + modW * 0.25, dy + eachH * 0.5 - 1, dz + 1, mX + modW * 0.75, dy + eachH * 0.5 + 1, dz + 2.5, '#e5e7eb');
          }
        } else {
          // Ochiladigan pastki eshik
          const dWidth = modW - 2;
          const dy = plinthH + 1.5;
          const dH = lowerH - counterThick - plinthH - 3;
          if (doorOpenAngle < 0.05) {
            drawBox(mX + 1, dy, hd - 2, mX + modW - 1, dy + dH, hd, color, { stroke: 'rgba(0,0,0,0.25)' });
            // Tutqich
            const hx = (m % 2 === 0) ? (mX + modW - 5) : (mX + 5);
            drawBox(hx - 1, dy + dH * 0.6, hd + 0.5, hx + 1, dy + dH * 0.85, hd + 2, '#e5e7eb');
          } else {
            // Burchak ostida ochilgan eshik
            const hingeX = mX + 1;
            const openEndX = hingeX + Math.cos(doorOpenAngle) * dWidth;
            const openEndZ = hd + Math.sin(doorOpenAngle) * dWidth;
            const p1 = project(hingeX, dy, hd);
            const p2 = project(openEndX, dy, openEndZ);
            const p3 = project(openEndX, dy + dH, openEndZ);
            const p4 = project(hingeX, dy + dH, hd);
            drawPoly([p1, p2, p3, p4], this.adjustColor(color, m % 2 === 0 ? 6 : -6), 'rgba(0,0,0,0.3)', 1.5);
          }
        }
      }

      // 6. Fartuk (Backsplash) - Kafel/plitka teksturasi
      const apronStartY = lowerH;
      const apronEndY = lowerH + apronH;
      drawBox(-hw - 1, apronStartY, -hd - 1, hw + 1, apronEndY, -hd + 1, '#f1ede6', {
        topColor: '#f1ede6',
        frontColor: '#ede7df',
        stroke: '#cbd5e1'
      });

      // Fartuk kafel chiziqlari (Tile Grid)
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      for (let ay = apronStartY + 12; ay < apronEndY; ay += 14) {
        const l1 = project(-hw, ay, -hd + 1.2);
        const l2 = project(hw, ay, -hd + 1.2);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      }
      for (let ax = -hw + 24; ax < hw; ax += 28) {
        const l1 = project(ax, apronStartY, -hd + 1.2);
        const l2 = project(ax, apronEndY, -hd + 1.2);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      }

      // 7. Yuqori Osma Shkaflar (Wall Cabinets)
      const upperStartY = apronEndY;
      const upperEndY = h;
      drawBox(-hw, upperStartY, -hd, hw, upperEndY, -hd + upperDepth, color);

      // Yuqori shkaf eshiklari
      const upDoors = Math.max(3, Math.min(6, Math.ceil(w / 38)));
      const upDoorW = w / upDoors;
      for (let u = 0; u < upDoors; u++) {
        const uX = -hw + u * upDoorW;
        const dW = upDoorW - 2;
        const uH = upperEndY - upperStartY - 3;
        const uZ = -hd + upperDepth;

        if (doorOpenAngle < 0.05) {
          drawBox(uX + 1, upperStartY + 1.5, uZ - 1, uX + upDoorW - 1, upperEndY - 1.5, uZ + 1.5, this.adjustColor(color, u % 2 === 0 ? 5 : -4), { stroke: 'rgba(0,0,0,0.2)' });
          // Dumaloq metall tutqich tugma
          const kx = (u % 2 === 0) ? (uX + upDoorW - 6) : (uX + 6);
          const pKnob = project(kx, upperStartY + 10, uZ + 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(pKnob.px, pKnob.py, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ochilgan yuqori eshik
          const hingeX = (u % 2 === 0) ? (uX + 1) : (uX + upDoorW - 1);
          const dir = (u % 2 === 0) ? 1 : -1;
          const openX = hingeX + dir * Math.cos(doorOpenAngle) * dW;
          const openZ = uZ + Math.sin(doorOpenAngle) * dW;
          const p1 = project(hingeX, upperStartY + 2, uZ);
          const p2 = project(openX, upperStartY + 2, openZ);
          const p3 = project(openX, upperEndY - 2, openZ);
          const p4 = project(hingeX, upperEndY - 2, uZ);
          drawPoly([p1, p2, p3, p4], this.adjustColor(color, u % 2 === 0 ? 6 : -6), 'rgba(0,0,0,0.25)', 1.2);
        }
      }

      // Shkaf tagidagi yashirin LED profil
      drawBox(-hw + 2, upperStartY - 2, -hd + 3, hw - 2, upperStartY, -hd + upperDepth - 2, '#fbbf24', { stroke: '#f59e0b' });
    }

    /* ------------------------------------------------------------------------
       3. 3D TUMBA VA KOMOD (Oyoqli TV tumba, Tortmalar & Shkafchalar)
       ------------------------------------------------------------------------ */
    render3DCabinet(ctx, project, d, drawBox, drawPoly) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;
      const dp = d.depth * 0.75;
      const hw = w / 2;
      const hd = dp / 2;
      const color = d.colorHex || '#B88654';

      const legH = 14;
      const bodyH = h - legH;

      // 1. 4 ta zamonaviy qiya metall oyoqlar (Black Metal Legs with Gold Feet)
      const legOffsets = [
        [-hw + 8, -hd + 8],
        [hw - 8, -hd + 8],
        [-hw + 8, hd - 8],
        [hw - 8, hd - 8]
      ];
      legOffsets.forEach(([lx, lz]) => {
        // Oyoqning asosiy qismi
        drawBox(lx - 2, 0, lz - 2, lx + 2, legH, lz + 2, '#18181b', { stroke: '#09090b' });
        // Oltin/xrom taglik uchi
        drawBox(lx - 2.5, 0, lz - 2.5, lx + 2.5, 3.5, lz + 2.5, '#d97706');
      });

      // 2. Tumba korpusi
      drawBox(-hw, legH, -hd, hw, h, hd, color);

      // 3. Fasad bo'limlari: Chapda tortmalar, O'ngda eshik
      const leftW = w * 0.52;
      const rightW = w - leftW;
      const drawCount = Math.max(2, Math.min(4, d.drawers || 2));
      const eachDH = bodyH / drawCount;
      const drawerSlide = studioState.doorAnimProgress * 22;
      const doorOpenAngle = studioState.doorAnimProgress * 1.3;

      // Chap tortmalar
      for (let di = 0; di < drawCount; di++) {
        const dy = legH + di * eachDH;
        const dFrontZ = hd + drawerSlide;
        drawBox(-hw + 2, dy + 1.5, hd - 18 + drawerSlide, -hw + leftW - 2, dy + eachDH - 1.5, dFrontZ, this.adjustColor(color, di % 2 === 0 ? 4 : -4), {
          stroke: 'rgba(0,0,0,0.25)'
        });
        // Silliq metall gorizontal tutqich
        drawBox(-hw + leftW * 0.35, dy + eachDH * 0.5 - 1.2, dFrontZ + 1, -hw + leftW * 0.65, dy + eachDH * 0.5 + 1.2, dFrontZ + 2.5, '#e5e7eb');
      }

      // O'ng eshik(lar)
      const doorStartY = legH + 2;
      const doorEndY = h - 2;
      const rDoorW = rightW - 4;
      const rStartX = -hw + leftW + 2;

      if (doorOpenAngle < 0.05) {
        drawBox(rStartX, doorStartY, hd - 1.5, rStartX + rDoorW, doorEndY, hd + 1, this.adjustColor(color, -6), { stroke: 'rgba(0,0,0,0.25)' });
        // Dumaloq tutqich
        const pKnob = project(rStartX + rDoorW - 8, legH + bodyH * 0.5, hd + 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(pKnob.px, pKnob.py, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const hingeX = rStartX + rDoorW;
        const openX = hingeX - Math.cos(doorOpenAngle) * rDoorW;
        const openZ = hd + Math.sin(doorOpenAngle) * rDoorW;
        const p1 = project(openX, doorStartY, openZ);
        const p2 = project(hingeX, doorStartY, hd);
        const p3 = project(hingeX, doorEndY, hd);
        const p4 = project(openX, doorEndY, openZ);
        drawPoly([p1, p2, p3, p4], this.adjustColor(color, -6), 'rgba(0,0,0,0.3)', 1.5);
      }

      // 4. Tumba ustidagi ultra-ingichka OLED Televizor (Smart TV)
      const tvW = Math.min(w * 0.85, 110);
      const tvH = tvW * 0.58;
      const tvStandW = tvW * 0.35;
      // TV tagligi (Stand)
      drawBox(-tvStandW / 2, h, -4, tvStandW / 2, h + 2, 4, '#18181b');
      drawBox(-3, h + 2, -2, 3, h + 7, 2, '#27272a');
      // TV displey ramkasi va ekrani
      drawBox(-tvW / 2, h + 7, -2, tvW / 2, h + 7 + tvH, 2, '#09090b', {
        frontColor: '#18181b',
        topColor: '#27272a',
        stroke: '#3f3f46'
      });
      // Ekranning yorqin qirrasi
      const pTvC = project(0, h + 7 + tvH * 0.5, 2.5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(pTvC.px, pTvC.py, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ------------------------------------------------------------------------
       4. 3D ZAMONAVIY STOL (Mustahkam 4 oyoq, Qalin stoleshnitsa & Tortma)
       ------------------------------------------------------------------------ */
    render3DTable(ctx, project, d, drawBox, drawPoly) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;
      const dp = d.depth * 0.75;
      const hw = w / 2;
      const hd = dp / 2;
      const color = d.colorHex || '#B88654';

      const topThick = 7;
      const legW = 6;
      const apronH = 9;
      const tableLegH = h - topThick;

      // 1. 4 ta individual baquvvat stol oyoqlari (Floor to Tabletop)
      const legPositions = [
        [-hw + 4, -hd + 4],
        [hw - 4 - legW, -hd + 4],
        [-hw + 4, hd - 4 - legW],
        [hw - 4 - legW, hd - 4 - legW]
      ];
      legPositions.forEach(([lx, lz]) => {
        // Oyoqning o'zi
        drawBox(lx, 0, lz, lx + legW, tableLegH, lz + legW, color, { stroke: 'rgba(0,0,0,0.25)' });
        // Oyoq tagidagi metall podpyatnik (Foot cap)
        drawBox(lx - 0.5, 0, lz - 0.5, lx + legW + 0.5, 3, lz + legW + 0.5, '#27272a');
      });

      // 2. Stol osti karkasi (Tsarqa / Apron frame)
      drawBox(-hw + 5, tableLegH - apronH, -hd + 5, hw - 5, tableLegH, -hd + 8, this.adjustColor(color, -16));
      drawBox(-hw + 5, tableLegH - apronH, hd - 8, hw - 5, tableLegH, hd - 5, this.adjustColor(color, -16));
      drawBox(-hw + 5, tableLegH - apronH, -hd + 5, -hw + 8, tableLegH, hd - 5, this.adjustColor(color, -20));
      drawBox(hw - 8, tableLegH - apronH, -hd + 5, hw - 5, tableLegH, hd - 5, this.adjustColor(color, -20));

      // 3. Markaziy tortma (Drawer) - Ochiladigan
      const drawerW = w * 0.36;
      const drawerSlide = studioState.doorAnimProgress * 22;
      drawBox(-drawerW / 2, tableLegH - apronH + 1, hd - 20 + drawerSlide, drawerW / 2, tableLegH - 1, hd - 4 + drawerSlide, this.adjustColor(color, 6), {
        stroke: 'rgba(0,0,0,0.25)'
      });
      // Tortma tutqichi
      const pHandle = project(0, tableLegH - apronH * 0.5, hd - 3 + drawerSlide);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(pHandle.px, pHandle.py, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // 4. Massiv Stoleshnitsa (Thick wooden / polished tabletop)
      drawBox(-hw, tableLegH, -hd, hw, h, hd, color, {
        topColor: this.adjustColor(color, 28),
        frontColor: this.adjustColor(color, 8),
        stroke: '#18181b',
        lineWidth: 1.5
      });

      // 5. Stol ustidagi noutbuk va charm pad
      const padW = w * 0.45;
      const padD = dp * 0.45;
      drawBox(-padW / 2, h, -padD / 2, padW / 2, h + 0.8, padD / 2, '#27272a');

      // Zamonaviy metall noutbuk (Laptop)
      const lapW = 24;
      const lapD = 17;
      drawBox(-lapW / 2, h + 0.8, -lapD / 2, lapW / 2, h + 2.2, lapD / 2, '#94a3b8');
      // Noutbuk ekrani (ochilgan)
      const pScreenBaseL = project(-lapW / 2, h + 2.2, -lapD / 2);
      const pScreenBaseR = project(lapW / 2, h + 2.2, -lapD / 2);
      const pScreenTopR = project(lapW / 2, h + 16, -lapD / 2 - 6);
      const pScreenTopL = project(-lapW / 2, h + 16, -lapD / 2 - 6);
      drawPoly([pScreenBaseL, pScreenBaseR, pScreenTopR, pScreenTopL], '#1e293b', '#475569', 1.2);
    }

    /* ------------------------------------------------------------------------
       5. 3D ORTOPEDIK KROVAT (Bosh qismi, Ortopedik Matras & Yostiqlar)
       ------------------------------------------------------------------------ */
    render3DBed(ctx, project, d, drawBox, drawPoly) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;   // Bosh qismi balandligi
      const dp = d.depth * 0.75;  // Krovat uzunligi
      const hw = w / 2;
      const hd = dp / 2;
      const color = d.colorHex || '#B88654';

      const legH = 10;
      const frameH = 28;
      const headThick = 9;

      // 1. 4 ta mustahkam krovat oyoqlari
      const cornerOffsets = [
        [-hw + 4, -hd + 4],
        [hw - 4, -hd + 4],
        [-hw + 4, hd - 4],
        [hw - 4, hd - 4]
      ];
      cornerOffsets.forEach(([cx, cz]) => {
        drawBox(cx - 3, 0, cz - 3, cx + 3, legH, cz + 3, '#18181b');
      });

      // 2. Krovat Karkasi (Side rails and Footboard)
      drawBox(-hw, legH, -hd + headThick, -hw + 5, frameH, hd, color);
      drawBox(hw - 5, legH, -hd + headThick, hw, frameH, hd, color);
      drawBox(-hw, legH, hd - 5, hw, frameH, hd, color);

      // 3. Ortopedik Matras (Plush Luxury Mattress)
      const matStartY = frameH - 4;
      const matEndY = frameH + 18; // qalin 22 sm matras
      drawBox(-hw + 3, matStartY, -hd + headThick + 2, hw - 3, matEndY, hd - 3, '#f8fafc', {
        topColor: '#ffffff',
        frontColor: '#f1f5f9',
        leftColor: '#e2e8f0',
        rightColor: '#cbd5e1',
        stroke: '#cbd5e1',
        lineWidth: 1.2
      });

      // Matras ustidagi tikuv qatorlari (Quilted stitch lines)
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let mz = -hd + headThick + 18; mz < hd - 10; mz += 24) {
        const ml1 = project(-hw + 5, matEndY + 0.5, mz);
        const ml2 = project(hw - 5, matEndY + 0.5, mz);
        ctx.beginPath();
        ctx.moveTo(ml1.px, ml1.py);
        ctx.lineTo(ml2.px, ml2.py);
        ctx.stroke();
      }

      // 4. Ikkita Qulay 3D Yostiq (Fluffy White Pillows)
      const pilW = (w - 18) / 2;
      const pilD = 24;
      const pilY = matEndY;
      // Chap yostiq
      drawBox(-hw + 5, pilY, -hd + headThick + 4, -hw + 5 + pilW, pilY + 8, -hd + headThick + 4 + pilD, '#ffffff', {
        topColor: '#ffffff',
        frontColor: '#f1f5f9',
        stroke: '#cbd5e1'
      });
      // O'ng yostiq
      drawBox(hw - 5 - pilW, pilY, -hd + headThick + 4, hw - 5, pilY + 8, -hd + headThick + 4 + pilD, '#ffffff', {
        topColor: '#ffffff',
        frontColor: '#f1f5f9',
        stroke: '#cbd5e1'
      });

      // 5. Yotoq yoping'ichi / Pled (Folded blanket at foot of the bed)
      const blanketD = dp * 0.32;
      const blanketColor = this.adjustColor(color, -22);
      drawBox(-hw + 2, matEndY + 0.5, hd - blanketD, hw - 2, matEndY + 4, hd - 2, blanketColor, {
        topColor: this.adjustColor(color, -10),
        stroke: 'rgba(0,0,0,0.2)'
      });

      // 6. Hashamatli Katta Bosh Qismi (Headboard / Izgolovye)
      // Devor bo'ylab tik turadi (-hd da)
      drawBox(-hw - 3, 0, -hd, hw + 3, h, -hd + headThick, color, {
        topColor: this.adjustColor(color, 24),
        frontColor: this.adjustColor(color, 6),
        stroke: '#18181b',
        lineWidth: 1.5
      });

      // Bosh qismidagi vertikal relyefli qoplamalar (Vertikal tikuvlar)
      const panelCount = 4;
      const pW = w / panelCount;
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      for (let p = 1; p < panelCount; p++) {
        const px = -hw + p * pW;
        const pl1 = project(px, 4, -hd + headThick + 0.5);
        const pl2 = project(px, h - 4, -hd + headThick + 0.5);
        ctx.beginPath();
        ctx.moveTo(pl1.px, pl1.py);
        ctx.lineTo(pl2.px, pl2.py);
        ctx.stroke();
      }

      // Pastdagi saqlash tortmasi (agar d.drawers > 0 bo'lsa, yon tomondan chiqadi)
      if (d.drawers > 0) {
        const drawerSlide = studioState.doorAnimProgress * 22;
        drawBox(hw - 4 + drawerSlide, legH + 2, -hd + dp * 0.3, hw + 16 + drawerSlide, frameH - 2, hd - dp * 0.2, this.adjustColor(color, -10), {
          stroke: 'rgba(0,0,0,0.25)'
        });
      }
    }

    /* ------------------------------------------------------------------------
       6. 3D OFIS MEBELI (Keng ish stoli, Tortmali tumba & Monitor)
       ------------------------------------------------------------------------ */
    render3DOfficeDesk(ctx, project, d, drawBox, drawPoly) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;
      const dp = d.depth * 0.75;
      const hw = w / 2;
      const hd = dp / 2;
      const color = d.colorHex || '#B88654';

      const topThick = 7;
      const deskH = h - topThick;
      const pedestalW = Math.min(w * 0.36, 42);

      // 1. Chap yon tayanch panel (Executive Left Leg Panel)
      drawBox(-hw + 2, 0, -hd + 3, -hw + 8, deskH, hd - 3, color, { stroke: 'rgba(0,0,0,0.25)' });

      // 2. Orqa maxfiylik paneli (Modesty Privacy Panel)
      drawBox(-hw + 8, deskH * 0.25, -hd + 5, hw - pedestalW, deskH - 2, -hd + 9, this.adjustColor(color, -18));

      // 3. O'ng tomondagi 3-qavatli tumba (Integrated Pedestal with 3 Drawers)
      const pStartX = hw - pedestalW;
      const pEndX = hw - 2;
      drawBox(pStartX, 0, -hd + 3, pEndX, deskH, hd - 3, this.adjustColor(color, -10));

      // 3 ta ofis tortmalari (Chiqadigan)
      const drawerCount = 3;
      const eachDH = (deskH - 6) / drawerCount;
      const drawerSlide = studioState.doorAnimProgress * 22;

      for (let di = 0; di < drawerCount; di++) {
        const dy = 3 + di * eachDH;
        const dFrontZ = hd - 3 + drawerSlide;
        drawBox(pStartX + 1.5, dy + 1.5, hd - 24 + drawerSlide, pEndX - 1.5, dy + eachDH - 1.5, dFrontZ, color, {
          stroke: 'rgba(0,0,0,0.25)'
        });
        // Silliq xrom tortma tutqichi
        drawBox(pStartX + pedestalW * 0.3, dy + eachDH * 0.5 - 1, dFrontZ + 1, pStartX + pedestalW * 0.7, dy + eachDH * 0.5 + 1, dFrontZ + 2.5, '#e5e7eb');
      }

      // 4. Keng Rahbar Stol Stoleshnitsasi
      drawBox(-hw, deskH, -hd, hw, h, hd, color, {
        topColor: this.adjustColor(color, 26),
        frontColor: this.adjustColor(color, 6),
        stroke: '#18181b',
        lineWidth: 1.5
      });

      // 5. Stol ustidagi Ofis jihozlari:
      // a) Katta charm mat (Desk Blotter)
      const matW = w * 0.48;
      const matD = dp * 0.5;
      drawBox(-matW / 2 - 5, h, -matD / 2, matW / 2 - 5, h + 0.8, matD / 2, '#1c1917');

      // b) Katta Ultra-wide Ofis Monitori
      const monW = 34;
      const monH = 20;
      // Taglik
      drawBox(-monW * 0.25 - 5, h + 0.8, -hd + 10, monW * 0.25 - 5, h + 1.8, -hd + 16, '#27272a');
      drawBox(-2 - 5, h + 1.8, -hd + 12, 2 - 5, h + 9, -hd + 14, '#3f3f46');
      // Ekran
      drawBox(-monW / 2 - 5, h + 9, -hd + 11, monW / 2 - 5, h + 9 + monH, -hd + 13, '#09090b', {
        frontColor: '#18181b',
        topColor: '#27272a',
        stroke: '#475569'
      });
      // Monitor ekrani porlashi
      const pMonC = project(-5, h + 9 + monH * 0.5, -hd + 13.5);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
      ctx.beginPath();
      ctx.arc(pMonC.px, pMonC.py, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    render3DHumanScale(ctx, project, d) {
      const humanX = (d.width * 0.75) / 2 + 35;
      const humanH = 175 * 0.75;

      const pHHead = project(humanX, humanH, 20);
      const pHFoot = project(humanX, 0, 20);

      ctx.save();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.45)';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;

      const headRadius = (pHFoot.py - pHHead.py) * 0.07;
      ctx.beginPath();
      ctx.arc(pHHead.px, pHHead.py + headRadius, headRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(pHHead.px - headRadius * 1.1, pHHead.py + headRadius * 2, headRadius * 2.2, (pHFoot.py - pHHead.py) * 0.45, 6);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pHHead.px - headRadius * 0.5, pHHead.py + headRadius * 2 + (pHFoot.py - pHHead.py) * 0.45);
      ctx.lineTo(pHHead.px - headRadius * 0.5, pHFoot.py);
      ctx.moveTo(pHHead.px + headRadius * 0.5, pHHead.py + headRadius * 2 + (pHFoot.py - pHHead.py) * 0.45);
      ctx.lineTo(pHHead.px + headRadius * 0.5, pHFoot.py);
      ctx.stroke();

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1.75 m (Inson bo\'yi)', pHHead.px, pHHead.py - 6);

      ctx.restore();
    }

    render3DLedGlow(ctx, project, d) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;
      const dp = d.depth * 0.75;
      const hw = w / 2;
      const hd = dp / 2;

      ctx.save();
      const isNight = studioState.isNightMode;
      ctx.strokeStyle = isNight ? 'rgba(255, 215, 110, 0.98)' : 'rgba(251, 191, 36, 0.9)';
      ctx.lineWidth = isNight ? 4.8 : 3.5;
      ctx.shadowColor = isNight ? '#fbbf24' : '#f59e0b';
      ctx.shadowBlur = isNight ? 30 : 18;

      if (d.type === 'oshxona') {
        // Oshxona fartuki ustidagi yashirin LED chiziq
        const lowerH = h * 0.42;
        const apronH = h * 0.22;
        const stripY = lowerH + apronH - 1;
        const l1 = project(-hw + 4, stripY, -hd + dp * 0.58);
        const l2 = project(hw - 4, stripY, -hd + dp * 0.58);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      } else if (d.type === 'krovat') {
        // Krovat bosh qismi orqasidagi romantik ambient halo nuri
        const l1 = project(-hw - 4, h - 2, -hd + 2);
        const l2 = project(hw + 4, h - 2, -hd + 2);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      } else if (d.type === 'tumba') {
        // Tumba tagidagi suzuvchi (floating) LED nur
        const l1 = project(-hw + 8, 14, hd - 2);
        const l2 = project(hw - 8, 14, hd - 2);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      } else {
        // Shkaf yoki stol ustki korniz nuri
        const l1 = project(-hw + 8, h - 2, 0);
        const l2 = project(hw - 8, h - 2, 0);
        ctx.beginPath();
        ctx.moveTo(l1.px, l1.py);
        ctx.lineTo(l2.px, l2.py);
        ctx.stroke();
      }

      ctx.restore();
    }

    render3DDimensions(ctx, project, d) {
      const w = d.width * 0.75;
      const h = d.height * 0.75;
      const dp = d.depth * 0.75;
      const hw = w / 2;
      const hd = dp / 2;

      ctx.save();
      ctx.strokeStyle = '#d97706';
      ctx.fillStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.font = 'bold 11px JetBrains Mono, monospace';

      // Eni (Width) chizig'i - old pastda
      const wP1 = project(-hw, -12, hd + 14);
      const wP2 = project(hw, -12, hd + 14);
      this.draw3DDimensionLine(ctx, wP1, wP2, `${d.width} sm`);

      // Bo'yi (Height) chizig'i - chap tomonda
      const hP1 = project(-hw - 16, 0, hd + 14);
      const hP2 = project(-hw - 16, h, hd + 14);
      this.draw3DDimensionLine(ctx, hP1, hP2, `${d.height} sm`);

      // Chuqurligi (Depth) chizig'i - o'ng tomonda
      const dP1 = project(hw + 14, -12, -hd);
      const dP2 = project(hw + 14, -12, hd);
      this.draw3DDimensionLine(ctx, dP1, dP2, `${d.depth} sm`);

      ctx.restore();
    }

    draw3DDimensionLine(ctx, p1, p2, text) {
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();

      const mx = (p1.px + p2.px) / 2;
      const my = (p1.py + p2.py) / 2;

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const textW = ctx.measureText(text).width;
      ctx.fillRect(mx - textW / 2 - 4, my - 8, textW + 8, 16);
      ctx.fillStyle = '#d97706';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, mx, my);
      ctx.restore();
    }

    adjustColor(hex, percent) {
      let num = parseInt(hex.replace('#', ''), 16);
      if (isNaN(num)) return hex;
      let r = (num >> 16) + percent;
      let g = ((num >> 8) & 0x00FF) + percent;
      let b = (num & 0x0000FF) + percent;
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /* ========================================================================
       SMART RASKROY & DETALLASH (Cutting Optimizer & BOM)
       ======================================================================== */
    generateBOM(d) {
      const W = d.width * 10;
      const H = d.height * 10;
      const D = d.depth * 10;
      const t = 16;

      const parts = [];

      if (d.type === 'shkaf') {
        parts.push({ name: 'Yon devor (Stoyka)', w: H - 80, h: D, qty: 2, edge: '2L (PVX 2.0)', edgeLenM: ((H - 80) * 2 * 2) / 1000 });
        parts.push({ name: 'Tom va Tag gorizontal', w: W - 2 * t, h: D, qty: 2, edge: '1L (PVX 1.0)', edgeLenM: ((W - 2 * t) * 2) / 1000 });
        parts.push({ name: 'Markaziy vertikal to\'siq', w: H - 120, h: D - 20, qty: 1, edge: '1L (PVX 1.0)', edgeLenM: (H - 120) / 1000 });
        const shelfW = Math.round((W - 3 * t) / 2);
        const shelfQty = d.shelves || 4;
        parts.push({ name: 'Ichki ko\'chma javonlar', w: shelfW, h: D - 30, qty: shelfQty, edge: '1L (PVX 0.4)', edgeLenM: (shelfW * shelfQty) / 1000 });
        const drawerQty = d.drawers || 0;
        if (drawerQty > 0) {
          parts.push({ name: 'Tortma fasadi', w: shelfW - 4, h: 180, qty: drawerQty, edge: '4 tomondan (PVX 1.0)', edgeLenM: ((shelfW + 180) * 2 * drawerQty) / 1000 });
          parts.push({ name: 'Tortma quti yonlari', w: D - 60, h: 140, qty: drawerQty * 2, edge: '1L (PVX 0.4)', edgeLenM: ((D - 60) * 2 * drawerQty) / 1000 });
        }
        const doorQty = d.doors || 2;
        const doorW = Math.round((W + 30) / doorQty);
        parts.push({ name: 'Kupe eshigi fasadi', w: doorW, h: H - 90, qty: doorQty, edge: 'Alyuminiy profil', edgeLenM: 0 });
      } else if (d.type === 'oshxona') {
        parts.push({ name: 'Oshxona korpus yonlari', w: 720, h: D, qty: 6, edge: '1L (PVX 1.0)', edgeLenM: (720 * 6) / 1000 });
        parts.push({ name: 'Korpus gorizontallari', w: Math.round(W / 3), h: D, qty: 8, edge: '1L (PVX 0.4)', edgeLenM: ((W / 3) * 8) / 1000 });
        parts.push({ name: 'Yuqori shkaf yonlari', w: 720, h: 320, qty: 6, edge: '1L (PVX 1.0)', edgeLenM: (720 * 6) / 1000 });
        parts.push({ name: 'Oshxona fasad eshiklari', w: 400, h: 716, qty: d.doors || 6, edge: '4 tomondan (PVX 2.0)', edgeLenM: ((400 + 716) * 2 * (d.doors || 6)) / 1000 });
      } else if (d.type === 'stol') {
        parts.push({ name: 'Stol ustki qismi (Stoleshnitsa)', w: W, h: D, qty: 1, edge: '4 tomondan (PVX 2.0)', edgeLenM: ((W + D) * 2) / 1000 });
        parts.push({ name: 'Stol oyoqlari (Yon panellar)', w: H - 32, h: D - 80, qty: 2, edge: '3 tomondan (PVX 1.0)', edgeLenM: ((H + D) * 2) / 1000 });
        parts.push({ name: 'Orqa mustahkamlovchi tsarga', w: W - 100, h: 350, qty: 1, edge: '1L (PVX 0.4)', edgeLenM: (W - 100) / 1000 });
        if (d.drawers > 0) {
          parts.push({ name: 'Tortma fasadi', w: 380, h: 160, qty: d.drawers, edge: '4 tomondan (PVX 1.0)', edgeLenM: ((380 + 160) * 2 * d.drawers) / 1000 });
        }
      } else {
        parts.push({ name: 'Asosiy yon devorlar', w: H - 32, h: D, qty: 2, edge: '2L (PVX 1.0)', edgeLenM: ((H + D) * 2) / 1000 });
        parts.push({ name: 'Ustki va tag qopqoq', w: W, h: D, qty: 2, edge: '2L (PVX 1.0)', edgeLenM: ((W + D) * 2) / 1000 });
        if (d.shelves > 0) {
          parts.push({ name: 'Gorizontal javonlar', w: W - 32, h: D - 20, qty: d.shelves, edge: '1L (PVX 0.4)', edgeLenM: ((W - 32) * d.shelves) / 1000 });
        }
        if (d.drawers > 0) {
          parts.push({ name: 'Tortma fasadlari', w: W - 40, h: Math.round(H / (d.drawers + 1)), qty: d.drawers, edge: '4 tomondan (PVX 1.0)', edgeLenM: ((W + 150) * 2 * d.drawers) / 1000 });
        }
      }

      return parts;
    }

    optimizeCutting(parts) {
      const rects = [];
      parts.forEach(p => {
        for (let i = 0; i < p.qty; i++) {
          rects.push({
            name: p.name,
            w: Math.max(p.w, p.h),
            h: Math.min(p.w, p.h),
            area: p.w * p.h,
            edge: p.edge
          });
        }
      });

      rects.sort((a, b) => b.area - a.area);

      const sheets = [];
      let currentSheet = {
        index: 1,
        width: SHEET_W,
        height: SHEET_H,
        placedRects: [],
        usedArea: 0,
        currentX: SAW_KERF,
        currentY: SAW_KERF,
        columnWidth: 0
      };

      rects.forEach(r => {
        if (currentSheet.currentY + r.h + SAW_KERF <= SHEET_H &&
            currentSheet.currentX + r.w + SAW_KERF <= SHEET_W) {
          currentSheet.placedRects.push({
            name: r.name,
            x: currentSheet.currentX,
            y: currentSheet.currentY,
            w: r.w,
            h: r.h,
            edge: r.edge
          });
          currentSheet.usedArea += r.area;
          currentSheet.columnWidth = Math.max(currentSheet.columnWidth, r.w);
          currentSheet.currentY += r.h + SAW_KERF;
        } else if (currentSheet.currentX + currentSheet.columnWidth + r.w + SAW_KERF <= SHEET_W &&
                   r.h + SAW_KERF <= SHEET_H) {
          currentSheet.currentX += currentSheet.columnWidth + SAW_KERF;
          currentSheet.currentY = SAW_KERF;
          currentSheet.columnWidth = r.w;

          currentSheet.placedRects.push({
            name: r.name,
            x: currentSheet.currentX,
            y: currentSheet.currentY,
            w: r.w,
            h: r.h,
            edge: r.edge
          });
          currentSheet.usedArea += r.area;
          currentSheet.currentY += r.h + SAW_KERF;
        } else {
          sheets.push(currentSheet);
          currentSheet = {
            index: sheets.length + 1,
            width: SHEET_W,
            height: SHEET_H,
            placedRects: [{
              name: r.name,
              x: SAW_KERF,
              y: SAW_KERF,
              w: r.w,
              h: r.h,
              edge: r.edge
            }],
            usedArea: r.area,
            currentX: SAW_KERF,
            currentY: r.h + SAW_KERF,
            columnWidth: r.w
          };
        }
      });

      if (currentSheet.placedRects.length > 0) {
        sheets.push(currentSheet);
      }

      return sheets;
    }

    updateRaskroyData() {
      const d = this.currentData || {
        type: 'shkaf',
        width: 200,
        height: 240,
        depth: 60,
        shelves: 5,
        drawers: 2,
        doors: 2
      };

      const parts = this.generateBOM(d);
      const sheets = this.optimizeCutting(parts);
      this.currentSheets = sheets;
      this.currentParts = parts;

      const totalPartsArea = parts.reduce((sum, p) => sum + (p.w * p.h * p.qty), 0) / 1000000;
      const totalSheetsArea = (sheets.length * SHEET_W * SHEET_H) / 1000000;
      const efficiency = Math.min(96, Math.max(70, Math.round((totalPartsArea / totalSheetsArea) * 100)));
      const waste = 100 - efficiency;
      const totalEdgeM = Math.round(parts.reduce((sum, p) => sum + (p.edgeLenM || 0), 0) * 10) / 10;

      if (this.statSheets) this.statSheets.textContent = `${sheets.length} dona`;
      if (this.statEfficiency) this.statEfficiency.textContent = `${efficiency}%`;
      if (this.statWaste) this.statWaste.textContent = `${waste}%`;
      if (this.statEdge) this.statEdge.textContent = `${totalEdgeM} m`;

      if (this.sheetTabsContainer) {
        this.sheetTabsContainer.innerHTML = '';
        sheets.forEach((sh, idx) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = `sheet-tab-chip ${idx === studioState.activeSheetIndex ? 'active' : ''}`;
          chip.textContent = `${idx + 1}-Plita (${sh.placedRects.length} detal)`;
          chip.addEventListener('click', () => {
            studioState.activeSheetIndex = idx;
            document.querySelectorAll('.sheet-tab-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            this.renderRaskroy();
          });
          this.sheetTabsContainer.appendChild(chip);
        });
      }

      if (this.bomTableBody) {
        this.bomTableBody.innerHTML = '';
        parts.forEach((p, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>#${idx + 1}</strong> ${p.name}</td>
            <td><code style="font-weight:700;">${p.w} × ${p.h} mm</code></td>
            <td><strong>${p.qty} dona</strong></td>
            <td><span class="edge-badge">${p.edge}</span></td>
            <td>${p.edgeLenM ? p.edgeLenM.toFixed(1) + ' m' : '—'}</td>
          `;
          this.bomTableBody.appendChild(tr);
        });
      }

      this.renderRaskroy();
    }

    renderRaskroy() {
      if (!this.raskroyCanvas || !this.raskroyCtx || !this.currentSheets) return;

      const ctx = this.raskroyCtx;
      const canvas = this.raskroyCanvas;

      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = 240 * (window.devicePixelRatio || 1);
      if (ctx.resetTransform) ctx.resetTransform();
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

      const w = rect.width;
      const h = 240;

      ctx.clearRect(0, 0, w, h);

      const sheet = this.currentSheets[studioState.activeSheetIndex] || this.currentSheets[0];
      if (!sheet) return;

      const pad = 12;
      const drawW = w - pad * 2;
      const drawH = h - pad * 2;
      const scaleX = drawW / SHEET_W;
      const scaleY = drawH / SHEET_H;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(pad, pad, drawW, drawH);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, drawW, drawH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`DSP Standart Plita: ${SHEET_W} × ${SHEET_H} mm`, pad + 6, pad - 2);

      const partColors = [
        '#fed7aa', '#fef08a', '#bbf7d0', '#bae6fd', '#e9d5ff', '#fbcfe8', '#cbd5e1'
      ];

      sheet.placedRects.forEach((r, idx) => {
        const rx = pad + r.x * scaleX;
        const ry = pad + r.y * scaleY;
        const rw = r.w * scaleX;
        const rh = r.h * scaleY;

        ctx.fillStyle = partColors[idx % partColors.length];
        ctx.fillRect(rx, ry, rw, rh);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, ry, rw, rh);

        if (rw > 32 && rh > 18) {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px Inter, sans-serif';
          const shortName = r.name.length > 18 ? r.name.substring(0, 16) + '..' : r.name;
          ctx.fillText(shortName, rx + 4, ry + 12);

          if (rh > 30) {
            ctx.fillStyle = '#475569';
            ctx.font = '8px JetBrains Mono, monospace';
            ctx.fillText(`${r.w}×${r.h}`, rx + 4, ry + 24);
          }
        }
      });
    }

    printProductionSheet() {
      const d = this.currentData || { type: 'shkaf', width: 200, height: 240, depth: 60 };
      const parts = this.currentParts || [];
      const sheets = this.currentSheets || [];

      let printBox = document.getElementById('print-production-sheet');
      if (!printBox) {
        printBox = document.createElement('div');
        printBox.id = 'print-production-sheet';
        document.body.appendChild(printBox);
      }

      printBox.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #000; padding: 20px;">
          <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between;">
            <div>
              <h1 style="margin: 0; font-size: 20px;">MebelPro • ISHLAB CHIQARISH TEXNOLOGIK NARYADI</h1>
              <p style="margin: 4px 0; font-size: 13px;">Buyurtma: MP-${Math.floor(1000 + Math.random() * 9000)} | Sana: ${new Date().toLocaleDateString('uz-UZ')}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0; font-size: 16px;">${d.type.toUpperCase()}</h3>
              <p style="margin: 4px 0; font-size: 12px;">O'lchamlari: ${d.width} × ${d.height} × ${d.depth} sm</p>
            </div>
          </div>

          <div style="display: flex; gap: 20px; margin-bottom: 15px; font-size: 12px; background: #f3f4f6; padding: 10px; border-radius: 6px;">
            <div><strong>Zarur DSP Plitalar:</strong> ${sheets.length} dona (2800×2070mm)</div>
            <div><strong>Kromka sarfi:</strong> ${document.getElementById('raskroy-stat-edge')?.textContent || '—'}</div>
            <div><strong>Foydali maydon:</strong> ${document.getElementById('raskroy-stat-efficiency')?.textContent || '—'}</div>
            <div><strong>Chiqindi (Otxod):</strong> ${document.getElementById('raskroy-stat-waste')?.textContent || '—'}</div>
          </div>

          <h3 style="font-size: 14px; margin-bottom: 8px;">1. DETALLARNING TO'LIQ SPETSIFIKATSIYASI (BOM)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;" border="1" cellpadding="5">
            <thead>
              <tr style="background: #e5e7eb;">
                <th>№</th>
                <th>Detal nomi</th>
                <th>Uzunligi (mm)</th>
                <th>Kengligi (mm)</th>
                <th>Soni</th>
                <th>Kromka turi</th>
                <th>Kromka uzunligi</th>
              </tr>
            </thead>
            <tbody>
              ${parts.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.w}</td>
                  <td>${p.h}</td>
                  <td><strong>${p.qty}</strong></td>
                  <td>${p.edge}</td>
                  <td>${p.edgeLenM ? p.edgeLenM.toFixed(1) + ' m' : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px;">
            <div>Sex boshlig'i: ___________________</div>
            <div>Usta montajchi: ___________________</div>
            <div>Sana: ___________________</div>
          </div>
        </div>
      `;

      window.print();
    }
  }

  // Sahifa yuklanganda yoki script ishga tushganda initsializatsiya
  function initStudio() {
    window.MebelProStudio = new MebelProStudio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudio);
  } else {
    initStudio();
  }

})();
