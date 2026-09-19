async function test() {
  const r = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@queenscare.in', password: 'QueensCare#Admin2026' })
  });
  const cookie = r.headers.get('set-cookie');
  const adminRes = await fetch('http://127.0.0.1:3000/admin?tab=footer-builder', { headers: { cookie } });
  const html = await adminRes.text();
  const scriptMatches = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
  console.log('Total script tags:', scriptMatches.length);
  scriptMatches.forEach(s => console.log('  Script:', s));
}
test().catch(console.error);
