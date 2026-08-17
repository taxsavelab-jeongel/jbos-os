/* ═══════════════════════════════════════════════════════════
   정엘기업연구소 — 사이트 인터랙션
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* 정엘 고정값: 모든 상담 신청 동선은 이 주소 하나로 통일한다. */
  var LP_URL = 'https://lp.jeongellab.com';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 헤더 / 내비게이션 ────────────────────────────────── */
  var header = $('#header');
  var nav = $('#nav');
  var toggle = $('#navToggle');
  var floatCta = $('.float-cta');

  /* 도구 상세 페이지는 배경이 흰색이라 헤더를 항상 solid 로 둔다.
     (기본 동작대로 두면 스크롤 0에서 solid 가 벗겨져 로고가 흰 배경에 흰 글자로 사라진다) */
  var alwaysSolid = true;   /* 전 페이지가 밝은 배경이므로 헤더는 항상 solid */
  if (alwaysSolid) header.classList.add('solid');

  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (!alwaysSolid) header.classList.toggle('solid', y > 40);
    if (floatCta) floatCta.classList.toggle('show', y > 620);
    updateProgress();
    updateSpy();
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });

  $$('#nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 스크롤 진행바 ────────────────────────────────────── */
  var progress = $('#scrollProgress');
  function updateProgress() {
    if (!progress) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.scrollY || window.pageYOffset;
    progress.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
  }

  /* ── 스크롤 등장 효과 (형제 요소는 순차로) ──────────────── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        /* 같은 부모 안에서 몇 번째인지에 따라 지연을 줘 카드가 하나씩 올라오게 한다 */
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (n) {
          return n.classList && n.classList.contains('reveal');
        });
        var i = sibs.indexOf(el);
        el.style.transitionDelay = (i > 0 ? Math.min(i, 6) * 70 : 0) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── 내비게이션 현재 위치 표시 (스크롤스파이) ─────────── */
  var spyLinks = $$('#nav a[href*="#"]').filter(function (a) {
    return a.getAttribute('href').indexOf('#') === 0;
  });
  var spyTargets = spyLinks.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  function updateSpy() {
    if (!spyLinks.length) return;
    var y = (window.scrollY || window.pageYOffset) + 140;
    var current = -1;
    spyTargets.forEach(function (t, i) { if (t && t.offsetTop <= y) current = i; });
    spyLinks.forEach(function (a, i) { a.classList.toggle('active', i === current); });
  }

  onScroll();

  /* ── 지표 카운트업 ────────────────────────────────────── */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var start = performance.now();
    var dur = 1400;
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = (parseInt(el.dataset.count, 10) || 0).toLocaleString(); });
  }

  /* ═══════════════ 전문 진단 도구 ═══════════════ */
  var CALCS = window.JEONGEL_CALCS || [];
  var tabsEl = $('#calcTabs');
  var panelEl = $('#calcPanel');
  var activeIndex = 0;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function buildTabs() {
    tabsEl.innerHTML = CALCS.map(function (c, i) {
      return '<button class="calc-tab" role="tab" id="tab-' + c.id + '" type="button" ' +
        'aria-selected="' + (i === 0) + '" aria-controls="calcPanel" data-i="' + i + '">' +
        '<b>' + esc(c.nav) + '</b><span>' + esc(c.navSub) + '</span></button>';
    }).join('');

    tabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.calc-tab');
      if (!btn) return;
      selectTab(parseInt(btn.dataset.i, 10));
    });

    tabsEl.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      var dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      var next = (activeIndex + dir + CALCS.length) % CALCS.length;
      selectTab(next);
      tabsEl.children[next].focus();
    });
  }

  function selectTab(i) {
    activeIndex = i;
    $$('.calc-tab', tabsEl).forEach(function (b, bi) {
      b.setAttribute('aria-selected', String(bi === i));
    });
    renderCalc(CALCS[i]);
  }

  function fieldHtml(f) {
    var id = 'f-' + f.k;
    var hint = f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '';
    if (f.type === 'select') {
      var opts = f.options.map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (o[0] === f.def ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      }).join('');
      return '<div class="field' + (f.wide ? ' wide' : '') + '">' +
        '<label for="' + id + '">' + esc(f.label) + hint + '</label>' +
        '<select id="' + id + '" data-k="' + f.k + '" data-type="select">' + opts + '</select></div>';
    }
    return '<div class="field">' +
      '<label for="' + id + '">' + esc(f.label) + hint + '</label>' +
      '<div class="input-wrap">' +
      '<input id="' + id + '" data-k="' + f.k + '" type="number" inputmode="decimal" step="any" value="' + f.def + '">' +
      '<span class="unit">' + esc(f.unit || '') + '</span></div></div>';
  }

  function renderCalc(c) {
    panelEl.setAttribute('aria-labelledby', 'tab-' + c.id);
    panelEl.innerHTML =
      '<h3 class="calc-title">' + esc(c.title) + '</h3>' +
      '<p class="calc-desc">' + esc(c.desc) + '</p>' +
      '<p class="calc-basis">' + esc(c.basis) + '</p>' +
      '<div class="calc-fields">' + c.fields.map(fieldHtml).join('') + '</div>' +
      '<div class="calc-actions">' +
      '<button type="button" class="btn-run" data-act="run">계산하기</button>' +
      '<button type="button" class="btn-reset" data-act="reset">초기값으로</button>' +
      '</div>' +
      '<div class="calc-result" id="calcResult"></div>';

    panelEl.querySelector('[data-act="run"]').addEventListener('click', function () { compute(c); });
    panelEl.querySelector('[data-act="reset"]').addEventListener('click', function () {
      renderCalc(c);
    });
    $$('input, select', panelEl).forEach(function (el) {
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') compute(c); });
    });

    compute(c);
  }

  function readValues(c) {
    var v = {};
    c.fields.forEach(function (f) {
      var el = panelEl.querySelector('[data-k="' + f.k + '"]');
      if (!el) { v[f.k] = f.def; return; }
      if (f.type === 'select') { v[f.k] = el.value; return; }
      var n = parseFloat(el.value);
      v[f.k] = isFinite(n) ? n : 0;
    });
    return v;
  }

  function compute(c) {
    var out = $('#calcResult');
    var res;
    try {
      res = c.run(readValues(c));
    } catch (err) {
      out.innerHTML = '<div class="calc-error">계산 중 문제가 발생했습니다. 입력값을 확인해 주십시오.</div>';
      return;
    }
    if (!res) { out.innerHTML = ''; return; }
    if (res.error) {
      out.innerHTML = '<div class="calc-error">' + esc(res.error) + '</div>';
      return;
    }

    var html = '';

    if (res.hero) {
      html += '<div class="result-hero">' +
        '<div class="r-label">' + esc(res.hero.label) + '</div>' +
        '<div class="r-value">' + esc(res.hero.value) + '</div>' +
        (res.hero.sub ? '<div class="r-sub">' + esc(res.hero.sub) + '</div>' : '') +
        '</div>';
    }

    if (res.compare) {
      html += '<div class="result-compare">' + res.compare.map(function (c2) {
        return '<div class="' + (c2.tone || 'neutral') + '">' +
          '<div class="c-label">' + esc(c2.label) + '</div>' +
          '<div class="c-value">' + esc(c2.value) + '</div></div>';
      }).join('') + '</div>';
    }

    if (res.table) {
      html += '<div class="result-rows"><div class="row total">' +
        '<span>' + esc(res.table.head[0]) + '</span><b>' + res.table.head.slice(1).map(esc).join(' · ') + '</b></div>';
      res.table.rows.forEach(function (r, ri) {
        html += '<div class="row' + (ri === res.table.highlight ? ' warn' : '') + '">' +
          '<span>' + esc(r[0]) + (ri === res.table.highlight ? ' ★' : '') + '</span>' +
          '<b>' + r.slice(1).map(esc).join(' · ') + '</b></div>';
      });
      html += '</div>';
    }

    if (res.rows) {
      html += '<div class="result-rows">' + res.rows.map(function (r) {
        return '<div class="row ' + (r[2] || '') + '"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
      }).join('') + '</div>';
    }

    if (res.notes) {
      html += '<ul class="result-notes">' + res.notes.map(function (n) {
        return '<li>' + esc(n) + '</li>';
      }).join('') + '</ul>';
    }

    if (res.cta) {
      html += '<div class="result-cta"><p>' + esc(res.cta) + '</p>' +
        '<a href="' + LP_URL + '">상담 신청하기</a></div>';
    }

    out.innerHTML = html;
  }

  /* 홈: 탭 7개 / 도구 상세 페이지: data-calc 로 지정된 계산기 하나만 */
  if (CALCS.length && panelEl) {
    var only = panelEl.getAttribute('data-calc');
    if (only) {
      var picked = CALCS.filter(function (c) { return c.id === only; })[0];
      if (picked) renderCalc(picked);
    } else if (tabsEl) {
      buildTabs();
      selectTab(0);
    }
  }

  /* ── 연도 ─────────────────────────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
