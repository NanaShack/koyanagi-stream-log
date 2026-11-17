// 画面ファイルだけをキャッシュして起動を速くする（記録データはキャッシュしない）
// キャッシュ名に置き場所を含めて、同じ github.io にある別の配信ログと混ざらないようにする
const PREFIX = 'stream-log:' + self.registration.scope + ':';
const CACHE = PREFIX + 'v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // GASへの通信は触らない
  if (!e.request.url.startsWith(self.registration.scope)) return;
  // 毎回サーバーに新しい版がないか確認し、つながらないときだけキャッシュを使う
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
