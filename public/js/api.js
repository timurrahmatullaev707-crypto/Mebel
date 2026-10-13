/**
 * MebelHisob - API muloqot moduli (api.js)
 * /api/public/catalog va debounced /api/public/quote so'rovlari
 */
import { calculateQuote, DEFAULT_PRICES, FURNITURE_LIMITS } from './calc.js';

let catalogCache = null;
let quoteDebounceTimer = null;

/**
 * Ommaviy katalogni yuklash
 */
export async function fetchCatalog() {
  if (catalogCache) return catalogCache;

  try {
    const res = await fetch('/api/public/catalog');
    if (!res.ok) throw new Error(`Server xatosi: ${res.status}`);
    const data = await res.json();
    catalogCache = data;
    return data;
  } catch (err) {
    console.warn('Serverdan katalog olishda xatolik, zaxira ma\'lumotlaridan foydalaniladi:', err);
    // Zaxira offline/fallback katalog
    catalogCache = {
      success: true,
      types: FURNITURE_LIMITS,
      materials: {
        body: Object.entries(DEFAULT_PRICES.body).map(([id, item]) => ({ id, name: item.name, badge: item.badge })),
        facade: Object.entries(DEFAULT_PRICES.facade).map(([id, item]) => ({ id, name: item.name, badge: item.badge })),
        edge: Object.entries(DEFAULT_PRICES.edge).map(([id, item]) => ({ id, name: item.name, badge: item.badge })),
        hardware: Object.entries(DEFAULT_PRICES.hardware).map(([id, item]) => ({ id, name: item.name, badge: item.badge }))
      },
      colors: [
        { id: 'white', name: 'Oq (Klassik)', hex: '#FFFFFF', isWood: false },
        { id: 'ivory', name: 'Sutli oq', hex: '#F5F0E6', isWood: false },
        { id: 'grey', name: 'Och kulrang', hex: '#A8ACB0', isWood: false },
        { id: 'graphite', name: 'Grafit / Antratsit', hex: '#373A3C', isWood: false },
        { id: 'oak', name: 'Tabiiy Eman', hex: '#B88654', isWood: true },
        { id: 'walnut', name: 'Yong\'oq', hex: '#7A4B29', isWood: true },
        { id: 'wenge', name: 'Vengé qoramtir', hex: '#34261E', isWood: true },
        { id: 'black', name: 'Mot qora', hex: '#1C1C1E', isWood: false }
      ],
      delivery: Object.entries(DEFAULT_PRICES.delivery).map(([id, item]) => ({ id, name: item.name, cost: item.cost })),
      enterprise: {
        phone: '+998 (90) 123-45-67',
        telegram: '@mebelhisob_admin',
        address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko\'chasi, 42-uy'
      }
    };
    return catalogCache;
  }
}

/**
 * Serverdan narxni tekshirish (300ms debounce bilan)
 * @param {Object} params Hisob parametrlari
 * @param {Function} onStatus Callback yuklanish/xato holatini bildirish uchun
 * @returns {Promise<Object>} Hisoblangan narx natijasi
 */
export function requestServerQuote(params, onStatus = () => {}) {
  return new Promise((resolve) => {
    // 1. Zudlik bilan mijoz tomonida calc.js orqali hisoblash
    const localQuote = calculateQuote(params);

    if (quoteDebounceTimer) {
      clearTimeout(quoteDebounceTimer);
    }

    onStatus({ loading: true, error: null });

    quoteDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch('/api/public/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });

        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const serverData = await res.json();
        
        onStatus({ loading: false, error: null, synchronized: true });
        resolve(serverData);
      } catch (err) {
        console.warn('Serverdan narx olishda xatolik, lokal hisob ishlatildi:', err);
        onStatus({
          loading: false,
          error: 'Server bilan aloqa uzildi. Narx qurilmangizda lokal hisoblandi.',
          synchronized: false
        });
        // Har doim lokal natijani qaytaradi, foydalanuvchi to'xtab qolmaydi
        resolve(localQuote);
      }
    }, 300);
  });
}
