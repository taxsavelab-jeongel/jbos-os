/* ═══════════════════════════════════════════════════════════
   정엘가업승계연구소 — 사이트 인터랙션
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 헤더 / 내비게이션 ────────────────────────────────── */
  var header = $('#header');
  var nav = $('#nav');
  var toggle = $('#navToggle');
  var floatCta = $('.float-cta');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('solid', y > 40);
    if (floatCta) floatCta.classList.toggle('show', y > 620);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  /* ── 스크롤 등장 효과 ─────────────────────────────────── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

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
        '<a href="#contact">상담 신청하기</a></div>';
    }

    out.innerHTML = html;
  }

  if (CALCS.length && tabsEl && panelEl) {
    buildTabs();
    selectTab(0);
  }

  /* ── 상담 신청 폼 ─────────────────────────────────────── */
  var form = $('#leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('#formNote');
      var data = new FormData(form);
      var company = (data.get('company') || '').toString().trim();
      var name = (data.get('name') || '').toString().trim();
      var phone = (data.get('phone') || '').toString().trim();

      if (!company || !name || !phone) {
        note.className = 'form-note err';
        note.textContent = '회사명 · 대표자 성함 · 연락처는 반드시 입력해 주십시오.';
        return;
      }

      var body = [
        '회사명: ' + company,
        '대표자: ' + name,
        '연락처: ' + phone,
        '상담 주제: ' + data.get('topic'),
        '',
        (data.get('memo') || '').toString()
      ].join('\n');

      note.className = 'form-note';
      note.textContent = '메일 작성 창을 엽니다. 전송해 주시면 24시간 이내에 연락드리겠습니다.';
      window.location.href = 'mailto:taxsavelab@gmail.com'
        + '?subject=' + encodeURIComponent('[상담신청] ' + company + ' ' + name + ' 대표님')
        + '&body=' + encodeURIComponent(body);
    });
  }

  /* ── 연도 ─────────────────────────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
