/* Global question search on notes/index.html — scans every topic page. */
(function () {
  'use strict';

  var input = document.getElementById('searchQuestions');
  var resultsEl = document.getElementById('questionResults');
  var statusEl = document.getElementById('questionSearchStatus');
  if (!input || !resultsEl || typeof NOTES_TOPICS === 'undefined') return;

  var index = null;
  var indexPromise = null;
  var MAX_RESULTS = 40;

  function normalize(s) {
    return (s || '').toLowerCase();
  }

  function cleanSummary(summary) {
    if (!summary) return '';
    var clone = summary.cloneNode(true);
    clone.querySelectorAll('.qa-tag').forEach(function (s) { s.remove(); });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function fetchTopic(topic) {
    return fetch(topic.url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        if (!html) return [];
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var nodes = Array.prototype.slice.call(doc.querySelectorAll('details.qa'));
        return nodes.map(function (d) {
          var title = cleanSummary(d.querySelector('summary')) || 'Untitled';
          var text = normalize(d.textContent);
          return {
            topic: topic.name,
            url: topic.url,
            title: title,
            titleNorm: normalize(title),
            text: text
          };
        });
      })
      .catch(function () { return []; });
  }

  function buildIndex() {
    if (index) return Promise.resolve(index);
    if (indexPromise) return indexPromise;

    if (statusEl) {
      statusEl.textContent = 'Loading questions from all topics…';
      statusEl.classList.add('loading');
    }

    indexPromise = Promise.all(NOTES_TOPICS.map(fetchTopic))
      .then(function (chunks) {
        index = [];
        chunks.forEach(function (items) {
          index = index.concat(items);
        });
        if (statusEl) {
          statusEl.textContent = index.length + ' questions indexed · type to search';
          statusEl.classList.remove('loading');
        }
        return index;
      })
      .catch(function () {
        if (statusEl) {
          statusEl.textContent = 'Could not load topics. Serve notes over HTTP (e.g. python -m http.server) and reload.';
          statusEl.classList.remove('loading');
        }
        index = [];
        return index;
      });

    return indexPromise;
  }

  function render(matches, q) {
    resultsEl.innerHTML = '';

    if (!q) {
      resultsEl.hidden = true;
      return;
    }

    resultsEl.hidden = false;

    if (!matches.length) {
      var empty = document.createElement('p');
      empty.className = 'question-results-empty';
      empty.textContent = 'No questions match “' + q + '”. Try another keyword.';
      resultsEl.appendChild(empty);
      return;
    }

    var note = document.createElement('p');
    note.className = 'question-results-meta';
    var shown = Math.min(matches.length, MAX_RESULTS);
    note.textContent = shown + (matches.length > MAX_RESULTS ? ' of ' + matches.length : '') + ' match' + (shown === 1 ? '' : 'es');
    resultsEl.appendChild(note);

    var list = document.createElement('div');
    list.className = 'question-results-list';

    matches.slice(0, MAX_RESULTS).forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'question-hit';
      a.href = item.url + '?q=' + encodeURIComponent(q);

      var titleEl = document.createElement('span');
      titleEl.className = 'question-hit-title';
      titleEl.textContent = item.title;

      var topicEl = document.createElement('span');
      topicEl.className = 'question-hit-topic';
      topicEl.textContent = item.topic;

      a.appendChild(titleEl);
      a.appendChild(topicEl);
      list.appendChild(a);
    });

    resultsEl.appendChild(list);
  }

  function runQuestionSearch() {
    var q = normalize(input.value).trim();
    buildIndex().then(function (idx) {
      if (!q) {
        render([], '');
        return;
      }
      var hits = idx.filter(function (item) {
        return item.titleNorm.indexOf(q) !== -1 || item.text.indexOf(q) !== -1;
      });
      hits.sort(function (a, b) {
        var at = a.titleNorm.indexOf(q);
        var bt = b.titleNorm.indexOf(q);
        if (at !== bt) return (at === -1 ? 99 : at) - (bt === -1 ? 99 : bt);
        return a.title.localeCompare(b.title);
      });
      render(hits, q);
    });
  }

  input.addEventListener('input', runQuestionSearch);

  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA';
    if (e.key === '?' && !typing && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  buildIndex();
})();
