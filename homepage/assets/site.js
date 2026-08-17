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

  /* ═══════════════ 상담 신청 폼 → 리드 자동화 ═══════════════
     구글폼 formResponse 엔드포인트로 전송한다.
     → 마스터DB "홈페이지 상담신청" 탭에 행 추가
     → 공용 Apps Script의 onFormSubmit 트리거가 텔레그램 알림 + 원본백업
     → 캠페인 Apps Script가 신청자에게 확인 메일 발송

     아래 LEAD_CONFIG 값은 integration/apps-script-campaign.gs 의
     setupConsultForm() 을 한 번 실행하면 실행 로그에 그대로 출력된다.
     값이 비어 있으면 자동으로 메일 작성 창 방식으로 대체 동작한다.
     ═══════════════════════════════════════════════════════ */
  var LEAD_CONFIG = {
    action: '',            // 예: https://docs.google.com/forms/d/e/1FAIpQL.../formResponse
    fields: {
      name: '',            // 성함
      phone: '',           // 연락처
      email: '',           // 이메일
      company: '',         // 회사명
      topic: '',           // 가장 급한 고민
      memo: '',            // 남기실 말씀
      consent: ''          // 개인정보 수집·이용 동의
    },
    consentValue: '동의합니다'
  };

  var form = $('#leadForm');
  if (form) {
    var note = $('#formNote');
    var submitBtn = $('#leadSubmit');
    var done = $('#formDone');
    var sending = false;

    var wired = !!(LEAD_CONFIG.action && LEAD_CONFIG.fields.name && LEAD_CONFIG.fields.phone);

    function fail(msg) {
      note.className = 'form-note err';
      note.textContent = msg;
    }

    function showDone() {
      form.hidden = true;
      var lead = $('.contact-card-lead');
      if (lead) lead.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;

      var data = new FormData(form);
      var val = function (k) { return (data.get(k) || '').toString().trim(); };

      if (val('website')) return;            // 봇 차단 (허니팟)

      var name = val('name'), phone = val('phone'), email = val('email'), company = val('company');

      if (!name || !phone || !email || !company) {
        return fail('성함 · 연락처 · 이메일 · 회사명은 반드시 입력해 주십시오.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail('이메일 주소를 다시 확인해 주십시오.');
      }
      if (!/[0-9]{9,}/.test(phone.replace(/[^0-9]/g, ''))) {
        return fail('연락처를 숫자 9자리 이상으로 입력해 주십시오.');
      }
      if (!data.get('consent')) {
        return fail('개인정보 수집·이용에 동의해 주셔야 신청이 접수됩니다.');
      }

      /* 연동 전에는 메일 작성 창으로 대체 */
      if (!wired) {
        note.className = 'form-note';
        note.textContent = '메일 작성 창을 엽니다. 전송해 주시면 24시간 이내에 연락드리겠습니다.';
        var body = [
          '성함: ' + name, '연락처: ' + phone, '이메일: ' + email, '회사명: ' + company,
          '상담 주제: ' + val('topic'), '', val('memo')
        ].join('\n');
        window.location.href = 'mailto:taxsavelab@gmail.com'
          + '?subject=' + encodeURIComponent('[상담신청] ' + company + ' ' + name + ' 대표님')
          + '&body=' + encodeURIComponent(body);
        return;
      }

      sending = true;
      submitBtn.disabled = true;
      submitBtn.textContent = '전송 중입니다…';
      note.className = 'form-note';
      note.textContent = '';

      var f = LEAD_CONFIG.fields;
      var payload = new URLSearchParams();
      payload.append(f.name, name);
      payload.append(f.phone, phone);
      payload.append(f.email, email);
      payload.append(f.company, company);
      if (f.topic) payload.append(f.topic, val('topic'));
      if (f.memo && val('memo')) payload.append(f.memo, val('memo'));
      if (f.consent) payload.append(f.consent, LEAD_CONFIG.consentValue);

      /* 구글폼은 CORS 응답을 주지 않으므로 no-cors 로 보내고 완료로 간주한다. */
      fetch(LEAD_CONFIG.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString()
      }).then(showDone).catch(function () {
        sending = false;
        submitBtn.disabled = false;
        submitBtn.textContent = '상담 신청서 보내기';
        fail('전송에 실패했습니다. 010-5500-9632 로 연락 주시면 바로 도와드리겠습니다.');
      });
    });
  }

  /* ── 연도 ─────────────────────────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
