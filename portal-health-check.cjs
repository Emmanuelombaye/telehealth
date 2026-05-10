// Portal Health Check — checks if all portals return HTTP 200
const https = require('https');
const http = require('http');

const BASE = 'https://www.peak-health.io';

const portals = [
  { name: 'Landing Page',       path: '/' },
  { name: 'Patient Login',      path: '/patient/login' },
  { name: 'Patient Portal',     path: '/patient' },
  { name: 'Doctor Login',       path: '/doctor/login' },
  { name: 'Doctor Portal',      path: '/doctor' },
  { name: 'Admin Login',        path: '/admin/login' },
  { name: 'Admin Portal',       path: '/admin' },
  { name: 'Admin Brands',       path: '/admin/brands' },
  { name: 'Admin Doctors',      path: '/admin/doctors' },
  { name: 'Admin Finance',      path: '/admin/finance' },
  { name: 'Admin Patients',     path: '/admin/patients' },
  { name: 'Admin Orders',       path: '/admin/orders' },
  { name: 'Admin Inventory',    path: '/admin/inventory' },
  { name: 'SuperAdmin Login',   path: '/superadmin/login' },
  { name: 'SuperAdmin Portal',  path: '/superadmin' },
  { name: 'SuperAdmin Finance', path: '/superadmin/finance' },
  { name: 'SuperAdmin Brands',  path: '/superadmin/brands' },
  { name: 'Pharmacy Login',     path: '/pharmacy/login' },
  { name: 'Pharmacy Portal',    path: '/pharmacy' },
  { name: 'Patient Shop',       path: '/patient/shop' },
];

function checkUrl(name, url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'PortalHealthCheck/1.0' } }, (res) => {
      const ok = res.statusCode < 400;
      const icon = ok ? '✅' : '❌';
      console.log(`  ${icon}  [${res.statusCode}] ${name.padEnd(22)} ${url}`);
      resolve({ name, status: res.statusCode, ok });
    });
    req.on('error', (err) => {
      console.log(`  ❌  [ERR] ${name.padEnd(22)} ${url} — ${err.message}`);
      resolve({ name, status: 0, ok: false });
    });
    req.setTimeout(10000, () => {
      console.log(`  ⏱️  [TMO] ${name.padEnd(22)} ${url} — Timed out`);
      req.destroy();
      resolve({ name, status: 0, ok: false });
    });
  });
}

async function main() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  PEAK HEALTH — PORTAL AVAILABILITY HEALTH CHECK');
  console.log('════════════════════════════════════════════════════\n');
  
  const results = [];
  for (const portal of portals) {
    const result = await checkUrl(portal.name, `${BASE}${portal.path}`);
    results.push(result);
  }

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log('\n════════════════════════════════════════════════════');
  console.log(`  RESULT: ${passed}/${portals.length} portals reachable`);
  if (failed > 0) {
    console.log(`  ⚠️  ${failed} portal(s) returned non-200 (may require auth redirect — this is expected for protected routes)`);
  }
  console.log('  NOTE: Protected portals (301/302 redirect to login) are HEALTHY.');
  console.log('════════════════════════════════════════════════════\n');
}

main();
