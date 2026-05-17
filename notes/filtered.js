/* ============================================================
   Cross-topic filtered list (hot.html / must.html)
   ------------------------------------------------------------
   Reads <body data-filter="hot|must"> to decide which tag to
   pull. Fetches every topic page in TOPICS, parses with
   DOMParser, and clones each <details class="qa"> whose
   <summary> carries the matching <span class="qa-tag {filter}">.
   The original topic pages are NEVER mutated — this page acts
   as a live read-only view of them.
   ============================================================ */
(function () {
  'use strict';

  // Every topic page that uses the qa-tag system.
  // dsa.html is intentionally excluded — its problem entries
  // don't follow the same `must`/`hot` interview-tag convention.
  var TOPICS = [
    { url: 'behavioral.html',    name: 'Behavioral' },
    { url: 'core-java.html',     name: 'Core Java' },
    { url: 'concurrency.html',   name: 'Concurrency' },
    { url: 'spring-core.html',   name: 'Spring Core' },
    { url: 'spring-boot.html',   name: 'Spring Boot' },
    { url: 'rest-security.html', name: 'REST & Security' },
    { url: 'sql.html',           name: 'SQL & RDBMS' },
    { url: 'mongodb.html',       name: 'MongoDB' },
    { url: 'elasticsearch.html', name: 'Elasticsearch' },
    { url: 'microservices.html', name: 'Microservices' },
    { url: 'messaging.html',     name: 'Messaging' },
    { url: 'system-design.html', name: 'System Design' },
    { url: 'cloud.html',         name: 'Cloud (AWS / Azure)' },
    { url: 'docker-k8s.html',    name: 'Docker & Kubernetes' },
    { url: 'cicd.html',          name: 'CI/CD & Git' },
    { url: 'production.html',    name: 'Production Debugging' },
    { url: 'ai-llm.html',        name: 'AI / LLM' },
    { url: 'puzzles.html',       name: 'Code Puzzles' }
  ];

  var filter = (document.body.getAttribute('data-filter') || '').trim();
  if (filter !== 'hot' && filter !== 'must') return;

  var listEl   = document.getElementById('qaList');
  var loaderEl = document.getElementById('loader');
  var countEl  = document.getElementById('count');
  if (!listEl) return;

  function slugify(text) {
    return (text || '')
      .toLowerCase()
      .replace(/&[a-z]+;/g, ' ')   // strip HTML entities (e.g. &amp;)
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  function cleanSummary(summary) {
    if (!summary) return '';
    var clone = summary.cloneNode(true);
    clone.querySelectorAll('.qa-tag').forEach(function (s) { s.remove(); });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function buildSourceLink(topic, slug) {
    var wrap = document.createElement('div');
    wrap.className = 'source-link';
    var icon = document.createElement('i');
    icon.className = 'bi bi-link-45deg';
    var label = document.createElement('span');
    label.textContent = 'View on ';
    var link = document.createElement('a');
    link.href = topic.url + '#' + slug;
    link.textContent = topic.name;
    wrap.appendChild(icon);
    wrap.appendChild(label);
    wrap.appendChild(link);
    return wrap;
  }

  function fetchTopic(topic) {
    return fetch(topic.url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        if (!html) return { topic: topic, items: [] };
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var nodes = Array.prototype.slice.call(doc.querySelectorAll('details.qa'));
        var items = nodes.filter(function (d) {
          var sum = d.querySelector('summary');
          return sum && sum.querySelector('.qa-tag.' + filter);
        });
        return { topic: topic, items: items };
      })
      .catch(function () { return { topic: topic, items: [] }; });
  }

  function render(results) {
    if (loaderEl && loaderEl.parentNode) loaderEl.parentNode.removeChild(loaderEl);

    var frag = document.createDocumentFragment();
    var total = 0;
    var usedSlugs = Object.create(null);

    results.forEach(function (r) {
      r.items.forEach(function (d) {
        var summary = d.querySelector('summary');
        var title = cleanSummary(summary) || 'untitled';
        var baseSlug = slugify(title) || 'qa';
        var slug = baseSlug;
        var n = 2;
        while (usedSlugs[slug]) { slug = baseSlug + '-' + n; n++; }
        usedSlugs[slug] = true;

        var clone = d.cloneNode(true);
        clone.id = slug;
        clone.removeAttribute('open');

        var body = clone.querySelector('.qa-body');
        if (body) {
          body.insertBefore(buildSourceLink(r.topic, slug), body.firstChild);
        }

        frag.appendChild(clone);
        total++;
      });
    });

    listEl.appendChild(frag);
    if (countEl) countEl.textContent = String(total);

    if (total === 0) {
      var empty = document.createElement('p');
      empty.className = 'filter-empty';
      empty.textContent = 'No questions tagged "' + filter + '" were found across the topic pages.';
      listEl.appendChild(empty);
    }
  }

  function init() {
    Promise.all(TOPICS.map(fetchTopic)).then(render).catch(function (err) {
      if (loaderEl) {
        loaderEl.innerHTML = '';
        var msg = document.createElement('span');
        msg.textContent = 'Failed to load topic pages. If you opened this file directly, ' +
          'serve the notes folder over HTTP (e.g. `python -m http.server`) and reload.';
        loaderEl.appendChild(msg);
      }
      // eslint-disable-next-line no-console
      console.error('filtered.js: load failed', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
