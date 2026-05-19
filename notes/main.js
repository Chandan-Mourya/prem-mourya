/* ============================================================
   Shared script for notes — search, expand/collapse, hotkeys
   ============================================================ */
(function(){
  var search      = document.getElementById('search');
  var noResults   = document.getElementById('noResults');
  var expandBtn   = document.getElementById('expandAll');
  var collapseBtn = document.getElementById('collapseAll');

  function normalize(s){ return (s || '').toLowerCase(); }

  // Search across Q&A cards or topic cards (whichever the page has)
  function runSearch(){
    if (!search) return;
    var q = normalize(search.value).trim();

    var qas = Array.from(document.querySelectorAll('details.qa'));
    if (qas.length){
      var anyMatch = false;
      if (!q){
        qas.forEach(function(d){ d.style.display = ''; d.open = false; });
        if (noResults) noResults.classList.remove('show');
        document.querySelectorAll('.section-divider').forEach(function(s){ s.style.display = ''; });
        return;
      }
      qas.forEach(function(d){
        var hit = normalize(d.textContent).indexOf(q) !== -1;
        d.style.display = hit ? '' : 'none';
        d.open          = hit;
        if (hit) anyMatch = true;
      });
      document.querySelectorAll('.section-divider').forEach(function(s){ s.style.display = 'none'; });
      if (noResults) noResults.classList.toggle('show', !anyMatch);
      return;
    }

    var cards = Array.from(document.querySelectorAll('.topic-card'));
    if (cards.length){
      var anyHit = false;
      cards.forEach(function(c){
        var hit = !q || normalize(c.textContent).indexOf(q) !== -1;
        c.style.display = hit ? '' : 'none';
        if (hit) anyHit = true;
      });
      if (noResults) noResults.classList.toggle('show', !anyHit);
    }
  }
  if (search) search.addEventListener('input', runSearch);

  function openFromUrlQuery() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (!q || !search) return;
    search.value = q;
    runSearch();
    var first = document.querySelector('details.qa:not([style*="display: none"])');
    if (first) {
      first.open = true;
      setTimeout(function () {
        first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }

  if (document.querySelector('details.qa')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', openFromUrlQuery);
    } else {
      openFromUrlQuery();
    }
  }

  // Expand / Collapse all
  if (expandBtn){
    expandBtn.addEventListener('click', function(){
      document.querySelectorAll('details.qa').forEach(function(d){
        if (d.style.display !== 'none') d.open = true;
      });
    });
  }
  if (collapseBtn){
    collapseBtn.addEventListener('click', function(){
      document.querySelectorAll('details.qa').forEach(function(d){ d.open = false; });
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e){
    var tag = (e.target && e.target.tagName) || '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA';

    if (e.key === '/' && !typing && search){
      e.preventDefault();
      search.focus();
      search.select();
    } else if (e.key === 'Escape' && search && document.activeElement === search){
      search.value = '';
      runSearch();
      search.blur();
    } else if ((e.key === 'e' || e.key === 'E') && !typing && !e.ctrlKey && !e.metaKey){
      document.querySelectorAll('details.qa').forEach(function(d){
        if (d.style.display !== 'none') d.open = true;
      });
    } else if ((e.key === 'c' || e.key === 'C') && !typing && !e.ctrlKey && !e.metaKey){
      document.querySelectorAll('details.qa').forEach(function(d){ d.open = false; });
    }
  });
})();
