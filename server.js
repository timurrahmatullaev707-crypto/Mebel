/**
 * MebelPro - Asosiy HTTP Server (Node.js)
 * Xavfsiz Admin API, Ommaviy Katalog API, Buyurtmalar CRM va Statik fayllarni uzatish
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { FURNITURE_LIMITS, DEFAULT_PRICES, calculateQuote, formatSum } from './calc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Papkalar
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Yordamchi JSON o'qish/yozish funksiyalari
function readJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Xatolik ${filePath} o'qishda:`, err);
  }
  return defaultValue;
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Xatolik ${filePath} yozishda:`, err);
    return false;
  }
}

// Boshlang'ich ma'lumotlarni yuklash
let PRODUCTS_DB = readJSON(PRODUCTS_FILE, []);
let ORDERS_DB = readJSON(ORDERS_FILE, []);

// ============================================================================
// XAVFSIZLIK VA AUTENTIFIKATSIYA MODULI
// ============================================================================

// Rate limiting (Login urinishlari xavfsizligi)
const LOGIN_ATTEMPTS = new Map(); // IP -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 5 * 60 * 1000; // 5 daqiqa bloklash

// Faol sessiyalar (Token -> { username, expiresAt })
const ACTIVE_SESSIONS = new Map();
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 soat

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, originalHash) {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64);
    const originalBuffer = Buffer.from(originalHash, 'hex');
    return crypto.timingSafeEqual(computedHash, originalBuffer);
  } catch (e) {
    return false;
  }
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
}

function checkRateLimit(ip) {
  const attempt = LOGIN_ATTEMPTS.get(ip);
  if (!attempt) return { allowed: true };

  const now = Date.now();
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const remainingSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { allowed: false, error: `Ko'p xato urinishlar. Iltimos ${remainingSec} soniya kuting.` };
  }

  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    LOGIN_ATTEMPTS.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const attempt = LOGIN_ATTEMPTS.get(ip) || { count: 0, lockedUntil: null };
  attempt.count += 1;
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCK_TIME_MS;
  }
  LOGIN_ATTEMPTS.set(ip, attempt);
}

function clearFailedAttempts(ip) {
  LOGIN_ATTEMPTS.delete(ip);
}

function authenticateRequest(req) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/admin_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;

  const session = ACTIVE_SESSIONS.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    ACTIVE_SESSIONS.delete(token);
    return null;
  }

  return session;
}

// ============================================================================
// UMUMIY SOZLAMALAR
// ============================================================================

const FURNITURE_COLORS = [
  { id: 'oak', name: 'Tabiiy Eman (Dub)', hex: '#B88654', isWood: true },
  { id: 'white', name: 'Oq (Klassik)', hex: '#FFFFFF', isWood: false },
  { id: 'ivory', name: 'Sutli oq (Fil suyagi)', hex: '#F5F0E6', isWood: false },
  { id: 'grey', name: 'Och kulrang', hex: '#A8ACB0', isWood: false },
  { id: 'graphite', name: 'Grafit / Antratsit', hex: '#373A3C', isWood: false },
  { id: 'walnut', name: 'Yong\'oq (Orex)', hex: '#7A4B29', isWood: true },
  { id: 'wenge', name: 'Vengé qoramtir', hex: '#34261E', isWood: true },
  { id: 'black', name: 'Mot qora', hex: '#1C1C1E', isWood: false }
];

const ENTERPRISE_SETTINGS = {
  name: 'MebelPro MChJ',
  phone: '+998 (90) 123-45-67',
  telegram: '@mebelpro_admin',
  telegramChannel: 'https://t.me/mebelpro_uz',
  address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko\'chasi, 42-uy',
  workHours: 'Dush - Shan: 09:00 - 19:00',
  usdRate: 12850
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

function getPublicCatalog() {
  const publicBodyMaterials = Object.entries(DEFAULT_PRICES.body).map(([key, item]) => ({
    id: key, name: item.name, badge: item.badge
  }));
  const publicFacadeMaterials = Object.entries(DEFAULT_PRICES.facade).map(([key, item]) => ({
    id: key, name: item.name, badge: item.badge
  }));
  const publicEdgeTypes = Object.entries(DEFAULT_PRICES.edge).map(([key, item]) => ({
    id: key, name: item.name, badge: item.badge
  }));
  const publicHardwareTiers = Object.entries(DEFAULT_PRICES.hardware).map(([key, item]) => ({
    id: key, name: item.name, badge: item.badge
  }));
  const publicDeliveryZones = Object.entries(DEFAULT_PRICES.delivery).map(([key, item]) => ({
    id: key, name: item.name, cost: item.cost, formattedCost: formatSum(item.cost)
  }));

  return {
    success: true,
    brand: 'MebelPro',
    types: FURNITURE_LIMITS,
    materials: {
      body: publicBodyMaterials,
      facade: publicFacadeMaterials,
      edge: publicEdgeTypes,
      hardware: publicHardwareTiers
    },
    colors: FURNITURE_COLORS,
    delivery: publicDeliveryZones,
    installationRate: DEFAULT_PRICES.installationRate,
    enterprise: ENTERPRISE_SETTINGS
  };
}

// Request body o'qish yordamchisi
function readRequestBody(req, maxBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Fayl yoki so\'rov hajmi belgilangan me\'yordan oshdi (Max 10MB)'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  });
  res.end(JSON.stringify(data));
}

// ============================================================================
// SERVER ROUTER
// ============================================================================

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const clientIP = getClientIP(req);

  // --------------------------------------------------------------------------
  // 1. OMMAVIY APILAR (KALKULYATOR VA BUYURTMALAR)
  // --------------------------------------------------------------------------

  // 1.1 /api/public/catalog
  if (req.method === 'GET' && pathname === '/api/public/catalog') {
    return sendJSON(res, 200, getPublicCatalog());
  }

  // 1.2 /api/public/quote
  if (req.method === 'POST' && pathname === '/api/public/quote') {
    try {
      const raw = await readRequestBody(req);
      const params = raw ? JSON.parse(raw) : {};
      const quote = calculateQuote(params, DEFAULT_PRICES);
      return sendJSON(res, 200, { success: true, ...quote });
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: 'Xato hisoblash parametrlari' });
    }
  }

  // 1.3 /api/products (Ommaviy katalog - Faol mahsulotlar)
  if (req.method === 'GET' && pathname === '/api/products') {
    // Faqat aktiv mebellar
    const activeProducts = PRODUCTS_DB.filter(p => p.active !== false);
    return sendJSON(res, 200, { success: true, products: activeProducts });
  }

  // 1.4 /api/orders (Yangi buyurtma qabul qilish yoki mijoz kuzatishi)
  if (pathname === '/api/orders') {
    if (req.method === 'POST') {
      try {
        const raw = await readRequestBody(req);
        const orderData = JSON.parse(raw);

        if (!orderData.clientName || !orderData.clientPhone) {
          return sendJSON(res, 400, { success: false, error: 'Mijoz ismi va telefoni kiritilishi shart' });
        }

        const newOrder = {
          id: orderData.id || `MP-${Math.floor(1000 + Math.random() * 9000)}`,
          date: orderData.date || new Date().toLocaleDateString('uz-UZ'),
          clientName: String(orderData.clientName).trim(),
          clientPhone: String(orderData.clientPhone).trim(),
          clientAddress: String(orderData.clientAddress || '').trim(),
          type: orderData.type || 'Mebel buyurtmasi',
          dimensions: orderData.dimensions || 'Standart',
          color: orderData.color || 'Standart',
          totalPrice: Number(orderData.totalPrice) || 0,
          formattedPrice: orderData.formattedPrice || `${(Number(orderData.totalPrice) || 0).toLocaleString('uz-UZ')} so'm`,
          payMethod: orderData.payMethod || 'Naqd pul',
          status: 'Qabul qilindi'
        };

        ORDERS_DB.unshift(newOrder);
        writeJSON(ORDERS_FILE, ORDERS_DB);

        return sendJSON(res, 201, { success: true, order: newOrder });
      } catch (err) {
        return sendJSON(res, 400, { success: false, error: 'Xato buyurtma ma\'lumotlari' });
      }
    }
  }

  // 1.5 /api/orders/track/:id (Buyurtma holatini tekshirish)
  if (req.method === 'GET' && pathname.startsWith('/api/orders/track/')) {
    const orderId = pathname.replace('/api/orders/track/', '').trim();
    const found = ORDERS_DB.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    if (found) {
      return sendJSON(res, 200, { success: true, order: found });
    }
    return sendJSON(res, 404, { success: false, error: 'Buyurtma topilmadi' });
  }

  // --------------------------------------------------------------------------
  // 2. ADMIN AUTENTIFIKATSIYA VA XAVFSIZLIK APILARI
  // --------------------------------------------------------------------------

  // 2.1 /api/admin/setup-status (Admin hisobi bormi yo'qmi tekshirish)
  if (req.method === 'GET' && pathname === '/api/admin/setup-status') {
    const adminConfig = readJSON(ADMIN_FILE, null);
    const hasAdmin = !!(adminConfig && adminConfig.username && adminConfig.hash);
    return sendJSON(res, 200, { success: true, needsSetup: !hasAdmin });
  }

  // 2.2 /api/admin/setup (Dastlabki admin hisobini yaratish)
  if (req.method === 'POST' && pathname === '/api/admin/setup') {
    const adminConfig = readJSON(ADMIN_FILE, null);
    if (adminConfig && adminConfig.username && adminConfig.hash) {
      return sendJSON(res, 400, { success: false, error: 'Admin hisobi allaqachon mavjud' });
    }

    try {
      const raw = await readRequestBody(req);
      const { username, password } = JSON.parse(raw);

      if (!username || !password || password.length < 6) {
        return sendJSON(res, 400, {
          success: false,
          error: 'Login va kamida 6 belgidan iborat xavfsiz parol kiriting'
        });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(password, salt);

      const newAdmin = {
        username: String(username).trim(),
        salt,
        hash,
        createdAt: new Date().toISOString()
      };

      writeJSON(ADMIN_FILE, newAdmin);

      // Avtomatik sessiya berish
      const token = crypto.randomBytes(32).toString('hex');
      ACTIVE_SESSIONS.set(token, {
        username: newAdmin.username,
        expiresAt: Date.now() + SESSION_DURATION_MS
      });

      return sendJSON(res, 200, {
        success: true,
        message: 'Admin hisobi muvaffaqiyatli yaratildi',
        token,
        username: newAdmin.username
      });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: 'Admin yaratishda server xatosi' });
    }
  }

  // 2.3 /api/admin/login
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return sendJSON(res, 429, { success: false, error: rateCheck.error });
    }

    try {
      const raw = await readRequestBody(req);
      const { username, password } = JSON.parse(raw);

      const adminConfig = readJSON(ADMIN_FILE, null);
      if (!adminConfig || !adminConfig.hash) {
        return sendJSON(res, 400, {
          success: false,
          needsSetup: true,
          error: 'Tizimda admin hisobi mavjud emas. Avval dastlabki sozlashni bajaring.'
        });
      }

      const isUserMatch = adminConfig.username.toLowerCase() === String(username || '').trim().toLowerCase();
      const isPassMatch = isUserMatch && verifyPassword(String(password || ''), adminConfig.salt, adminConfig.hash);

      if (!isPassMatch) {
        recordFailedAttempt(clientIP);
        return sendJSON(res, 401, { success: false, error: 'Login yoki parol noto\'g\'ri' });
      }

      // To'g'ri bo'lsa urinishlarni tozalash
      clearFailedAttempts(clientIP);

      // Kriptografik tasodifiy sessiya tokeni
      const token = crypto.randomBytes(32).toString('hex');
      ACTIVE_SESSIONS.set(token, {
        username: adminConfig.username,
        expiresAt: Date.now() + SESSION_DURATION_MS
      });

      return sendJSON(res, 200, {
        success: true,
        token,
        username: adminConfig.username,
        message: 'Xush kelibsiz!'
      });
    } catch (err) {
      return sendJSON(res, 400, { success: false, error: 'Xato so\'rov formati' });
    }
  }

  // 2.4 /api/admin/logout
  if (req.method === 'POST' && pathname === '/api/admin/logout') {
    const session = authenticateRequest(req);
    if (session) {
      // Barcha tegishli sessiyalarni topib o'chirish
      for (const [key, val] of ACTIVE_SESSIONS.entries()) {
        if (val.username === session.username) ACTIVE_SESSIONS.delete(key);
      }
    }
    return sendJSON(res, 200, { success: true, message: 'Tizimdan chiqildi' });
  }

  // 2.5 /api/admin/me
  if (req.method === 'GET' && pathname === '/api/admin/me') {
    const session = authenticateRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Avtorizatsiyadan o\'tilmagan' });
    }
    return sendJSON(res, 200, { success: true, username: session.username });
  }

  // --------------------------------------------------------------------------
  // 3. HIMOYALANGAN ADMIN APILARI (MAHSULOTLAR, BUYURTMALAR, RASMLAR)
  // --------------------------------------------------------------------------

  // Tekshiruv: Har qanday /api/admin/* so'rovi avtorizatsiyadan o'tishi shart!
  if (pathname.startsWith('/api/admin/')) {
    const session = authenticateRequest(req);
    if (!session) {
      return sendJSON(res, 401, { success: false, error: 'Ruxsat berilmagan. Iltimos qaytadan kiring.' });
    }

    // 3.1 /api/admin/stats (Dashboard statistikasi)
    if (req.method === 'GET' && pathname === '/api/admin/stats') {
      const totalFurniture = PRODUCTS_DB.length;
      const totalOrders = ORDERS_DB.length;
      const activeOrders = ORDERS_DB.filter(o => o.status !== 'O\'rnatildi' && o.status !== 'Bekor qilindi').length;
      const completedOrders = ORDERS_DB.filter(o => o.status === 'O\'rnatildi').length;
      const newOrders = ORDERS_DB.filter(o => o.status === 'Qabul qilindi').length;
      const totalRevenue = ORDERS_DB.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

      return sendJSON(res, 200, {
        success: true,
        stats: {
          totalFurniture,
          totalOrders,
          newOrders,
          activeOrders,
          completedOrders,
          totalRevenue,
          formattedRevenue: `${totalRevenue.toLocaleString('uz-UZ')} so'm`
        },
        recentOrders: ORDERS_DB.slice(0, 5)
      });
    }

    // 3.2 /api/admin/products (Mahsulotlarni olish, qo'shish)
    if (pathname === '/api/admin/products') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, products: PRODUCTS_DB });
      }

      if (req.method === 'POST') {
        try {
          const raw = await readRequestBody(req);
          const p = JSON.parse(raw);

          if (!p.title || !p.price || !p.category) {
            return sendJSON(res, 400, { success: false, error: 'Nomi, narxi va kategoriyasi to\'ldirilishi shart' });
          }

          const newId = `p${Date.now().toString().slice(-6)}`;
          const newProduct = {
            id: newId,
            title: String(p.title).trim(),
            category: String(p.category).trim(),
            catName: String(p.catName || p.category).trim(),
            badge: p.badge || 'Yangi',
            badgeClass: p.badgeClass || 'badge-new',
            rating: p.rating || '5.0',
            reviews: p.reviews || '0',
            specs: String(p.specs || '').trim(),
            price: Number(p.price),
            oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
            material: p.material || 'mdf',
            color: p.color || 'Standart',
            image: p.image || '/images/placeholder.svg',
            description: String(p.description || '').trim(),
            active: p.active !== false
          };

          PRODUCTS_DB.unshift(newProduct);
          writeJSON(PRODUCTS_FILE, PRODUCTS_DB);

          return sendJSON(res, 201, { success: true, product: newProduct });
        } catch (err) {
          return sendJSON(res, 400, { success: false, error: 'Xato mahsulot ma\'lumotlari' });
        }
      }
    }

    // 3.3 /api/admin/products/:id (Tahrirlash, o'chirish)
    if (pathname.startsWith('/api/admin/products/')) {
      const prodId = pathname.replace('/api/admin/products/', '').trim();
      const index = PRODUCTS_DB.findIndex(p => p.id === prodId);

      if (index === -1) {
        return sendJSON(res, 404, { success: false, error: 'Mahsulot topilmadi' });
      }

      if (req.method === 'PUT') {
        try {
          const raw = await readRequestBody(req);
          const updates = JSON.parse(raw);

          PRODUCTS_DB[index] = {
            ...PRODUCTS_DB[index],
            ...updates,
            id: prodId, // ID o'zgarmasligi shart
            price: Number(updates.price ?? PRODUCTS_DB[index].price),
            oldPrice: updates.oldPrice !== undefined ? (updates.oldPrice ? Number(updates.oldPrice) : null) : PRODUCTS_DB[index].oldPrice,
            active: updates.active !== undefined ? updates.active : PRODUCTS_DB[index].active
          };

          writeJSON(PRODUCTS_FILE, PRODUCTS_DB);
          return sendJSON(res, 200, { success: true, product: PRODUCTS_DB[index] });
        } catch (err) {
          return sendJSON(res, 400, { success: false, error: 'Xato yangilash ma\'lumotlari' });
        }
      }

      if (req.method === 'DELETE') {
        const deleted = PRODUCTS_DB.splice(index, 1);
        writeJSON(PRODUCTS_FILE, PRODUCTS_DB);
        return sendJSON(res, 200, { success: true, deleted: deleted[0] });
      }
    }

    // 3.4 /api/admin/upload (Kompyuterdan rasm yuklash - Base64 yoki Binary)
    if (req.method === 'POST' && pathname === '/api/admin/upload') {
      try {
        const raw = await readRequestBody(req, 15 * 1024 * 1024); // max 15MB
        const data = JSON.parse(raw);

        if (!data.base64) {
          return sendJSON(res, 400, { success: false, error: 'Rasm ma\'lumoti (base64) topilmadi' });
        }

        // data:image/png;base64,.... formatini ajratish
        const matches = data.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let ext = '.jpg';
        let buffer = null;

        if (matches && matches.length === 3) {
          const mime = matches[1];
          if (mime.includes('png')) ext = '.png';
          else if (mime.includes('webp')) ext = '.webp';
          else if (mime.includes('svg')) ext = '.svg';
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(data.base64, 'base64');
        }

        const filename = `furniture_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filePath, buffer);

        // Public rasm URL manzili
        const imageUrl = `/uploads/${filename}`;
        return sendJSON(res, 200, { success: true, url: imageUrl, filename });
      } catch (err) {
        console.error('Rasm yuklashda xatolik:', err);
        return sendJSON(res, 500, { success: false, error: 'Rasmni saqlashda server xatosi' });
      }
    }

    // 3.5 /api/admin/orders (Buyurtmalar ro'yxati)
    if (pathname === '/api/admin/orders') {
      if (req.method === 'GET') {
        return sendJSON(res, 200, { success: true, orders: ORDERS_DB });
      }
    }

    // 3.6 /api/admin/orders/:id (Holatni o'zgartirish, o'chirish)
    if (pathname.startsWith('/api/admin/orders/')) {
      const orderId = pathname.replace('/api/admin/orders/', '').trim();
      const index = ORDERS_DB.findIndex(o => o.id === orderId);

      if (index === -1) {
        return sendJSON(res, 404, { success: false, error: 'Buyurtma topilmadi' });
      }

      if (req.method === 'PUT') {
        try {
          const raw = await readRequestBody(req);
          const updates = JSON.parse(raw);

          ORDERS_DB[index] = {
            ...ORDERS_DB[index],
            ...updates,
            id: orderId
          };

          writeJSON(ORDERS_FILE, ORDERS_DB);
          return sendJSON(res, 200, { success: true, order: ORDERS_DB[index] });
        } catch (err) {
          return sendJSON(res, 400, { success: false, error: 'Xato yangilash ma\'lumotlari' });
        }
      }

      if (req.method === 'DELETE') {
        const deleted = ORDERS_DB.splice(index, 1);
        writeJSON(ORDERS_FILE, ORDERS_DB);
        return sendJSON(res, 200, { success: true, deleted: deleted[0] });
      }
    }

    return sendJSON(res, 404, { success: false, error: 'Noma\'lum admin endpoint' });
  }

  // --------------------------------------------------------------------------
  // 4. STATIK FAYLLARNI UZATISH (HTML, CSS, JS, RASMLAR)
  // --------------------------------------------------------------------------

  // 4.1 /uploads/ yo'nalishidagi rasmlar
  if (pathname.startsWith('/uploads/')) {
    const filename = pathname.replace('/uploads/', '').replace(/\.\./g, '');
    const uploadFilePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(uploadFilePath) && fs.statSync(uploadFilePath).isFile()) {
      const ext = path.extname(uploadFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(uploadFilePath).pipe(res);
      return;
    }
  }

  // 4.2 Oddiy statik fayllar
  let cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  if (cleanPath === 'admin') cleanPath = 'admin.html';
  if (cleanPath === 'catalog') cleanPath = 'catalog.html';
  if (cleanPath === 'cart') cleanPath = 'cart.html';
  if (cleanPath === 'portfolio') cleanPath = 'portfolio.html';
  if (cleanPath === 'about') cleanPath = 'about.html';

  let rootFile = path.join(__dirname, cleanPath);
  let publicFile = path.join(PUBLIC_DIR, cleanPath);

  let filePath = (fs.existsSync(rootFile) && fs.statSync(rootFile).isFile())
    ? rootFile
    : (fs.existsSync(publicFile) && fs.statSync(publicFile).isFile() ? publicFile : null);

  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - Sahifa topilmadi</h1><p><a href="/">Bosh sahifaga qaytish</a></p>');
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`MebelPro Serveri ishga tushdi: http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`Mebellar katalogi: http://localhost:${PORT}/catalog.html`);
  console.log(`====================================================`);
});
