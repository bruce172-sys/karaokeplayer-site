(() => {
  'use strict';

  const API_URL = 'https://api.github.com/repos/bruce172-sys/VegasKaraokePlayer/releases/latest';
  const CACHE_KEY = 'vegas-karaoke-latest-release-v1';
  const CACHE_TTL = 30 * 60 * 1000;
  const FALLBACK = {
    version: '2.3.1',
    title: 'Vegas Karaoke Player 2.3.1',
    date: '17/07/2026',
    download: 'https://github.com/bruce172-sys/VegasKaraokePlayer/releases/download/V.2.3.1/VegasKaraokePlayer_Setup_2_3_1.exe',
    notes: [
      'Ultima versione stabile disponibile per Windows.',
      'Monitor karaoke su tablet e telefono tramite QR Code.',
      'Fonico AI, ASIO, FX/VST live e strumenti professionali.'
    ]
  };

  function cleanVersion(value) {
    const text = String(value || '');
    const match = text.match(/(?:^|[^0-9])(\d+\.\d+\.\d+)(?:[^0-9]|$)/);
    return match ? match[1] : text.replace(/^v\.?/i, '').trim();
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
  }

  function parseNotes(markdown) {
    const lines = String(markdown || '')
      .replace(/\r/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => !/^#{1,6}\s/.test(line))
      .map(line => line.replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '').trim())
      .filter(Boolean);
    return lines.slice(0, 20);
  }

  function fromGithub(data) {
    const assets = Array.isArray(data.assets) ? data.assets : [];
    const installer = assets.find(asset => /^VegasKaraokePlayer_Setup_.*\.exe$/i.test(asset.name || ''))
      || assets.find(asset => /\.exe$/i.test(asset.name || ''));
    if (!installer || !installer.browser_download_url) {
      throw new Error('Installer EXE non trovato nella release più recente.');
    }
    const version = cleanVersion(data.tag_name || data.name);
    return {
      version,
      title: data.name || `Vegas Karaoke Player ${version}`,
      date: formatDate(data.published_at || data.created_at),
      download: installer.browser_download_url,
      notes: parseNotes(data.body),
      htmlUrl: data.html_url || ''
    };
  }

  function readCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && cached.savedAt && Date.now() - cached.savedAt < CACHE_TTL) {
        return cached.release;
      }
    } catch (_) {}
    return null;
  }

  function writeCache(release) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), release }));
    } catch (_) {}
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  }

  function updateNotes(notes) {
    document.querySelectorAll('[data-release-notes]').forEach(container => {
      container.replaceChildren();
      const items = notes && notes.length ? notes : FALLBACK.notes;
      items.forEach(note => {
        const item = document.createElement('span');
        item.textContent = `✅ ${note}`;
        container.appendChild(item);
      });
    });
  }

  function updateMeta(release) {
    const version = release.version;
    document.title = document.title.replace(/\d+\.\d+\.\d+/g, version);
    ['description'].forEach(name => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) meta.content = meta.content.replace(/\d+\.\d+\.\d+/g, version);
    });
    ['og:title', 'og:description'].forEach(prop => {
      const meta = document.querySelector(`meta[property="${prop}"]`);
      if (meta) meta.content = meta.content.replace(/\d+\.\d+\.\d+/g, version);
    });
    ['twitter:title', 'twitter:description'].forEach(name => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) meta.content = meta.content.replace(/\d+\.\d+\.\d+/g, version);
    });
    document.querySelectorAll('script[type="application/ld+json"]').forEach(node => {
      try {
        const data = JSON.parse(node.textContent);
        if (data && data['@type'] === 'SoftwareApplication') {
          data.softwareVersion = version;
          node.textContent = JSON.stringify(data);
        }
      } catch (_) {}
    });
  }

  function applyRelease(release) {
    const value = { ...FALLBACK, ...release };
    setText('[data-release-version]', value.version);
    setText('[data-release-title]', value.title);
    setText('[data-release-date]', value.date || FALLBACK.date);
    document.querySelectorAll('[data-release-download]').forEach(link => {
      link.href = value.download;
      const template = link.getAttribute('data-download-label');
      if (template) link.textContent = template.replace('{version}', value.version);
    });
    document.querySelectorAll('[data-release-page]').forEach(link => {
      if (value.htmlUrl) link.href = value.htmlUrl;
    });
    updateNotes(value.notes);
    updateMeta(value);
    document.documentElement.dataset.releaseLoaded = 'true';
  }

  async function loadLatestRelease() {
    const cached = readCache();
    if (cached) applyRelease(cached);
    else applyRelease(FALLBACK);

    try {
      const response = await fetch(API_URL, {
        headers: { 'Accept': 'application/vnd.github+json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
      const release = fromGithub(await response.json());
      writeCache(release);
      applyRelease(release);
    } catch (error) {
      console.warn('Aggiornamento automatico release non disponibile:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLatestRelease, { once: true });
  } else {
    loadLatestRelease();
  }
})();
