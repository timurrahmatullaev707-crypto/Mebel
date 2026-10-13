/**
 * MebelPro - Asosiy HTTP Server (Node.js)
 * Ommaviy API, Buyurtmalar CRM API va Statik fayllarni uzatish
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FURNITURE_LIMITS, DEFAULT_PRICES, calculateQuote, formatSum } from './calc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Namunaviy buyurtmalar bazasi (xotirada)
let ORDERS_DB = [
  { id: 'MP-1042', date: '11.10.2026', clientName: 'Akmal Karimov', clientPhone: '+998 90 911 22 33', clientAddress: 'Yunusobod 14-mavze', type: 'Shkaf-kupe', dimensions: '220 x 240 x 60 sm', color: 'oak', totalPrice: 4850000, formattedPrice: '4 850 000 so\'m', status: 'Ishlab chiqarilmoqda' },
  { id: 'MP-1041', date: '10.10.2026', clientName: 'Nodira Salimova', clientPhone: '+998 97 733 44 55', clientAddress: 'Chilonzor 9-kvartal', type: 'Oshxona garnituri', dimensions: '280 x 230 x 60 sm', color: 'white', totalPrice: 5600000, formattedPrice: '5 600 000 so\'m', status: 'O\'lchov belgilandi' },
  { id: 'MP-1040', date: '09.10.2026', clientName: 'Jasur Beknazarov', clientPhone: '+998 93 500 60 70', clientAddress: 'Mirzo Ulug\'bek tumani', type: 'Zamonaviy Stol', dimensions: '160 x 75 x 80 sm', color: 'walnut', totalPrice: 1150000, formattedPrice: '1 150 000 so\'m', status: 'O\'rnatildi' }
];

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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API: /api/public/catalog
  if (req.method === 'GET' && pathname === '/api/public/catalog') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(getPublicCatalog()));
    return;
  }

  // 2. API: /api/public/quote
  if (req.method === 'POST' && pathname === '/api/public/quote') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const params = body ? JSON.parse(body) : {};
        const quote = calculateQuote(params, DEFAULT_PRICES);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, ...quote }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Xato hisoblash parametrlari' }));
      }
    });
    return;
  }

  // 3. API: /api/orders
  if (pathname === '/api/orders') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, orders: ORDERS_DB }));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newOrder = JSON.parse(body);
          ORDERS_DB.unshift(newOrder);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, orderId: newOrder.id }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Xato buyurtma formati' }));
        }
      });
      return;
    }
  }

  // 4. Statik fayllar (Root va Public sinxron qo'llab-quvvatlash)
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
    : publicFile;

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Sahifa topilmadi</h1>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`MebelPro serveri http://localhost:${PORT} manzilida ishlamoqda`);
});
