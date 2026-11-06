const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, existsSync} = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

function reader(saved = {}) {
  // Execute the actual generated app in order, with local script resources inlined.
  // Layout, network audio playback and PDF rasterization need a real-browser check.
  const html = read('public/reader.html').replace(/<script\b[^>]*\bsrc="\.\/([^"]+)"[^>]*><\/script>/g,
    (_, file) => '<script>' + read('public/' + file).replace(/<\/script/gi, '<\\/script') + '</script>');
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: 'https://reader.test/reader.html#chapter-1', runScripts: 'dangerously',
    pretendToBeVisual: true, virtualConsole,
    beforeParse(w) {
      for (const [key, value] of Object.entries(saved)) w.localStorage.setItem(key, value);
      w.matchMedia = () => ({matches: false, addEventListener() {}, removeEventListener() {}});
      w.IntersectionObserver = class {observe() {} unobserve() {} disconnect() {}};
      w.ResizeObserver = class {observe() {} disconnect() {}};
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.fetch = async () => {throw Error('Offline integration test');};
      w.HTMLMediaElement.prototype.pause = function () {};
      w.HTMLMediaElement.prototype.load = function () {};
      w.HTMLMediaElement.prototype.play = function () {return Promise.resolve();};
    }
  });
  const ready = new Promise(resolve => dom.window.addEventListener('load', resolve, {once: true}));
  return {dom, errors, ready};
}

test('both SQLite-derived sources survive fonts, tajweed, search, audio and notes', async () => {
  const {dom, errors, ready} = reader();
  await ready;
  try {
    const w = dom.window, d = w.document;
    const dropdown = d.getElementById('arabicFontSelect');
    const nodes = [...d.querySelectorAll('.verified-verse[data-key] .verified-arabic')];
    assert.equal(nodes.length, 840);
    assert.equal(new Set(nodes.map(n => n.closest('.verified-verse').dataset.key)).size, 649);
    const dua = [...d.querySelectorAll('.duaa-verified .verified-arabic')].map(n => n.textContent);
    const translations = [...d.querySelectorAll('.verified-translation')].map(n => n.textContent);
    const audioNodes = [...d.querySelectorAll('.audio-play')];
    const audioKeys = audioNodes.map(n => n.dataset.audioKey);
    const entryIds = [...d.querySelectorAll('[data-entry-id]')].map(n => n.dataset.entryId);
    const book = d.getElementById('bookCanvasMount');
    const scriptSelect = d.getElementById('arabicScriptSelect');
    const select = key => {
      const script = ['uthmani','hafs'].includes(key) ? 'uthmani' : 'indopak';
      if (scriptSelect.value !== script) {scriptSelect.value = script; scriptSelect.dispatchEvent(new w.Event('change', {bubbles: true}));}
      if ([...dropdown.options].some(option => option.value === key)) {
        dropdown.value = key; dropdown.dispatchEvent(new w.Event('change', {bubbles: true}));
      }
    };
    const checkSource = script => {
      assert.equal(d.documentElement.dataset.quranScript, script);
      for (const node of nodes) {
        const key = node.closest('.verified-verse').dataset.key;
        assert.equal(node.textContent, w.RuqyahQuranSources[script][key], `${script} ${key}`);
        assert.ok(node.isConnected);
      }
      assert.equal(d.querySelector('.font-example-arabic').textContent, w.RuqyahQuranSources[script]['1:1']);
      assert.equal(d.getElementById('scripturePreview').textContent, w.RuqyahQuranSources[script]['1:6']);
      assert.equal(d.getElementById('currentArabicScript').textContent.toLowerCase(), script);
      const start = d.querySelector('.verified-verse[data-key="1:6"] .verified-arabic').textContent;
      assert.equal(start.startsWith(script === 'indopak' ? '\u0627\u0650' : '\u0671'), true);
      assert.equal(scriptSelect.value, script);
      assert.equal([...dropdown.options].length, 2);
    };
    checkSource('indopak');
    for (const [font, script] of [['uthmani','uthmani'], ['noorehuda','indopak'], ['hafs','uthmani'], ['indopak','indopak']]) {
      select(font); checkSource(script);
      // Toggling annotations must never restore an earlier spelling.
      d.getElementById('tajweedSwitch').click(); checkSource(script);
      d.getElementById('tajweedSwitch').click(); checkSource(script);
    }
    const representatives = ['1:1', '1:4', '2:255', '10:81', '18:39', '20:69', '36:1', '112:1', '114:6'];
    for (const key of representatives) {
      assert.ok(w.RuqyahQuranSources.indopak[key], key);
      assert.notEqual(w.RuqyahQuranSources.indopak[key], w.RuqyahQuranSources.uthmani[key], key);
    }
    d.getElementById('globalSearchField').value = 'arabic';
    for (const [font, script] of [['uthmani','uthmani'], ['indopak','indopak']]) {
      select(font);
      assert.ok(w.RuqyahSearch.search(w.RuqyahQuranSources[script]['1:1']) > 0);
      const snippet = d.querySelector('.gs-result-snippet');
      assert.ok(snippet.textContent.includes(w.RuqyahQuranSources[script]['1:1'].trim()));
    }
    w.RuqyahSearch.close();
    d.querySelector('.bookmark-entry').click();
    const bookmark = w.localStorage.getItem('ruqyah-user-bookmarks');
    d.getElementById('bookNotesBtn').click();
    d.getElementById('rnTabEditor').click();
    d.getElementById('ruqyahNotesText').value = 'Saved note survives scripture changes';
    d.getElementById('rnSave').click();
    const note = w.localStorage.getItem('ruqyah-reader-book21-notes-v21');
    assert.ok(note.includes('Saved note survives scripture changes'));
    d.getElementById('rnClose').click();
    const audio = d.getElementById('readerAudio');
    d.querySelector('#chapter-1 .audio-play[data-audio-kind="ayah"]').click();
    const src = audio.src;
    audio.currentTime = 13;
    select('uthmani');
    audio.dispatchEvent(new w.Event('play'));
    assert.equal(audio.src, src); assert.equal(audio.currentTime, 13);
    assert.ok(d.getElementById('chapter-1').classList.contains('active'));
    assert.equal(w.localStorage.getItem('ruqyah-user-bookmarks'), bookmark);
    assert.equal(w.localStorage.getItem('ruqyah-reader-book21-notes-v21'), note);
    assert.equal(d.getElementById('bookCanvasMount'), book);
    assert.equal(typeof w.RuqyahBookGoToPage, 'function');
    assert.equal(d.querySelector('#bookPdfFrame'), null);
    assert.deepEqual(audioNodes, [...d.querySelectorAll('.audio-play')]);
    assert.deepEqual(nodes, [...d.querySelectorAll('.verified-verse[data-key] .verified-arabic')]);
    assert.deepEqual(audioKeys, audioNodes.map(n => n.dataset.audioKey));
    assert.deepEqual(entryIds, [...d.querySelectorAll('[data-entry-id]')].map(n => n.dataset.entryId));
    assert.deepEqual(dua, [...d.querySelectorAll('.duaa-verified .verified-arabic')].map(n => n.textContent));
    assert.deepEqual(translations, [...d.querySelectorAll('.verified-translation')].map(n => n.textContent));
    // Missing source: retain the current text/font/setting and explain the failed choice.
    const current = nodes[0].textContent;
    delete w.RuqyahQuranSources.indopak;
    select('indopak');
    assert.equal(dropdown.value, 'uthmani'); assert.equal(nodes[0].textContent, current);
    assert.equal(w.localStorage.getItem('ruqyah-arabic-font-v8'), 'uthmani');
    assert.ok(d.getElementById('scriptureSourceError').textContent);
    assert.deepEqual(errors, []);
  } finally {dom.window.close();}
});

test('stored Uthmani preference and notes restore before tajweed/search initialize', async () => {
  const savedNote = JSON.stringify({'77': {text: 'Existing note', modified: ''}});
  const {dom, errors, ready} = reader({'ruqyah-arabic-font-v8': 'uthmani', 'ruqyah-reader-book21-notes-v21': savedNote});
  await ready;
  try {
    const w = dom.window, d = w.document;
    assert.equal(d.documentElement.dataset.quranScript, 'uthmani');
    for (const node of d.querySelectorAll('.verified-verse[data-key] .verified-arabic')) {
      assert.equal(node.textContent, w.RuqyahQuranSources.uthmani[node.closest('.verified-verse').dataset.key]);
    }
    d.getElementById('bookNotesBtn').click();
    assert.ok(d.getElementById('rnSavedPages').textContent.includes('Existing note'));
    assert.equal(w.localStorage.getItem('ruqyah-reader-book21-notes-v21'), savedNote);
    assert.deepEqual(errors, []);
  } finally {dom.window.close();}
});

test('every font promised for offline use is emitted by the build', () => {
  for (const font of JSON.parse(read('public/data/reader-fonts.json'))) assert.ok(existsSync(path.join(root, 'public', font)));
});

test('initial HTML contains database Indopak diacritics even before scripts execute', () => {
  const dom = new JSDOM(read('public/reader.html'));
  try {
    const payload = read('public/data/quran-indopak-v1.js');
    const source = JSON.parse(payload.match(/window\.RuqyahQuranSources\.indopak=(\{[^\n]*\});/)[1]);
    const nodes = [...dom.window.document.querySelectorAll('.verified-verse[data-key] .verified-arabic')];
    assert.equal(nodes.length, 840);
    for (const node of nodes) assert.equal(node.textContent, source[node.closest('.verified-verse').dataset.key]);
    assert.ok(source['1:6'].startsWith('\u0627\u0650'));
  } finally {dom.window.close();}
});

test('explicit script preference takes priority over a conflicting legacy font', async () => {
  const {dom, errors, ready} = reader({'ruqyah-arabic-font-v8': 'uthmani', 'ruqyah-arabic-script-v1': 'indopak'});
  await ready;
  try {
    const d = dom.window.document;
    assert.equal(d.documentElement.dataset.quranScript, 'indopak');
    assert.equal(d.getElementById('arabicFontSelect').value, 'noorehuda');
    assert.equal(d.querySelector('.verified-verse[data-key="1:6"] .verified-arabic').textContent, dom.window.RuqyahQuranSources.indopak['1:6']);
    assert.deepEqual(errors, []);
  } finally {dom.window.close();}
});
