(() => {
  'use strict';
  const OPTIONS = {
    noorehuda: {family: 'Noorehuda', script: 'indopak', label: 'IndoPak · Noorehuda (ডিফল্ট)'},
    indopak: {family: 'AlQuran IndoPak', script: 'indopak', label: 'IndoPak · AlQuran'},
    uthmani: {family: 'Native Uthmani', script: 'uthmani', label: 'Uthmani · Native Uthmani'},
    hafs: {family: 'Ruqyah Hafs', script: 'uthmani', label: 'Hafs (Uthmani)'},
    mushaf: {family: 'Ruqyah AlMushaf', script: 'indopak', label: 'Al Mushaf Quran'},
    muhammadi: {family: 'Ruqyah Muhammadi', script: 'indopak', label: 'Muhammadi Quranic'},
    saleem: {family: 'Ruqyah Saleem', script: 'indopak', label: 'PDMS Saleem Quran'},
    alqalam: {family: 'Ruqyah AlQalam', script: 'indopak', label: 'Al Qalam Quran'},
    nabi: {family: 'Ruqyah Nabi', script: 'indopak', label: 'Nabi'},
    neirizi: {family: 'Ruqyah Neirizi', script: 'indopak', label: 'Neirizi'}
  };
  const dropdown = document.getElementById('arabicFontSelect');
  if (!dropdown) return;
  const storeKey = 'ruqyah-arabic-font-v8';
  const nodes = [...document.querySelectorAll('.verified-verse[data-key] .verified-arabic')];
  const previews = [...document.querySelectorAll('.font-example-arabic, .brand .ornament[lang="ar"]')];
  let currentFont = null;
  function updateFont(key) {
    if (!Object.hasOwn(OPTIONS, key)) key = 'noorehuda';
    const next = OPTIONS[key];
    const source = window.RuqyahQuranSources?.[next.script];
    // Validate the entire selection before changing either the text or the font.
    if (!source || typeof source['1:1'] !== 'string' || nodes.some(node =>
      typeof source[node.closest('.verified-verse').dataset.key] !== 'string')) {
      dropdown.value = currentFont || '';
      let error = document.getElementById('scriptureSourceError');
      if (!error) {
        error = document.createElement('p');
        error.id = 'scriptureSourceError'; error.setAttribute('role', 'alert');
        dropdown.parentElement.append(error);
      }
      error.textContent = 'নির্বাচিত আরবি পাঠ লোড হয়নি। ইন্টারনেট চালু করে পৃষ্ঠাটি আবার খুলুন।';
      return false;
    }
    document.getElementById('scriptureSourceError')?.remove();
    for (const node of nodes) {
      node.textContent = source[node.closest('.verified-verse').dataset.key];
    }
    for (const node of previews) node.textContent = source['1:1'];
    document.documentElement.style.setProperty('--arabic-font', "'" + next.family + "'");
    document.documentElement.dataset.quranScript = next.script;
    dropdown.value = key;
    document.getElementById('fontSelectionName').textContent = next.label;
    document.querySelectorAll('.active-font-name').forEach(node => { node.textContent = next.label; });
    currentFont = key;
    try { localStorage.setItem(storeKey, key); } catch (_) {}
    // Tajweed and search must refresh their snapshots from the newly selected source.
    window.dispatchEvent(new CustomEvent('ruqyah:scripture-changed', {detail: {script: next.script, font: key}}));
    return true;
  }
  dropdown.addEventListener('change', () => updateFont(dropdown.value));
  let saved;
  try { saved = localStorage.getItem(storeKey); } catch (_) {}
  updateFont(saved || 'noorehuda');
})();
