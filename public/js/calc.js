/**
 * MebelHisob - Umumiy hisoblash moduli (calc.js)
 * Brauzerda ham, Node.js serverda ham bir xil ishlaydi.
 */

// Mebel turlari bo'yicha standart chegaralar va ko'rsatkichlar
export const FURNITURE_LIMITS = {
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
    name: 'Tumba',
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
    name: 'Stol',
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
    name: 'Krovat',
    width: { min: 90, max: 220, default: 160, step: 10, unit: 'sm' },
    height: { min: 70, max: 140, default: 100, step: 5, unit: 'sm' }, // bosh qismi balandligi
    depth: { min: 190, max: 220, default: 200, step: 5, unit: 'sm' }, // uzunligi
    shelves: { min: 0, max: 0, default: 0, step: 0 },
    drawers: { min: 0, max: 4, default: 2, step: 1 }, // tagidagi tortmalar
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

// Materiallar narxlari va koeffitsiyentlari (so'mda)
export const DEFAULT_PRICES = {
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
    akril_facade: { name: 'Akril High-Gloss', pricePerM2: 440000, badge: 'Lyuks' },
    shpon_facade: { name: 'Tabiiy Shpon', pricePerM2: 520000, badge: 'Eksklyuziv' }
  },
  edge: {
    pvc_04: { name: 'PVX 0.4 mm', pricePerM: 4000, badge: 'Standart' },
    pvc_10: { name: 'PVX 1.0 mm', pricePerM: 7000, badge: 'Mustahkam' },
    pvc_20: { name: 'PVX 2.0 mm zarbaga chidamli', pricePerM: 11000, badge: 'Premium' }
  },
  hardware: {
    standard: { name: 'Standart furnitura', multiplier: 1.0, drawerCost: 65000, doorCost: 35000, badge: 'Standart' },
    premium: { name: 'Premium (Dovodchikli Blum/GTV)', multiplier: 1.85, drawerCost: 155000, doorCost: 75000, badge: 'Premium (+85%)' }
  },
  delivery: {
    city: { name: 'Toshkent shahar ichida', cost: 150000 },
    suburb: { name: 'Toshkent viloyati', cost: 280000 },
    region: { name: 'Boshqa viloyatlarga', cost: 450000 }
  },
  installationRate: 0.10 // Mahsulot narxining 10%
};

/**
 * Raqamni berilgan min/max oralig'iga cheklash
 */
export function clamp(val, min, max) {
  const n = Number(val);
  if (isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

/**
 * Mebel narxi va mijoz hisob-kitobini chiqarish
 * @param {Object} params Hisoblash parametrlari
 * @param {Object} customPrices Narx parametrlari (agar serverdan kelsa)
 * @returns {Object} Jami narx va ommaviy tafsilotlar (ichki tannarx va marjasiz!)
 */
export function calculateQuote(params, customPrices = DEFAULT_PRICES) {
  const type = params.type || 'shkaf';
  const limits = FURNITURE_LIMITS[type] || FURNITURE_LIMITS.shkaf;

  // O'lchamlarni cheklash
  const width = clamp(params.width, limits.width.min, limits.width.max);
  const height = clamp(params.height, limits.height.min, limits.height.max);
  const depth = clamp(params.depth, limits.depth.min, limits.depth.max);

  const shelves = limits.hasShelves ? clamp(params.shelves, limits.shelves.min, limits.shelves.max) : 0;
  const drawers = limits.hasDrawers ? clamp(params.drawers, limits.drawers.min, limits.drawers.max) : 0;
  const doors = limits.hasDoors ? clamp(params.doors, limits.doors.min, limits.doors.max) : 0;

  // Material parametrlari
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

  // Santimetrlardan metrga o'tkazish
  const wM = width / 100;
  const hM = height / 100;
  const dM = depth / 100;

  let bodyArea = 0;
  let facadeArea = 0;
  let edgeLinearMeters = 0;
  let baseHardware = 50000;

  switch (type) {
    case 'shkaf':
      // 2 yon devor, tepa va past, orqa fon, ichki vertikal bo'laklar + javonlar
      bodyArea = (2 * hM * dM) + (2 * wM * dM) + (wM * hM * 0.9) + (shelves * (wM / (doors || 2)) * dM);
      facadeArea = wM * hM;
      edgeLinearMeters = (hM * 4 + wM * 4 + shelves * 2);
      baseHardware = 120000; // sirpanuvchi relslar, profillar
      break;

    case 'oshxona':
      // Pastki qism: W * 0.85m balandlik + Yuqori qism: W * 0.75m balandlik + Stoleshnitsa
      const lowerBody = (2 * 0.85 * dM) + (wM * dM * 2) + (shelves * 0.5 * wM * dM);
      const upperBody = (2 * 0.75 * (dM * 0.6)) + (wM * (dM * 0.6) * 2);
      bodyArea = lowerBody + upperBody;
      facadeArea = wM * 1.6; // past va tepa fasadlar
      edgeLinearMeters = wM * 6 + 10;
      baseHardware = 150000; // stoleshnitsa o'rnatish, osish moslamalari
      break;

    case 'tumba':
      bodyArea = (2 * hM * dM) + (2 * wM * dM) + (wM * hM * 0.7) + (shelves * wM * dM);
      facadeArea = wM * hM * 0.85;
      edgeLinearMeters = (hM + wM + dM) * 3;
      baseHardware = 40000;
      break;

    case 'stol':
      // Stol usti (qalinlashtirilgan yoki 2 qatlam hisobi), oyoqlari, podstolye
      bodyArea = (wM * dM * 1.5) + (2 * hM * dM * 0.8) + (wM * 0.3);
      facadeArea = drawers > 0 ? (drawers * 0.15 * wM * 0.4) : 0;
      edgeLinearMeters = (wM + dM) * 3 + hM * 2;
      baseHardware = 60000;
      break;

    case 'krovat':
      // Bosh qismi (W * H), tsargalar (2 * 2m * 0.3m + W * 0.3m), matras tagligi
      bodyArea = (wM * hM) + (2 * 2.0 * 0.35) + (wM * 0.35) + (wM * 1.9 * 0.7);
      facadeArea = (wM * hM * 0.6); // dekorativ fasad bosh qismi
      edgeLinearMeters = (wM + 2.0) * 4;
      baseHardware = 110000; // krovat burchaklari va tortish mexanizmlari
      break;

    case 'ofis':
      // Stol + yon tumba yoki javon kombinatsiyasi
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

  // 1. Materiallar hisobi
  const bodyCost = Math.round(bodyArea * bodyMat.pricePerM2);
  const facadeCost = Math.round(facadeArea * facadeMat.pricePerM2);
  const materialsSubtotal = bodyCost + facadeCost;

  // 2. Kromka hisobi
  const edgeCost = Math.round(edgeLinearMeters * edgeMat.pricePerM);

  // 3. Furnitura hisobi
  const drawerHwCost = drawers * hwTier.drawerCost;
  const doorHwCost = doors * hwTier.doorCost;
  const hardwareTotal = Math.round((baseHardware + drawerHwCost + doorHwCost) * hwTier.multiplier);

  // 4. Ish haqi (arralash, formatlash, qirqish, yig'ishga tayyorlash)
  // Bozorda material + furnitura qiymatining ~25-30% qismi ish mehnati hisoblanadi
  const laborCost = Math.round((materialsSubtotal + edgeCost + hardwareTotal) * 0.28);

  // Mebelning o'zining tayyor qiymati
  const furnitureTotal = materialsSubtotal + edgeCost + hardwareTotal + laborCost;

  // 5. Yetkazib berish
  const deliveryCost = delivZone.cost || 0;

  // 6. O'rnatish
  const installationCost = needInstall ? Math.round(furnitureTotal * (customPrices.installationRate || 0.10)) : 0;

  // Jami summa
  const totalPrice = Math.round(furnitureTotal + deliveryCost + installationCost);

  // Narxni yaxlitlash (ming so'mgacha)
  const roundedTotal = Math.ceil(totalPrice / 1000) * 1000;

  return {
    valid: true,
    type,
    dimensions: { width, height, depth },
    counts: { shelves, drawers, doors },
    totalPrice: roundedTotal,
    formattedTotal: formatSum(roundedTotal),
    validDays: 7,
    // Mijozga taqdim etiladigan shaffof tafsilot (ichki tannarx va marjasiz!)
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

/**
 * Raqamni probelli so'm formatiga o'tkazish (masalan: 4 250 000 so'm)
 */
export function formatSum(num) {
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

// Node.js commonjs mosligi uchun
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FURNITURE_LIMITS,
    DEFAULT_PRICES,
    clamp,
    calculateQuote,
    formatSum
  };
}
