/* ═══════════════════════════════════════════════════════════
   정엘기업연구소 — 전문 진단 도구 엔진
   현행 상증법 / 조특법 / 소득세법 / 법인세법 기준 간이 추정
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── 세율표 [상한, 세율, 누진공제] ───────────────────── */
  var TABLE = {
    // 상속세 및 증여세법 제26조
    gift: [
      [1e8, 0.10, 0],
      [5e8, 0.20, 1e7],
      [1e9, 0.30, 6e7],
      [3e9, 0.40, 1.6e8],
      [Infinity, 0.50, 4.6e8]
    ],
    // 소득세법 제55조 (지방소득세 별도)
    income: [
      [14e6, 0.06, 0],
      [50e6, 0.15, 1.26e6],
      [88e6, 0.24, 5.76e6],
      [150e6, 0.35, 15.44e6],
      [300e6, 0.38, 19.94e6],
      [500e6, 0.40, 25.94e6],
      [1000e6, 0.42, 35.94e6],
      [Infinity, 0.45, 65.94e6]
    ],
    // 법인세법 제55조 (지방소득세 별도)
    corp: [
      [2e8, 0.09, 0],
      [2e10, 0.19, 2e7],
      [3e11, 0.21, 4.2e8],
      [Infinity, 0.24, 9.42e9]
    ]
  };

  var LOCAL = 1.1;          // 지방소득세 10% 포함 계수
  var FILING_CREDIT = 0.97; // 신고세액공제 3%
  var LOAN_RATE = 0.046;    // 당좌대출이자율 (기재부 고시)
  var EARN_RATE = 0.10;     // 순손익가치 환원율

  /* ── 계산 유틸 ───────────────────────────────────────── */
  function progressive(base, table) {
    if (!(base > 0)) return 0;
    for (var i = 0; i < table.length; i++) {
      if (base <= table[i][0]) return base * table[i][1] - table[i][2];
    }
    return 0;
  }

  function marginal(base, table) {
    for (var i = 0; i < table.length; i++) {
      if (base <= table[i][0]) return table[i][1];
    }
    return table[table.length - 1][1];
  }

  /** 금액을 "12억 3,400만 원" 형태로 표기 */
  function won(v) {
    if (!isFinite(v)) return '—';
    var neg = v < 0;
    v = Math.round(Math.abs(v));
    if (v === 0) return '0원';
    var eok = Math.floor(v / 1e8);
    var man = Math.floor((v % 1e8) / 1e4);
    var out = '';
    if (eok) out += eok.toLocaleString() + '억 ';
    if (man) out += man.toLocaleString() + '만 ';
    if (!eok && !man) out = v.toLocaleString() + ' ';
    return (neg ? '-' : '') + out.trim() + '원';
  }

  function pct(v) { return (Math.round(v * 1000) / 10).toLocaleString() + '%'; }
  function num(v) { return Math.round(v).toLocaleString(); }

  /** 임원 퇴직소득세 (소득세법 제48조 환산급여 방식) */
  function severanceTax(pay, years) {
    years = Math.max(1, Math.round(years));
    var yd; // 근속연수공제
    if (years <= 5) yd = 1e6 * years;
    else if (years <= 10) yd = 5e6 + 2e6 * (years - 5);
    else if (years <= 20) yd = 15e6 + 2.5e6 * (years - 10);
    else yd = 40e6 + 3e6 * (years - 20);

    var after = Math.max(0, pay - yd);
    var conv = after / years * 12; // 환산급여

    var cd; // 환산급여공제
    if (conv <= 8e6) cd = conv;
    else if (conv <= 70e6) cd = 8e6 + (conv - 8e6) * 0.6;
    else if (conv <= 100e6) cd = 45.2e6 + (conv - 70e6) * 0.55;
    else if (conv <= 300e6) cd = 61.7e6 + (conv - 100e6) * 0.45;
    else cd = 151.7e6 + (conv - 300e6) * 0.35;

    var base = Math.max(0, conv - cd);
    var calc = progressive(base, TABLE.income) / 12 * years;
    return { tax: calc, total: calc * LOCAL, base: base, yearDeduct: yd };
  }

  /** 가업승계 증여특례 한도 (조특법 §30의6) */
  function specialLimit(years) {
    if (years >= 30) return 600e8;
    if (years >= 20) return 400e8;
    if (years >= 10) return 300e8;
    return 0;
  }

  /** 특례세율: 과세표준 120억 이하 10%, 초과분 20% */
  function specialRateTax(base) {
    if (base <= 0) return 0;
    return base <= 120e8 ? base * 0.10 : 12e8 + (base - 120e8) * 0.20;
  }

  /* ═══════════════════════════════════════════════════════
     진단 도구 정의
     ═══════════════════════════════════════════════════════ */
  var CALCS = [

    /* ── 01. 가업승계 증여세 비교 시뮬레이터 ────────────── */
    {
      id: 'succession',
      nav: '승계세액 비교 시뮬레이터',
      navSub: '특례 적용 vs 일반 증여',
      title: '승계세액 비교 시뮬레이터',
      desc: '자녀에게 주식을 넘길 때, 가업승계 증여특례를 적용하는 경우와 일반 증여세율을 적용하는 경우의 세액 차이를 계산합니다.',
      basis: '조세특례제한법 제30조의6 · 상속세 및 증여세법 제26조 기준',
      fields: [
        { k: 'stock', label: '증여할 주식 평가액', unit: '억 원', def: 50, hint: '비상장주식은 상증법 보충적 평가액 기준입니다. 모르시면 아래 「기업가치 평가 시뮬레이터」를 먼저 이용하십시오.' },
        { k: 'years', label: '부모(증여자)의 가업 영위기간', unit: '년', def: 20, hint: '창업일이 아니라 세법상 가업 영위기간입니다. 주된 업종이 바뀌었다면 그 시점부터 다시 셉니다.' },
        { k: 'nonbiz', label: '사업무관자산 비율', unit: '%', def: 10, hint: '가지급금, 만기 3개월 초과 금융상품, 임대부동산, 과다보유 현금 등이 총자산에서 차지하는 비율입니다.' }
      ],
      run: function (v) {
        var V = v.stock * 1e8;
        var limit = specialLimit(v.years);
        var bizAsset = V * (1 - v.nonbiz / 100);

        var general = progressive(Math.max(0, V - 5e7), TABLE.gift) * FILING_CREDIT;

        if (limit === 0) {
          return {
            hero: { label: '가업승계 증여특례', value: '적용 불가', sub: '부모의 가업 영위기간이 10년 미만이면 특례 대상이 아닙니다. 현재 조건에서는 일반 증여세율이 적용됩니다.' },
            rows: [
              ['증여할 주식 평가액', won(V)],
              ['증여재산공제 (직계비속)', '-' + won(5e7)],
              ['과세표준', won(Math.max(0, V - 5e7))],
              ['일반 증여세 (신고세액공제 3% 반영)', won(general), 'total']
            ],
            notes: [
              '가업 영위기간 기산점은 창업일·법인전환일·주된 업종 변경일 중 무엇을 적용하느냐에 따라 결론이 달라집니다.',
              '요건 충족 시점을 역산해 승계 로드맵을 세우고, 증여 외 승계 수단도 함께 검토하셔야 합니다.'
            ]
          };
        }

        var covered = Math.min(bizAsset, limit);              // 특례 적용 대상 과세가액
        var sBase = Math.max(0, covered - 10e8);              // 10억 공제
        var sTax = specialRateTax(sBase);                     // 특례세율 (신고세액공제 배제)
        var rest = Math.max(0, V - covered);                  // 특례 밖 금액
        var rTax = progressive(Math.max(0, rest - 5e7), TABLE.gift) * FILING_CREDIT;
        var withSpecial = sTax + rTax;
        var save = general - withSpecial;

        return {
          hero: {
            label: '특례 적용 시 절감 예상액',
            value: won(save),
            sub: '동일한 주식을 특례 없이 증여하면 ' + won(general) + ', 특례를 적용하면 ' + won(withSpecial) + '입니다.'
          },
          compare: [
            { label: '일반 증여세율 적용', value: won(general), tone: 'neutral' },
            { label: '가업승계 증여특례 적용', value: won(withSpecial), tone: 'accent' }
          ],
          rows: [
            ['증여할 주식 평가액', won(V)],
            ['가업자산상당액 (사업무관자산 제외)', won(bizAsset)],
            ['영위기간 ' + v.years + '년 기준 특례 한도', won(limit)],
            ['특례 적용 과세가액', won(covered)],
            ['가업승계 증여재산공제', '-' + won(Math.min(covered, 10e8))],
            ['특례 과세표준', won(sBase)],
            ['특례세율 적용 세액 (10% · 120억 초과분 20%)', won(sTax)],
            ['특례 제외분 일반 증여세', won(rTax)],
            ['특례 적용 시 총 증여세', won(withSpecial), 'total']
          ],
          notes: [
            '특례세율이 적용되는 부분에는 신고세액공제 3%가 적용되지 않습니다.',
            '사업무관자산 비율만큼 특례 대상에서 제외됩니다. 가지급금 정리가 세액에 직접 영향을 주는 이유입니다.',
            '증여세 신고기한까지 가업 종사, 3년 이내 대표이사 취임, 5년 사후관리 요건을 지키지 못하면 특례가 취소되고 이자상당액까지 추징됩니다.',
            '증여자는 만 60세 이상, 수증자는 만 18세 이상이어야 합니다.'
          ],
          cta: '특례 한도와 사업무관자산 비율은 재무제표를 봐야 확정됩니다. 정확한 진단을 받아보십시오.'
        };
      }
    },

    /* ── 02. 상속세 부담 진단기 ─────────────────────────── */
    {
      id: 'inheritance',
      nav: '상속세 부담 진단기',
      navSub: '공제 반영 예상 납부세액',
      title: '상속세 부담 진단기',
      desc: '지금 상속이 개시된다면 가족이 부담할 상속세를 일괄공제·배우자공제·금융재산공제·가업상속공제를 반영해 추정합니다.',
      basis: '상속세 및 증여세법 제18조의2·제19조·제21조·제22조 기준',
      fields: [
        { k: 'total', label: '총 상속재산 (주식 포함)', unit: '억 원', def: 100 },
        { k: 'debt', label: '채무 · 공과금 · 장례비', unit: '억 원', def: 5 },
        { k: 'spouse', label: '배우자 생존 여부', type: 'select', def: '1', options: [['1', '생존 (배우자 상속공제 적용)'], ['0', '해당 없음']] },
        { k: 'children', label: '자녀 수', unit: '명', def: 2 },
        { k: 'financial', label: '순금융재산 (예금·보험·채권)', unit: '억 원', def: 10, hint: '금융재산에서 금융채무를 뺀 금액입니다. 20%를 최대 2억 원까지 공제합니다.' },
        { k: 'gaup', label: '가업상속공제 대상 가업재산', unit: '억 원', def: 0, hint: '요건을 충족하지 못하면 0으로 두십시오.' },
        { k: 'gaupYears', label: '가업 영위기간', unit: '년', def: 20 }
      ],
      run: function (v) {
        var gross = Math.max(0, v.total * 1e8 - v.debt * 1e8);
        var lump = 5e8;
        var spouseDed = 0;
        if (v.spouse === '1') {
          var legal = gross * (1.5 / (1.5 + Math.max(0, v.children)));
          spouseDed = Math.min(Math.max(5e8, legal), 30e8);
        }
        var finDed = Math.min(Math.max(0, v.financial) * 1e8 * 0.2, 2e8);
        var gaupLimit = specialLimit(v.gaupYears);
        var gaupDed = v.gaup > 0 ? Math.min(v.gaup * 1e8, gaupLimit) : 0;

        var deducted = lump + spouseDed + finDed + gaupDed;
        var base = Math.max(0, gross - deducted);
        var calc = progressive(base, TABLE.gift);
        var pay = calc * FILING_CREDIT;

        return {
          hero: {
            label: '예상 상속세 납부세액',
            value: won(pay),
            sub: '총 상속재산 대비 실효세율 ' + pct(v.total > 0 ? pay / (v.total * 1e8) : 0) + '입니다. 이 금액은 현금으로 준비되어야 합니다.'
          },
          rows: [
            ['총 상속재산', won(v.total * 1e8)],
            ['채무 · 공과금 · 장례비', '-' + won(v.debt * 1e8)],
            ['상속세 과세가액', won(gross), 'total'],
            ['일괄공제', '-' + won(lump)],
            ['배우자 상속공제', '-' + won(spouseDed)],
            ['금융재산 상속공제', '-' + won(finDed)],
            ['가업상속공제', '-' + won(gaupDed)],
            ['상속세 과세표준', won(base), 'total'],
            ['산출세액', won(calc)],
            ['신고세액공제 (3%)', '-' + won(calc - pay)],
            ['납부할 상속세', won(pay), 'total']
          ],
          notes: [
            '배우자 상속공제는 실제 상속받은 금액을 한도로 하되 최소 5억 원, 최대 30억 원, 법정상속지분 상당액까지 인정됩니다.',
            '상속개시 전 10년(상속인) · 5년(상속인 외) 이내 사전증여재산은 상속재산에 합산됩니다. 본 계산에는 반영되지 않았습니다.',
            '가업상속공제는 영위기간 10년 이상 300억 · 20년 이상 400억 · 30년 이상 600억이 한도이며 5년 사후관리 요건이 따릅니다.',
            '비상장주식 평가액이 확정되지 않으면 상속세도 확정되지 않습니다. 평가가 모든 계산의 출발점입니다.'
          ],
          cta: '상속세는 “줄이는 일”과 “낼 돈을 만드는 일”이 함께 가야 합니다. 재원 설계부터 상담하십시오.'
        };
      }
    },

    /* ── 03. 기업가치 평가 시뮬레이터 ───────────────────── */
    {
      id: 'valuation',
      nav: '기업가치 평가 시뮬레이터',
      navSub: '비상장주식 1주당 가치',
      title: '기업가치 평가 시뮬레이터',
      desc: '상증법 보충적 평가방법으로 비상장주식의 1주당 평가액과 보유지분의 가치를 추정합니다. 승계·증여·매각의 모든 판단이 이 숫자에서 시작합니다.',
      basis: '상속세 및 증여세법 제63조 · 동법 시행령 제54조 기준',
      fields: [
        { k: 'p1', label: '직전 1기 순손익액', unit: '억 원', def: 10, hint: '세무조정 후 각 사업연도 소득금액 기준입니다. 결손이면 음수로 입력하십시오.' },
        { k: 'p2', label: '직전 2기 순손익액', unit: '억 원', def: 8 },
        { k: 'p3', label: '직전 3기 순손익액', unit: '억 원', def: 6 },
        { k: 'netasset', label: '순자산가액', unit: '억 원', def: 120, hint: '자산 - 부채. 영업권 가산 및 평가차액 조정 전 금액을 넣으셔도 개략치는 나옵니다.' },
        { k: 'shares', label: '발행주식 총수', unit: '주', def: 100000 },
        { k: 'stake', label: '평가 대상 지분율', unit: '%', def: 100 },
        { k: 'realestate', label: '부동산과다보유법인 여부', type: 'select', def: '0', options: [['0', '해당 없음 (순손익 3 : 순자산 2)'], ['1', '해당 (순손익 2 : 순자산 3)']] },
        { k: 'sme', label: '중소기업 해당 여부', type: 'select', def: '1', options: [['1', '중소기업 (최대주주 할증 제외)'], ['0', '중소기업 아님']] },
        { k: 'major', label: '최대주주 등 해당 여부', type: 'select', def: '1', options: [['1', '최대주주 및 특수관계인'], ['0', '해당 없음']] }
      ],
      run: function (v) {
        if (!(v.shares > 0)) return { error: '발행주식 총수를 1주 이상 입력하십시오.' };

        var weightedProfit = (v.p1 * 3 + v.p2 * 2 + v.p3 * 1) / 6 * 1e8;
        var earnValue = weightedProfit / EARN_RATE;
        var netAsset = v.netasset * 1e8;

        var perEarn = Math.max(0, earnValue / v.shares);
        var perNet = netAsset / v.shares;

        var isRE = v.realestate === '1';
        var weighted = isRE ? (perEarn * 2 + perNet * 3) / 5 : (perEarn * 3 + perNet * 2) / 5;
        var floor = perNet * 0.8;
        var applied = Math.max(weighted, floor);

        var premiumRate = (v.major === '1' && v.sme === '0') ? 0.20 : 0;
        var perShare = applied * (1 + premiumRate);
        var stakeValue = perShare * v.shares * (v.stake / 100);

        return {
          hero: {
            label: '지분 ' + v.stake + '% 의 평가액',
            value: won(stakeValue),
            sub: '1주당 평가액 ' + num(perShare) + '원 × ' + num(v.shares * v.stake / 100) + '주 기준입니다.'
          },
          compare: [
            { label: '1주당 순손익가치', value: num(perEarn) + '원', tone: 'neutral' },
            { label: '1주당 순자산가치', value: num(perNet) + '원', tone: 'accent' }
          ],
          rows: [
            ['가중평균 순손익액 (3 : 2 : 1)', won(weightedProfit)],
            ['순손익가치 총액 (환원율 10%)', won(earnValue)],
            ['순자산가액', won(netAsset)],
            [isRE ? '가중평균가액 (순손익 2 : 순자산 3)' : '가중평균가액 (순손익 3 : 순자산 2)', num(weighted) + '원'],
            ['순자산가치의 80% 하한', num(floor) + '원'],
            ['적용 1주당 평가액', num(applied) + '원', 'total'],
            ['최대주주 할증', premiumRate ? '+20%' : '해당 없음', premiumRate ? 'warn' : ''],
            ['최종 1주당 평가액', num(perShare) + '원', 'total'],
            ['지분 ' + v.stake + '% 평가액', won(stakeValue), 'total']
          ],
          notes: [
            '사업 개시 3년 미만 법인, 자산총액 중 부동산 비중 80% 이상 법인 등은 순자산가치만으로 평가합니다.',
            '순자산가액에는 영업권 평가액이 가산되며, 자기주식·이연자산 등 조정 항목이 있습니다. 본 계산에는 반영되지 않았습니다.',
            '중소기업 및 중견기업 중 일정 요건을 갖춘 법인은 최대주주 할증평가 대상에서 제외됩니다.',
            '평가 시점을 언제로 잡느냐에 따라 세액이 달라집니다. 증여 시점 관리보다 평가 시점 관리가 먼저입니다.'
          ],
          cta: '정식 평가는 재무제표와 세무조정계산서를 확인해 진행합니다. 평가 보고서를 요청하십시오.'
        };
      }
    },

    /* ── 04. 가지급금 손실 진단기 ───────────────────────── */
    {
      id: 'loan',
      nav: '가지급금 손실 진단기',
      navSub: '방치 비용과 청산 부담',
      title: '가지급금 손실 진단기',
      desc: '가지급금을 그대로 두었을 때 매년 발생하는 세부담과, 특수관계가 소멸할 때 한 번에 발생하는 부담을 함께 계산합니다.',
      basis: '법인세법 제28조·제52조 · 동법 시행규칙 제43조 (당좌대출이자율 4.6%) 기준',
      fields: [
        { k: 'balance', label: '가지급금 잔액', unit: '억 원', def: 3 },
        { k: 'corpbase', label: '법인 예상 과세표준', unit: '억 원', def: 5 },
        { k: 'ownerbase', label: '대표이사 종합소득 과세표준', unit: '만 원', def: 15000, hint: '급여·배당 등을 합한 개인 과세표준입니다. 한계세율 판정에 사용합니다.' },
        { k: 'years', label: '방치 예상 기간', unit: '년', def: 5 },
        { k: 'debtbal', label: '법인 차입금 잔액', unit: '억 원', def: 0, hint: '차입금이 있으면 가지급금 비율만큼 지급이자가 손금부인됩니다. 없으면 0.' },
        { k: 'interest', label: '연간 지급이자', unit: '만 원', def: 0 }
      ],
      run: function (v) {
        var B = v.balance * 1e8;
        if (B <= 0) return { error: '가지급금 잔액을 입력하십시오.' };

        var recognized = B * LOAN_RATE;
        var corpRate = marginal(v.corpbase * 1e8, TABLE.corp);
        var incRate = marginal(v.ownerbase * 1e4, TABLE.income);

        var corpTax = recognized * corpRate * LOCAL;
        var bonusTax = recognized * incRate * LOCAL;

        var disallowed = 0;
        if (v.debtbal > 0 && v.interest > 0) {
          disallowed = Math.min(1, B / (v.debtbal * 1e8)) * v.interest * 1e4;
        }
        var disallowTax = disallowed * corpRate * LOCAL;

        var annual = corpTax + bonusTax + disallowTax;
        var cumulative = annual * Math.max(1, v.years);
        var wipeout = B * incRate * LOCAL;

        return {
          hero: {
            label: v.years + '년간 누적 예상 손실',
            value: won(cumulative),
            sub: '연간 ' + won(annual) + '씩, 아무 일도 하지 않아도 빠져나가는 금액입니다.'
          },
          compare: [
            { label: '연간 반복 세부담', value: won(annual), tone: 'neutral' },
            { label: '특수관계 소멸 시 일시 과세', value: won(wipeout), tone: 'accent' }
          ],
          rows: [
            ['가지급금 잔액', won(B)],
            ['인정이자 (연 4.6%)', won(recognized)],
            ['법인세 증가 (한계세율 ' + pct(corpRate) + ', 지방세 포함)', won(corpTax)],
            ['대표이사 상여처분 소득세 (한계세율 ' + pct(incRate) + ')', won(bonusTax)],
            ['지급이자 손금불산입액', won(disallowed)],
            ['손금불산입에 따른 법인세 증가', won(disallowTax)],
            ['연간 총 세부담', won(annual), 'total'],
            ['퇴직 · 폐업 등 특수관계 소멸 시 일시 상여처분 세액', won(wipeout), 'warn']
          ],
          notes: [
            '인정이자는 당좌대출이자율 4.6%를 적용했습니다. 가중평균차입이자율을 선택 신고한 경우 결과가 달라집니다.',
            '회사가 인정이자를 미수수익으로 계상하지 않으면 대표이사 상여로 처분되어 개인 소득세가 함께 발생합니다.',
            '가지급금은 국세청 예규상 명백한 사업무관자산입니다. 정리하지 않으면 가업승계 공제 대상에서 제외됩니다.',
            '조세심판 가업승계 분쟁의 상당수가 사업무관자산에서 발생하며, 정리에는 통상 6개월 이상이 걸립니다.'
          ],
          cta: '가지급금은 “없애는 것”이 아니라 “어떤 순서로 정리하는가”의 문제입니다. 정리 로드맵을 상담하십시오.'
        };
      }
    },

    /* ── 05. 임원 퇴직금 한도 설계기 ────────────────────── */
    {
      id: 'severance',
      nav: '임원 퇴직금 한도 설계기',
      navSub: '지급한도와 세후 실수령',
      title: '임원 퇴직금 한도 설계기',
      desc: '정관상 지급배수로 계산한 퇴직금이 소득세법상 퇴직소득 한도 안에 들어오는지 확인하고, 세후 실수령액을 계산합니다.',
      basis: '소득세법 제22조 제4항 제2호 · 제48조 (환산급여 방식) 기준',
      fields: [
        { k: 'salary', label: '퇴직 전 3년 연평균 급여', unit: '만 원', def: 12000, hint: '총급여 기준 연 환산 금액입니다.' },
        { k: 'y1', label: '2012.1.1 ~ 2019.12.31 근속연수', unit: '년', def: 0, hint: '이 구간은 3배수까지 퇴직소득으로 인정됩니다.' },
        { k: 'y2', label: '2020.1.1 이후 근속연수', unit: '년', def: 15, hint: '이 구간은 2배수까지만 퇴직소득으로 인정됩니다.' },
        { k: 'multiple', label: '정관상 지급배수', unit: '배', def: 3, hint: '정관 또는 임원퇴직급여규정에 정한 배수입니다.' }
      ],
      run: function (v) {
        var avg = v.salary * 1e4;
        var total = v.y1 + v.y2;
        if (!(total > 0)) return { error: '근속연수를 1년 이상 입력하십시오.' };

        var limit = (avg / 10) * v.y1 * 3 + (avg / 10) * v.y2 * 2;
        var payout = (avg / 10) * total * v.multiple;
        var retirePart = Math.min(payout, limit);
        var excess = Math.max(0, payout - limit);

        var s = severanceTax(retirePart, total);
        var wageTax = excess > 0 ? excess * marginal(excess, TABLE.income) * LOCAL : 0;
        var taxTotal = s.total + wageTax;
        var net = payout - taxTotal;

        return {
          hero: {
            label: '세후 실수령 예상액',
            value: won(net),
            sub: '지급액 ' + won(payout) + ' 중 세부담 ' + won(taxTotal) + ' (실효세율 ' + pct(payout > 0 ? taxTotal / payout : 0) + ')'
          },
          compare: [
            { label: '정관상 지급액', value: won(payout), tone: 'neutral' },
            { label: '퇴직소득 인정 한도', value: won(limit), tone: 'accent' }
          ],
          rows: [
            ['퇴직 전 3년 연평균 급여', won(avg)],
            ['총 근속연수', total + '년'],
            ['정관상 지급액 (배수 ' + v.multiple + '배)', won(payout)],
            ['소득세법상 퇴직소득 한도', won(limit)],
            ['퇴직소득 해당분', won(retirePart)],
            ['한도 초과분 (근로소득 과세)', won(excess), excess > 0 ? 'warn' : ''],
            ['퇴직소득세 (지방소득세 포함)', won(s.total)],
            ['한도 초과분 근로소득세 (추정)', won(wageTax)],
            ['총 세부담', won(taxTotal), 'total'],
            ['세후 실수령액', won(net), 'total']
          ],
          notes: [
            '2011.12.31 이전 근속분은 별도 규정이 적용되어 본 계산에 포함되지 않았습니다.',
            '한도 초과분은 퇴직소득이 아닌 근로소득으로 과세되며, 다른 소득과 합산되어 실제 세액은 더 커질 수 있습니다.',
            '정관 또는 주주총회 결의로 정한 임원퇴직급여규정이 지급 전에 정비되어 있어야 법인 손금으로 인정됩니다.',
            '퇴직금은 이익잉여금을 인출하는 수단인 동시에 상속세 재원을 만드는 수단입니다.'
          ],
          cta: '정관 정비 없이 지급하면 손금부인과 상여처분이 함께 옵니다. 규정부터 점검받으십시오.'
        };
      }
    },

    /* ── 06. 이익잉여금 인출전략 비교기 ─────────────────── */
    {
      id: 'payout',
      nav: '이익잉여금 인출전략 비교기',
      navSub: '급여 · 배당 · 퇴직금',
      title: '이익잉여금 인출전략 비교기',
      desc: '회사가 같은 금액의 세전 재원을 쓴다고 할 때, 급여·배당·퇴직금 중 어느 경로가 대표님 손에 가장 많이 남는지 비교합니다.',
      basis: '소득세법 제55조·제129조 · 법인세법 제55조 기준 (지방소득세 및 4대보험 반영)',
      fields: [
        { k: 'amount', label: '회사가 투입할 세전 재원', unit: '억 원', def: 3, hint: '세 경로 모두 회사가 부담하는 총액을 이 금액으로 맞춰 비교합니다.' },
        { k: 'corpbase', label: '법인 예상 과세표준', unit: '억 원', def: 5 },
        { k: 'ownerbase', label: '대표이사 기존 종합소득 과세표준', unit: '만 원', def: 8000 },
        { k: 'years', label: '퇴직금 산정 근속연수', unit: '년', def: 20 }
      ],
      run: function (v) {
        var A = v.amount * 1e8;
        if (!(A > 0)) return { error: '회사가 투입할 세전 재원을 입력하십시오.' };

        var corpRate = marginal(v.corpbase * 1e8, TABLE.corp);
        var ownerBase = v.ownerbase * 1e4;

        var PENSION_CAP = 6170000 * 12; // 국민연금 기준소득월액 상한 (연 환산)
        function insuranceOf(wage) {
          return Math.min(wage, PENSION_CAP) * 0.045    // 국민연금
            + wage * 0.03545 * (1 + 0.1295);            // 건강보험 + 장기요양
        }

        /* ① 급여 — 회사 총지출(급여 + 회사부담 보험) = A 가 되는 급여액을 역산 */
        var wage = A;
        for (var i = 0; i < 60; i++) wage = A - insuranceOf(wage);
        var wageIns = insuranceOf(wage);
        var wageTax = (progressive(ownerBase + wage, TABLE.income) - progressive(ownerBase, TABLE.income)) * LOCAL;
        var wageNet = wage - wageTax - wageIns;

        /* ② 배당 — 손금이 아니므로 법인세를 먼저 내고 남은 금액만 배당 가능 */
        var corpTax = A * corpRate * LOCAL;
        var dividend = A - corpTax;
        var divTax;
        if (dividend <= 2e7) divTax = dividend * 0.154;
        else divTax = 2e7 * 0.154 + (dividend - 2e7) * marginal(ownerBase + (dividend - 2e7), TABLE.income) * LOCAL;
        var divNet = dividend - divTax;

        /* ③ 퇴직금 — 전액 손금, 분류과세 */
        var sev = severanceTax(A, v.years);
        var sevNet = A - sev.total;

        var routes = [
          { name: '급여 (상여 포함)', paid: wage, cost: wageTax + wageIns, net: wageNet },
          { name: '배당', paid: dividend, cost: corpTax + divTax, net: divNet },
          { name: '퇴직금', paid: A, cost: sev.total, net: sevNet }
        ];
        routes.forEach(function (r) { r.eff = 1 - r.net / A; });

        var best = routes.slice().sort(function (a, b) { return a.eff - b.eff; })[0];
        var worst = routes.slice().sort(function (a, b) { return b.eff - a.eff; })[0];

        return {
          hero: {
            label: '가장 유리한 인출 경로',
            value: best.name,
            sub: '세전 재원 ' + won(A) + ' 기준 실수령 ' + won(best.net) + ' (실효 부담률 ' + pct(best.eff) + '). ' +
              '가장 불리한 ' + worst.name + ' 대비 ' + won(best.net - worst.net) + '이 더 남습니다.'
          },
          table: {
            head: ['인출 경로', '개인 수령액', '세금·보험 합계', '세후 실수령', '실효 부담률'],
            rows: routes.map(function (r) {
              return [r.name, won(r.paid), won(r.cost), won(r.net), pct(r.eff)];
            }),
            highlight: routes.indexOf(best)
          },
          rows: [
            ['법인 한계세율 (지방소득세 포함)', pct(corpRate * LOCAL)],
            ['급여 경로 — 회사 부담 4대보험', won(wageIns)],
            ['급여 경로 — 실제 지급 가능 급여', won(wage)],
            ['배당 경로 — 선납 법인세', won(corpTax), 'warn'],
            ['배당 경로 — 배당 가능액', won(dividend)],
            ['퇴직금 경로 — 퇴직소득 과세표준', won(sev.base)],
            ['퇴직금 경로 — 절감되는 법인세', won(A * corpRate * LOCAL)]
          ],
          notes: [
            '세 경로 모두 회사가 부담하는 세전 재원을 동일하게 맞춰 비교했습니다. 배당은 손금이 아니므로 법인세를 먼저 부담한 뒤의 금액만 지급됩니다.',
            '급여 경로의 소득세는 근로소득공제·인적공제를 반영하지 않은 보수적 추정이므로 실제 부담은 더 낮을 수 있습니다.',
            '배당은 연 2,000만 원까지 15.4% 분리과세, 초과분은 종합과세됩니다. Gross-up 및 배당세액공제는 반영하지 않았습니다.',
            '퇴직금은 분류과세되어 가장 유리한 경우가 많지만, 임원 퇴직소득 한도와 정관 규정을 먼저 충족해야 합니다. 「임원 퇴직금 한도 설계기」로 한도부터 확인하십시오.',
            '실제로는 한 경로만 고르는 것이 아니라 급여·배당·퇴직금을 연도별로 배분하는 설계가 유리한 경우가 많습니다.'
          ],
          cta: '인출 순서와 시기를 바꾸는 것만으로 세부담이 달라집니다. 연도별 배분안을 설계해 드립니다.'
        };
      }
    },

    /* ── 07. 사전증여 분산 설계기 ───────────────────────── */
    {
      id: 'giftplan',
      nav: '사전증여 분산 설계기',
      navSub: '10년 합산 주기 활용',
      title: '사전증여 분산 설계기',
      desc: '증여재산공제는 10년마다 되살아납니다. 한 번에 넘길 때와 수증자·시기를 나눠 넘길 때의 세액 차이를 계산합니다.',
      basis: '상속세 및 증여세법 제53조·제57조 (10년 합산 · 세대생략 할증) 기준',
      fields: [
        { k: 'total', label: '증여 예정 총액', unit: '억 원', def: 20 },
        { k: 'people', label: '수증자 수', unit: '명', def: 2, hint: '자녀, 배우자, 손자녀 등 증여를 받을 사람의 수입니다.' },
        { k: 'rounds', label: '10년 주기 증여 횟수', unit: '회', def: 3, hint: '3회면 오늘 · 10년 후 · 20년 후를 의미합니다.' },
        {
          k: 'relation', label: '수증자 관계', type: 'select', def: 'adult',
          options: [['adult', '성년 자녀 (공제 5,000만 원)'], ['minor', '미성년 자녀 (공제 2,000만 원)'], ['grand', '손자녀 · 세대생략 (할증 30%)']]
        }
      ],
      run: function (v) {
        var T = v.total * 1e8;
        if (!(T > 0) || !(v.people > 0) || !(v.rounds > 0)) return { error: '금액 · 수증자 수 · 증여 횟수를 모두 입력하십시오.' };

        var ded = v.relation === 'minor' ? 2e7 : 5e7;
        var isGrand = v.relation === 'grand';

        function taxOf(amount) {
          var base = Math.max(0, amount - ded);
          var t = progressive(base, TABLE.gift);
          if (isGrand) t *= (base > 2e9 ? 1.4 : 1.3);
          return t * FILING_CREDIT;
        }

        var perGift = T / (v.people * v.rounds);
        var unitTax = taxOf(perGift);
        var splitTax = unitTax * v.people * v.rounds;
        var lumpTax = taxOf(T);
        var save = lumpTax - splitTax;
        var span = (v.rounds - 1) * 10;

        return {
          hero: {
            label: '분산 설계 시 절감 예상액',
            value: won(save),
            sub: '한 사람에게 한 번에 넘기면 ' + won(lumpTax) + ', ' + v.people + '명에게 ' + v.rounds + '회로 나누면 ' + won(splitTax) + '입니다.'
          },
          compare: [
            { label: '일시 증여 (1인 · 1회)', value: won(lumpTax), tone: 'neutral' },
            { label: '분산 증여 (' + v.people + '인 · ' + v.rounds + '회)', value: won(splitTax), tone: 'accent' }
          ],
          rows: [
            ['증여 예정 총액', won(T)],
            ['1건당 증여액', won(perGift)],
            ['증여재산공제', '-' + won(ded)],
            ['1건당 과세표준', won(Math.max(0, perGift - ded))],
            ['1건당 증여세 (신고세액공제 반영)', won(unitTax)],
            ['총 증여 건수', (v.people * v.rounds) + '건'],
            ['분산 증여 총세액', won(splitTax), 'total'],
            ['일시 증여 총세액', won(lumpTax)],
            ['소요 기간', span + '년', isGrand ? 'warn' : '']
          ],
          notes: [
            '동일인(직계존속은 배우자 포함)으로부터 10년 이내에 받은 증여재산은 합산해 과세합니다.',
            '상속개시일 전 10년 이내 상속인에게, 5년 이내 상속인 외의 자에게 증여한 재산은 상속재산에 합산됩니다. 분산의 실익은 “충분히 이른 시점”에 시작해야 생깁니다.',
            '세대를 건너뛴 증여는 산출세액의 30%(미성년자가 20억 원 초과 증여를 받는 경우 40%)가 할증됩니다.',
            '주식을 증여하는 경우 증여 시점의 평가액이 기준이 됩니다. 기업가치가 오르기 전에 넘길수록 세부담이 줄어듭니다.'
          ],
          cta: '언제, 누구에게, 얼마씩 나눌지는 가족 전체의 재산 구조를 봐야 정해집니다. 승계 로드맵을 함께 그리십시오.'
        };
      }
    }
  ];

  /* 노출 순서 — 기업가치(모든 판단의 출발점) → 자산 개인화 → 리스크 정리 → 승계·상속.
     정의 순서와 분리해 두어, 순서를 바꿔도 계산 로직에는 영향이 없다. */
  var ORDER = ['valuation', 'payout', 'severance', 'loan', 'succession', 'inheritance', 'giftplan'];
  global.JEONGEL_CALCS = ORDER.map(function (id) {
    return CALCS.filter(function (c) { return c.id === id; })[0];
  }).filter(Boolean);
  global.JEONGEL_FMT = { won: won, pct: pct, num: num };

})(window);
