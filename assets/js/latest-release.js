(function () {
  'use strict';

  var REPO = 'bruce172-sys/VegasKaraokePlayer';
  var API = 'https://api.github.com/repos/' + REPO + '/releases/latest';

  function versionFrom(value) {
    var text = String(value || '');
    var match = text.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : '';
  }

  function dateIt(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return ('0' + d.getDate()).slice(-2) + '/' +
      ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }

  function notesFrom(body) {
    return String(body || '')
      .replace(/\r/g, '')
      .split('\n')
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line && !/^#{1,6}\s/.test(line); })
      .map(function (line) {
        return line
          .replace(/^[-*+]\s+/, '')
          .replace(/^\d+[.)]\s+/, '')
          .replace(/\*\*/g, '')
          .trim();
      })
      .filter(Boolean)
      .slice(0, 20);
  }

  function findInstaller(assets) {
    var list = Array.isArray(assets) ? assets : [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (/^VegasKaraokePlayer_Setup_.*\.exe$/i.test(list[i].name || '')) return list[i];
    }
    for (i = 0; i < list.length; i += 1) {
      if (/\.exe$/i.test(list[i].name || '')) return list[i];
    }
    return null;
  }

  function setText(selector, text) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = text;
  }

  function updateNotes(notes) {
    if (!notes.length) return;
    var boxes = document.querySelectorAll('[data-release-notes]');
    for (var i = 0; i < boxes.length; i += 1) {
      var box = boxes[i];
      var fragment = document.createDocumentFragment();
      for (var j = 0; j < notes.length; j += 1) {
        var item = document.createElement('span');
        item.textContent = '✅ ' + notes[j];
        fragment.appendChild(item);
      }
      while (box.firstChild) box.removeChild(box.firstChild);
      box.appendChild(fragment);
    }
  }

  function apply(data) {
    if (!data || data.draft || data.prerelease) return;

    var version = versionFrom(data.tag_name || data.name);
    var installer = findInstaller(data.assets);
    if (!version || !installer || !installer.browser_download_url) return;

    setText('[data-release-version]', version);
    var published = dateIt(data.published_at || data.created_at);
    if (published) setText('[data-release-date]', published);

    var links = document.querySelectorAll('[data-release-download]');
    for (var i = 0; i < links.length; i += 1) {
      links[i].href = installer.browser_download_url;
      var template = links[i].getAttribute('data-download-label');
      if (template) links[i].textContent = template.replace('{version}', version);
    }

    updateNotes(notesFrom(data.body));
  }

  function start() {
    // Il contenuto HTML resta sempre visibile. In caso di qualsiasi errore non viene modificato nulla.
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
    var url = API + '?nocache=' + Date.now();
    var options = { cache: 'no-store' };
    if (controller) options.signal = controller.signal;

    fetch(url, options)
      .then(function (response) {
        if (!response.ok) throw new Error('GitHub API ' + response.status);
        return response.json();
      })
      .then(apply)
      .catch(function (error) {
        // Errore ignorato intenzionalmente: la pagina deve restare utilizzabile con i dati statici.
        if (window.console && console.warn) console.warn('Aggiornamento release non disponibile:', error);
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(start, 250);
      }, { once: true });
    } else {
      setTimeout(start, 250);
    }
  } catch (error) {
    if (window.console && console.warn) console.warn('Script release disattivato:', error);
  }
}());
