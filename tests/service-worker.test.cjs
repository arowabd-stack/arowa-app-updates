const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../public');
const scope = 'https://reader.test/';

test('offline install caches both text sources/fonts and preserves PDF range reads', async () => {
  const listeners = new Map(), stores = new Map();
  const key = req => typeof req === 'string' ? req : req.url;
  let online = true;
  const fetch = async req => {
    if (!online) throw Error('offline');
    const url = new URL(key(req));
    const file = path.join(root, url.pathname);
    const bytes = readFileSync(file);
    return new Response(bytes, {headers: {'Content-Type': url.pathname.endsWith('.pdf') ? 'application/pdf' : 'text/plain'}});
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const values = stores.get(name);
      return {
        async put(req, response) {values.set(key(req), response.clone());},
        async match(req, options) {
          if(options?.ignoreSearch){const url=new URL(key(req));for(const [stored,response] of values){const other=new URL(stored);if(other.origin===url.origin&&other.pathname===url.pathname)return response.clone();}}
          return values.get(key(req))?.clone();
        },
        async addAll(urls) {for (const url of urls) values.set(url, await fetch(url));}
      };
    },
    async keys() {return [...stores.keys()];},
    async delete(name) {return stores.delete(name);},
    async match(req) {for (const store of stores.values()) if (store.has(key(req))) return store.get(key(req)).clone();}
  };
  const self = {
    registration: {scope}, location: new URL(scope), skipWaiting: async () => {},
    clients: {claim: async () => {}},
    addEventListener(type, fn) {if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn);}
  };
  const code = readFileSync(path.join(root, 'sw.js'), 'utf8');
  vm.runInNewContext(code, {self, caches, fetch, URL, Response, Set, Blob, console});
  const dispatch = async (type, extras = {}) => {
    const pending = []; let response;
    const event = {...extras, waitUntil: p => pending.push(p), respondWith: p => {assert.equal(response, undefined); response = p;}};
    for (const fn of listeners.get(type) || []) fn(event);
    const result = await response;
    await Promise.all(pending);
    return result;
  };
  const pdfURL = scope + 'assets/ruqyah-book.pdf';
  const pdfCache = await caches.open('ruqyah-original-pdf-v1');
  const pdf = readFileSync(path.join(root, 'assets/ruqyah-book.pdf'));
  await pdfCache.put(pdfURL, new Response(pdf, {headers: {'Content-Type': 'application/pdf'}}));
  await caches.open('ruqyah-pwa-shell-old');
  await caches.open('ruqyah-rendered-book-pages-v34');
  await dispatch('install');
  await dispatch('activate');
  assert.ok(!stores.has('ruqyah-pwa-shell-old'));
  assert.ok(stores.has('ruqyah-original-pdf-v1'));
  assert.ok(stores.has('ruqyah-rendered-book-pages-v34'));
  online = false;
  const get = (file, headers = {}, mode = 'same-origin') => dispatch('fetch', {request: {url: scope + file, method: 'GET', headers: new Headers(headers), mode}});
  for (const file of ['data/quran-uthmani-v1.js', 'data/quran-indopak-v1.js', 'assets/reader-scripture.js', ...JSON.parse(readFileSync(path.join(root, 'data/reader-fonts.json'), 'utf8'))]) {
    const response = await get(file);
    assert.equal(response.status, 200, file);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), readFileSync(path.join(root, file)), file);
  }
  assert.equal((await get('reader.html', {}, 'navigate')).status, 200);
  const versioned=await get('assets/reader-scripture.js?v=60');
  assert.equal(versioned.status,200);
  assert.deepEqual(Buffer.from(await versioned.arrayBuffer()),readFileSync(path.join(root,'assets/reader-scripture.js')));
  const partial = await get('assets/ruqyah-book.pdf?page=77', {Range: 'bytes=0-1023'});
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get('Content-Range'), `bytes 0-1023/${pdf.length}`);
  assert.deepEqual(Buffer.from(await partial.arrayBuffer()), pdf.subarray(0, 1024));
});
