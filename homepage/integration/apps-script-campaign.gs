/**
 * ═══════════════════════════════════════════════════════════════
 *  정엘-홈페이지상담-캠페인  (standalone Apps Script 프로젝트)
 *  홈페이지 상담 신청 → 마스터DB → 확인 메일
 *
 *  텔레그램 알림과 원본 백업은 공용 프로젝트가 담당한다.
 *  이 프로젝트는 폼 생성 + 확인 메일 발송만 책임진다.
 *
 *  실행 순서
 *    1) setupConsultForm()       ← 최초 1회. 폼 생성 + 마스터DB 연결 + 탭 이름 변경
 *    2) logLeadConfig()          ← 홈페이지에 붙여넣을 LEAD_CONFIG 출력
 *    3) diagTestConsultMail()    ← 메일 발송 단독 검증
 *    4) installConsultTrigger()  ← onFormSubmit 트리거 설치
 * ═══════════════════════════════════════════════════════════════
 */

var MASTER_ID  = '1kbCx3V4XzKbAi37LApBvnmxCb3Z7eo1-8pU7nM_zuN0'; // (원본)정엘가업승계 인디비 종합
var SHEET_NAME = '홈페이지 상담신청';
var FORM_TITLE = '[정엘] 홈페이지 상담 신청';
var CONSENT_VALUE = '동의합니다';
var TEL = '010-5500-9632';

var TOPICS = [
  '가업승계 증여·상속 설계',
  '비상장주식 가치평가·지분구조',
  '가지급금·차명주식 정리',
  '이익잉여금 인출·퇴직금 설계',
  '법인전환·영업권',
  '중소기업 M&A·매각'
];

/* ───────────────────────────────────────────────────────────────
   1) 폼 생성 — 멱등(idempotent).
   이미 만들어져 있으면 아무것도 새로 만들지 않고 기존 폼을 반환한다.
   (권한 승인 직후 의도치 않게 재실행되어도 폼이 중복 생성되지 않는다)
   ─────────────────────────────────────────────────────────────── */
function setupConsultForm() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty('FORM_ID');

  if (existing) {
    try {
      var f0 = FormApp.openById(existing);
      Logger.log('이미 생성된 폼이 있습니다. 새로 만들지 않습니다.\n  제목: %s\n  ID: %s', f0.getTitle(), existing);
      logLeadConfig();
      return f0;
    } catch (err) {
      Logger.log('기록된 FORM_ID(%s)를 열 수 없어 새로 생성합니다.', existing);
    }
  }

  var ss = SpreadsheetApp.openById(MASTER_ID);
  var before = ss.getSheets().map(function (s) { return s.getName(); });

  var form = FormApp.create(FORM_TITLE);
  form.setDescription(
    '정엘가업승계연구소 상담 신청서입니다.\n' +
    '남겨주신 정보는 상담 안내 목적으로만 사용하며, 24시간 이내에 연락드립니다.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage('신청이 접수되었습니다. 24시간 이내에 연락드리겠습니다. 급하신 경우 ' + TEL + ' 으로 연락 주십시오.');

  form.addTextItem().setTitle('성함').setRequired(true);
  form.addTextItem().setTitle('연락처').setHelpText('예: 010-0000-0000').setRequired(true);
  form.addTextItem().setTitle('이메일').setRequired(true);
  form.addTextItem().setTitle('회사명').setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('가장 급한 고민')
    .setChoiceValues(TOPICS)
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('남기실 말씀')
    .setHelpText('회사 업력, 업종, 대략적인 매출 규모를 함께 적어주시면 상담이 빨라집니다.')
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('개인정보 수집·이용 동의')
    .setHelpText('수집항목: 성함, 연락처, 이메일, 회사명 / 목적: 상담 안내 및 자료 제공 / ' +
      '보유기간: 목적 달성 후 지체 없이 파기. 동의를 거부하실 수 있으며, 거부 시 상담 안내가 제한될 수 있습니다.')
    .setChoiceValues([CONSENT_VALUE])
    .setRequired(true);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, MASTER_ID);
  SpreadsheetApp.flush();

  // 새로 생긴 응답 탭을 찾아 이름을 바꾼다
  var ss2 = SpreadsheetApp.openById(MASTER_ID);
  var added = ss2.getSheets().filter(function (s) { return before.indexOf(s.getName()) === -1; });
  if (added.length === 1) {
    if (ss2.getSheetByName(SHEET_NAME)) {
      Logger.log('경고: "%s" 탭이 이미 존재합니다. 새 탭(%s)의 이름을 바꾸지 않았습니다.', SHEET_NAME, added[0].getName());
    } else {
      added[0].setName(SHEET_NAME);
      Logger.log('응답 탭 이름을 "%s" 로 변경했습니다.', SHEET_NAME);
    }
  } else {
    Logger.log('경고: 새로 생긴 탭을 특정하지 못했습니다(%s개). 수동으로 "%s" 로 변경하십시오.', added.length, SHEET_NAME);
  }

  props.setProperty('FORM_ID', form.getId());

  Logger.log('폼 생성 완료\n  편집: %s\n  공개: %s', form.getEditUrl(), form.getPublishedUrl());
  logLeadConfig();
  return form;
}

/* ───────────────────────────────────────────────────────────────
   2) 홈페이지 assets/site.js 에 붙여넣을 LEAD_CONFIG 출력
   entry ID 는 미리채우기 URL에서 역으로 뽑아낸다.
   ─────────────────────────────────────────────────────────────── */
function logLeadConfig() {
  var formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!formId) { Logger.log('FORM_ID가 없습니다. setupConsultForm() 을 먼저 실행하십시오.'); return; }

  var form = FormApp.openById(formId);
  var map = buildEntryMap_(form);
  var action = form.getPublishedUrl().replace(/\/viewform.*$/, '/formResponse');

  var keyOf = function (title) {
    if (title.indexOf('성함') === 0) return 'name';
    if (title.indexOf('연락처') === 0) return 'phone';
    if (title.indexOf('이메일') === 0) return 'email';
    if (title.indexOf('회사명') === 0) return 'company';
    if (title.indexOf('가장 급한 고민') === 0) return 'topic';
    if (title.indexOf('남기실 말씀') === 0) return 'memo';
    if (title.indexOf('개인정보') === 0) return 'consent';
    return null;
  };

  var fields = { name: '', phone: '', email: '', company: '', topic: '', memo: '', consent: '' };
  Object.keys(map).forEach(function (title) {
    var k = keyOf(title);
    if (k) fields[k] = map[title];
  });

  var missing = Object.keys(fields).filter(function (k) { return !fields[k]; });

  var out = [
    '',
    '════════ 아래 블록을 homepage/assets/site.js 의 LEAD_CONFIG 와 통째로 교체하십시오 ════════',
    '',
    '  var LEAD_CONFIG = {',
    "    action: '" + action + "',",
    '    fields: {',
    "      name: '" + fields.name + "',",
    "      phone: '" + fields.phone + "',",
    "      email: '" + fields.email + "',",
    "      company: '" + fields.company + "',",
    "      topic: '" + fields.topic + "',",
    "      memo: '" + fields.memo + "',",
    "      consent: '" + fields.consent + "'",
    '    },',
    "    consentValue: '" + CONSENT_VALUE + "'",
    '  };',
    '',
    '══════════════════════════════════════════════════════════════════════════',
    missing.length ? '경고: 매칭되지 않은 항목이 있습니다 → ' + missing.join(', ') : '모든 항목이 정상 매칭되었습니다.',
    ''
  ].join('\n');

  Logger.log(out);
  return out;
}

/** 미리채우기 URL을 만들어 문항 제목 → entry ID 매핑을 추출한다(제출하지 않음). */
function buildEntryMap_(form) {
  var items = form.getItems();
  var resp = form.createResponse();
  var sentinel = {};

  items.forEach(function (it, i) {
    var t = it.getType();
    var s = '__JG' + i + '__';
    try {
      if (t === FormApp.ItemType.TEXT) {
        resp = resp.withItemResponse(it.asTextItem().createResponse(s));
        sentinel[s] = it.getTitle();
      } else if (t === FormApp.ItemType.PARAGRAPH_TEXT) {
        resp = resp.withItemResponse(it.asParagraphTextItem().createResponse(s));
        sentinel[s] = it.getTitle();
      } else if (t === FormApp.ItemType.MULTIPLE_CHOICE) {
        var c = it.asMultipleChoiceItem().getChoices()[0].getValue();
        resp = resp.withItemResponse(it.asMultipleChoiceItem().createResponse(c));
        sentinel[c] = it.getTitle();
      } else if (t === FormApp.ItemType.CHECKBOX) {
        var c2 = it.asCheckboxItem().getChoices()[0].getValue();
        resp = resp.withItemResponse(it.asCheckboxItem().createResponse([c2]));
        sentinel[c2] = it.getTitle();
      }
    } catch (err) {
      Logger.log('항목 "%s" 처리 중 건너뜀: %s', it.getTitle(), err);
    }
  });

  var url = resp.toPrefilledUrl();
  var qs = url.split('?')[1] || '';
  var map = {};
  qs.split('&').forEach(function (kv) {
    var p = kv.split('=');
    var key = decodeURIComponent(p[0] || '');
    var val = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    if (key.indexOf('entry.') === 0 && sentinel[val]) map[sentinel[val]] = key;
  });
  return map;
}

/* ───────────────────────────────────────────────────────────────
   3) 확인 메일 발송
   ─────────────────────────────────────────────────────────────── */
function sendConsultMail(e) {
  // 다른 캠페인 탭의 제출이면 즉시 종료
  try {
    if (!e || !e.range || e.range.getSheet().getName() !== SHEET_NAME) return;
  } catch (err) {
    Logger.log('시트 판별 실패, 종료: %s', err);
    return;
  }

  var v = e.namedValues || {};
  var pick = function (prefix) {
    var hit = Object.keys(v).filter(function (k) { return k.indexOf(prefix) === 0; })[0];
    if (!hit) return '';
    var arr = v[hit];
    return (arr && arr[0] ? String(arr[0]) : '').trim();
  };

  var name    = pick('성함');
  var phone   = pick('연락처');
  var email   = pick('이메일');
  var company = pick('회사명');
  var topic   = pick('가장 급한 고민');
  var memo    = pick('남기실 말씀');
  var consent = pick('개인정보');

  if (!consent) { Logger.log('개인정보 미동의 — 발송하지 않습니다. (%s)', company); return; }
  if (!email || email.indexOf('@') === -1) { Logger.log('이메일 없음 — 발송하지 않습니다. (%s)', company); return; }

  var subject = '[정엘가업승계연구소] 상담 신청이 접수되었습니다';
  var body =
    (name || '대표') + '님, 안녕하십니까.\n' +
    '정엘가업승계연구소입니다. 상담 신청이 정상적으로 접수되었습니다.\n\n' +
    '─────────────────────────────\n' +
    ' 회사명   : ' + company + '\n' +
    ' 성함     : ' + name + '\n' +
    ' 연락처   : ' + phone + '\n' +
    (topic ? ' 상담 주제 : ' + topic + '\n' : '') +
    (memo ? ' 남기신 말씀 : ' + memo + '\n' : '') +
    '─────────────────────────────\n\n' +
    '■ 앞으로의 진행\n' +
    '  1. 담당 컨설턴트가 24시간 이내에 연락드립니다.\n' +
    '  2. 대면 상담으로 회사의 실제 상황을 파악합니다.\n' +
    '     (1회 상담료 30만 원 / 출장 시 출장비 별도)\n' +
    '  3. 상담 이후 필요한 범위를 정해 설계안을 제안드립니다.\n\n' +
    '■ 미리 준비해 두시면 상담이 빨라집니다\n' +
    '  · 최근 3개 사업연도 재무제표\n' +
    '  · 주주명부\n' +
    '  · 정관\n\n' +
    '승계는 하나의 문제가 아니라 세무·법무·노무가 서로 얽힌 구조의 문제입니다.\n' +
    '기업이 건강하게 성장할 구조 자체를 함께 설계하겠습니다.\n\n' +
    '문의 ' + TEL + '\n' +
    '정엘가업승계연구소 · 서울 서초구 반포대로 79, 5층\n' +
    '"승계가 필요한 그 순간을 넘어, 진심을 담은 실력으로 보답하겠습니다."\n';

  MailApp.sendEmail({ to: email, subject: subject, body: body, name: '정엘가업승계연구소 정선의' });
  Logger.log('확인 메일 발송 완료 → %s (%s)', email, company);
}

/* ───────────────────────────────────────────────────────────────
   4) 진단 테스트 — 트리거 설치 전에 메일 로직만 단독 검증
   ─────────────────────────────────────────────────────────────── */
function diagTestConsultMail() {
  var sheet = SpreadsheetApp.openById(MASTER_ID).getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log('"%s" 탭이 없습니다. setupConsultForm() 을 먼저 실행하십시오.', SHEET_NAME); return; }

  sendConsultMail({
    range: sheet.getRange(1, 1),
    namedValues: {
      '성함': ['[테스트] 홍길동'],
      '연락처': ['010-0000-0000'],
      '이메일': [Session.getActiveUser().getEmail()],
      '회사명': ['[테스트] (주)정엘산업'],
      '가장 급한 고민': [TOPICS[0]],
      '남기실 말씀': ['진단 테스트입니다.'],
      '개인정보 수집·이용 동의': [CONSENT_VALUE]
    }
  });
}

/* ───────────────────────────────────────────────────────────────
   5) 트리거 설치 — standalone 프로젝트는 UI에 「스프레드시트에서」가
   없으므로 반드시 코드로 설치한다. 중복 설치를 먼저 제거해 멱등하게 만든다.
   ─────────────────────────────────────────────────────────────── */
function installConsultTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendConsultMail') { ScriptApp.deleteTrigger(t); removed++; }
  });

  ScriptApp.newTrigger('sendConsultMail')
    .forSpreadsheet(SpreadsheetApp.openById(MASTER_ID))
    .onFormSubmit()
    .create();

  Logger.log('트리거 설치 완료 (기존 %s개 제거 후 1개 생성)', removed);
}

/* ───────────────────────────────────────────────────────────────
   6) 사고 복구 — 폼이 중복 생성됐을 때만 사용.
   데이터가 있는 탭은 절대 지우지 않는다(헤더만 있는 탭만 삭제).
   ─────────────────────────────────────────────────────────────── */
function cleanupDuplicateResponseSheets() {
  var ss = SpreadsheetApp.openById(MASTER_ID);
  ss.getSheets().forEach(function (s) {
    var n = s.getName();
    if (/^설문지 응답 시트\d*$/.test(n) && s.getLastRow() <= 1) {
      ss.deleteSheet(s);
      Logger.log('빈 응답 탭 삭제: %s', n);
    } else if (/^설문지 응답 시트\d*$/.test(n)) {
      Logger.log('데이터가 있어 삭제하지 않음: %s (행 %s)', n, s.getLastRow());
    }
  });
}
