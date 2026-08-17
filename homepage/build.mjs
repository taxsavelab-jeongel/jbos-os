/**
 * 도구 상세 페이지 생성기
 *
 *   node build-tools.mjs
 *
 * tools-content.mjs 의 정의로 tools/<slug>/index.html 7개와 sitemap.xml 을 만든다.
 * 헤더·푸터가 바뀌면 이 파일만 고치고 다시 돌리면 7개 페이지에 한 번에 반영된다.
 * 생성물도 커밋한다 — 정적 호스팅이라 빌드 단계 없이 그대로 올라가야 하기 때문.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, TOOLS } from './tools-content.mjs';
import { INSIGHTS } from './insights-content.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LP = 'https://lp.jeongellab.com';
const TODAY = '2026-08-17';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MARK = `<svg class="logo-mark" viewBox="0 0 78 100" aria-hidden="true">
        <path d="M26 0 L26 72 L78 72 L78 90 L68 100 L0 100 L0 18 Z" fill="#C0111F"/>
      </svg>`;

function header(base) {
  return `<header class="site-header solid" id="header">
  <div class="shell header-inner">
    <a class="logo" href="${base}" aria-label="정엘기업연구소 홈">
      ${MARK}
      <span class="logo-text">
        <b>정엘기업연구소</b>
        <i>JEONGEL CORPORATE RESEARCH LAB</i>
      </span>
    </a>
    <nav class="nav" id="nav" aria-label="주 메뉴">
      <a href="${base}#goals">목적별 경로</a>
      <a href="${base}#solutions">서비스 범위</a>
      <a href="${base}#tools">전문 진단 도구</a>
      <a href="${base}#process">진단 프로세스</a>
      <a href="${base}insights/">인사이트</a>
      <a href="${LP}" class="nav-cta">상담 신청</a>
    </nav>
    <button class="nav-toggle" id="navToggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="nav">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

function footer(base) {
  return `<footer class="site-footer">
  <div class="shell footer-inner">
    <div class="footer-brand">
      <svg class="logo-mark" viewBox="0 0 78 100" aria-hidden="true">
        <path d="M26 0 L26 72 L78 72 L78 90 L68 100 L0 100 L0 18 Z" fill="#C0111F"/>
      </svg>
      <p class="footer-claim">법인전환부터 M&amp;A까지,<br>기업의 모든 구간을 함께합니다.</p>
    </div>
    <div class="footer-meta">
      <p><b>(주)정엘기업연구소</b></p>
      <address>서울특별시 서초구 반포대로 79, 5층 · <a href="tel:02-523-3757">02-523-3757</a> · <a href="mailto:taxsavelab@gmail.com">taxsavelab@gmail.com</a></address>
      <p>사업자등록번호 208-88-01033 · 통신판매업신고 제2025-서울서초-0459호 · 개인정보책임자 우예슬</p>
      <p class="footer-brandnote">‘정엘가업승계연구소’는 (주)정엘기업연구소가 운영하는 가업승계 전문 브랜드입니다.</p>
      <p class="footer-legal">
        본 사이트의 계산 결과와 게시물은 일반적인 정보 제공을 목적으로 하며 특정 거래에 대한 세무 자문이 아닙니다.
        게시된 실적 수치는 정엘 네트워크 기준 누적치입니다.
      </p>
      <p class="footer-copy">© 2026 JEONGEL Corporate Research Lab. All rights reserved.</p>
    </div>
  </div>
</footer>

<a class="float-cta" href="tel:010-5500-9632" aria-label="전화 상담 010-5500-9632">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z"/></svg>
  <span>전화 상담</span>
</a>`;
}

function bodyHtml(blocks) {
  return blocks.map((b) => {
    let out = `      <h2>${esc(b.h)}</h2>\n`;
    if (b.p) out += b.p.map((t) => `      <p>${esc(t)}</p>\n`).join('');
    if (b.list) out += `      <ul class="prose-list">\n${b.list.map((t) => `        <li>${esc(t)}</li>`).join('\n')}\n      </ul>\n`;
    if (b.after) out += `      <p>${esc(b.after)}</p>\n`;
    return out;
  }).join('\n');
}

function relatedHtml(current) {
  const others = TOOLS.filter((t) => t.slug !== current.slug);
  return others.map((t) => `        <li><a href="../${t.slug}/"><b>${esc(t.h1)}</b><span>${esc(t.lead)}</span></a></li>`).join('\n');
}

function jsonLd(t) {
  const url = `${SITE}/tools/${t.slug}/`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: t.h1,
        url,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: 'ko-KR',
        description: t.desc,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        provider: { '@id': `${SITE}/#organization` }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: '전문 진단 도구', item: `${SITE}/#tools` },
          { '@type': 'ListItem', position: 3, name: t.h1, item: url }
        ]
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: t.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
      }
    ]
  }, null, 2);
}

function page(t) {
  const base = '../../';
  const url = `${SITE}/tools/${t.slug}/`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.title)} | 정엘기업연구소</title>
<meta name="description" content="${esc(t.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="author" content="정엘기업연구소">
<meta name="theme-color" content="#381513">

<meta property="og:type" content="website">
<meta property="og:site_name" content="정엘기업연구소">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(t.title)} | 정엘기업연구소">
<meta property="og:description" content="${esc(t.desc)}">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t.title)}">
<meta name="twitter:description" content="${esc(t.desc)}">
<meta name="twitter:image" content="${SITE}/assets/og-image.png">

<link rel="icon" href="${base}assets/mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${base}assets/styles.css">

<script type="application/ld+json">
${jsonLd(t)}
</script>
</head>
<body class="tool-page">

<a class="skip" href="#main">본문 바로가기</a>
<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>

${header(base)}

<main id="main">

  <div class="shell">
    <nav class="breadcrumb" aria-label="위치">
      <a href="${base}">홈</a><span aria-hidden="true">›</span>
      <a href="${base}#tools">전문 진단 도구</a><span aria-hidden="true">›</span>
      <em>${esc(t.h1)}</em>
    </nav>
  </div>

  <section class="page-hero">
    <div class="shell">
      <p class="kicker">무료 진단 도구</p>
      <h1>${esc(t.h1)}</h1>
      <p class="page-lead">${esc(t.lead)}</p>
    </div>
  </section>

  <section class="section tool-calc">
    <div class="shell">
      <div class="calc single">
        <div class="calc-stage">
          <div class="calc-panel" id="calcPanel" data-calc="${t.calc}"></div>
        </div>
      </div>
      <p class="calc-disclaimer dark-off">
        현행 세법을 기준으로 한 <b>간이 추정</b>입니다. 실제 세액은 사업무관자산 비율, 지분구조,
        평가 시점, 개별 공제 요건에 따라 달라집니다. 의사결정 전 반드시 전문가의 개별 검토를 받으십시오.
      </p>
    </div>
  </section>

  <section class="section prose-section">
    <div class="shell prose">
${bodyHtml(t.body)}
    </div>
  </section>

  <section class="section faq-section">
    <div class="shell">
      <div class="section-head"><p class="kicker">FAQ</p><h2>자주 묻는 질문</h2></div>
      <div class="faq">
${t.faq.map((f) => `        <details>
          <summary>${esc(f.q)}</summary>
          <div><p>${esc(f.a)}</p></div>
        </details>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section related-section">
    <div class="shell">
      <div class="section-head"><p class="kicker">OTHER TOOLS</p><h2>다른 진단 도구</h2></div>
      <ul class="related">
${relatedHtml(t)}
      </ul>
    </div>
  </section>

  <section class="section tool-cta">
    <div class="shell tool-cta-inner">
      <div>
        <h2>계산 결과를 가지고<br><span class="hi">상담을 신청하십시오</span></h2>
        <p>이 도구는 판단의 출발점을 만들기 위한 간이 버전입니다.
        실제 설계에는 재무제표·주주명부·정관 확인이 필요합니다.</p>
      </div>
      <div class="tool-cta-act">
        <a class="btn btn-accent" href="${LP}">상담 신청하기</a>
        <a class="tool-tel" href="tel:010-5500-9632">전화 상담 010-5500-9632</a>
      </div>
    </div>
  </section>

</main>

${footer(base)}

<script src="${base}assets/calculators.js"></script>
<script src="${base}assets/site.js"></script>
</body>
</html>
`;
}


/* ═══════════════ 인사이트 ═══════════════ */
const KOREAN_DATE = (iso) => { const [y, m, d] = iso.split('-'); return `${y}년 ${+m}월 ${+d}일`; };

function insightJsonLd(a) {
  const url = `${SITE}/insights/${a.slug}/`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: a.title,
        description: a.desc,
        url,
        datePublished: a.date,
        dateModified: a.updated,
        inLanguage: 'ko-KR',
        articleSection: a.category,
        image: `${SITE}/assets/og-image.png`,
        author: { '@id': `${SITE}/#organization` },
        publisher: { '@id': `${SITE}/#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: '인사이트', item: `${SITE}/insights/` },
          { '@type': 'ListItem', position: 3, name: a.title, item: url }
        ]
      }
    ]
  }, null, 2);
}

function insightPage(a) {
  const base = '../../';
  const url = `${SITE}/insights/${a.slug}/`;
  const others = INSIGHTS.filter((x) => x.slug !== a.slug).slice(0, 2);
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(a.title)} | 정엘기업연구소</title>
<meta name="description" content="${esc(a.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="author" content="정엘기업연구소">
<meta name="theme-color" content="#381513">
<meta property="og:type" content="article">
<meta property="og:site_name" content="정엘기업연구소">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(a.title)}">
<meta property="og:description" content="${esc(a.desc)}">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta property="article:published_time" content="${a.date}">
<meta property="article:modified_time" content="${a.updated}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(a.title)}">
<meta name="twitter:description" content="${esc(a.desc)}">
<meta name="twitter:image" content="${SITE}/assets/og-image.png">
<link rel="icon" href="${base}assets/mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${base}assets/styles.css">
<script type="application/ld+json">
${insightJsonLd(a)}
</script>
</head>
<body class="tool-page">
<a class="skip" href="#main">본문 바로가기</a>
<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>
${header(base)}
<main id="main">
  <div class="shell">
    <nav class="breadcrumb" aria-label="위치">
      <a href="${base}">홈</a><span aria-hidden="true">›</span>
      <a href="${base}insights/">인사이트</a><span aria-hidden="true">›</span>
      <em>${esc(a.category)}</em>
    </nav>
  </div>

  <section class="page-hero">
    <div class="shell">
      <p class="kicker">${esc(a.category)}</p>
      <h1>${esc(a.title)}</h1>
      <p class="page-lead">${esc(a.lead)}</p>
      <p class="article-meta">
        <time datetime="${a.date}">${KOREAN_DATE(a.date)} 발행</time>
        ${a.updated !== a.date ? `<span>·</span><time datetime="${a.updated}">${KOREAN_DATE(a.updated)} 개정 반영</time>` : ''}
      </p>
    </div>
  </section>

  <section class="section prose-section">
    <div class="shell prose">
${bodyHtml(a.body)}
    </div>
  </section>

  ${a.tool ? `<section class="section related-section">
    <div class="shell">
      <div class="tool-callout reveal">
        <div>
          <p class="kicker">함께 보면 좋은 도구</p>
          <h3>${esc(a.tool.name)}</h3>
          <p>이 글에서 다룬 계산을 직접 해보실 수 있습니다. 무료이며 가입이 필요 없습니다.</p>
        </div>
        <a class="btn btn-accent" href="${base}tools/${a.tool.slug}/">계산해 보기</a>
      </div>
    </div>
  </section>` : ''}

  <section class="section related-section">
    <div class="shell">
      <div class="section-head"><p class="kicker">MORE INSIGHTS</p><h2>다른 인사이트</h2></div>
      <ul class="related">
${others.map((o) => `        <li><a href="../${o.slug}/"><b>${esc(o.title)}</b><span>${esc(o.desc)}</span></a></li>`).join('\n')}
        <li><a href="${base}insights/"><b>전체 인사이트 보기</b><span>세법 개정, 실무 쟁점, 기업가치와 자산 설계에 관한 글을 모았습니다.</span></a></li>
      </ul>
    </div>
  </section>

  <section class="section tool-cta">
    <div class="shell tool-cta-inner">
      <div>
        <h2>우리 회사는<br><span class="hi">어디에 해당합니까</span></h2>
        <p>글로 읽는 것과 우리 회사에 적용하는 것은 다릅니다. 재무제표를 놓고 함께 확인해 드립니다.</p>
      </div>
      <div class="tool-cta-act">
        <a class="btn btn-accent" href="${LP}">무료 진단 상담 신청</a>
        <a class="tool-tel" href="tel:010-5500-9632">전화 상담 010-5500-9632</a>
      </div>
    </div>
  </section>
</main>
${footer(base)}
<script src="${base}assets/site.js"></script>
</body>
</html>
`;
}

function insightIndex() {
  const base = '../';
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>인사이트 | 세법 개정·실무 쟁점·기업가치 설계 — 정엘기업연구소</title>
<meta name="description" content="세법 개정, 판례, 실무 쟁점을 중소기업 오너의 관점에서 정리합니다. 비상장주식 평가 타이밍, 가지급금 정리 시점, 증여특례 개정 등 기업가치와 세부담을 함께 다룹니다.">
<link rel="canonical" href="${SITE}/insights/">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="#381513">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/insights/">
<meta property="og:title" content="인사이트 | 정엘기업연구소">
<meta property="og:description" content="세법 개정, 판례, 실무 쟁점을 중소기업 오너의 관점에서 정리합니다.">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta property="og:locale" content="ko_KR">
<link rel="icon" href="${base}assets/mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${base}assets/styles.css">
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '인사이트',
  url: `${SITE}/insights/`,
  inLanguage: 'ko-KR',
  publisher: { '@id': `${SITE}/#organization` },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: INSIGHTS.map((a, i) => ({
      '@type': 'ListItem', position: i + 1, name: a.title, url: `${SITE}/insights/${a.slug}/`
    }))
  }
}, null, 2)}
</script>
</head>
<body class="tool-page">
<a class="skip" href="#main">본문 바로가기</a>
<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>
${header(base)}
<main id="main">
  <div class="shell">
    <nav class="breadcrumb" aria-label="위치">
      <a href="${base}">홈</a><span aria-hidden="true">›</span><em>인사이트</em>
    </nav>
  </div>
  <section class="page-hero">
    <div class="shell">
      <p class="kicker">INSIGHT</p>
      <h1>인사이트</h1>
      <p class="page-lead">세법 개정, 판례, 실무 쟁점을 중소기업 오너의 관점에서 정리합니다.<br>결론만 알려드리지 않고, 왜 그런지까지 설명합니다.</p>
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <ul class="insight-list">
${INSIGHTS.map((a) => `        <li class="reveal">
          <a href="${a.slug}/">
            <div class="il-meta"><span class="il-cat">${esc(a.category)}</span><time datetime="${a.date}">${KOREAN_DATE(a.date)}</time></div>
            <h2>${esc(a.title)}</h2>
            <p>${esc(a.desc)}</p>
            <span class="il-more">자세히 읽기 →</span>
          </a>
        </li>`).join('\n')}
      </ul>
    </div>
  </section>
  <section class="section tool-cta">
    <div class="shell tool-cta-inner">
      <div>
        <h2>글로 읽은 것을<br><span class="hi">우리 회사에 적용하려면</span></h2>
        <p>재무제표·주주명부·정관을 놓고 지금 어디에 서 있는지부터 확인해 드립니다.</p>
      </div>
      <div class="tool-cta-act">
        <a class="btn btn-accent" href="${LP}">무료 진단 상담 신청</a>
        <a class="tool-tel" href="tel:010-5500-9632">전화 상담 010-5500-9632</a>
      </div>
    </div>
  </section>
</main>
${footer(base)}
<script src="${base}assets/site.js"></script>
</body>
</html>
`;
}

/* ── 생성 ────────────────────────────────────────────────── */
let n = 0;
for (const t of TOOLS) {
  const dir = join(ROOT, 'tools', t.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(t), 'utf8');
  console.log(`  생성 tools/${t.slug}/index.html  — ${t.h1}`);
  n++;
}

mkdirSync(join(ROOT, 'insights'), { recursive: true });
writeFileSync(join(ROOT, 'insights', 'index.html'), insightIndex(), 'utf8');
console.log('  생성 insights/index.html  — 인사이트 목록');
for (const a of INSIGHTS) {
  const dir = join(ROOT, 'insights', a.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), insightPage(a), 'utf8');
  console.log(`  생성 insights/${a.slug}/index.html  — ${a.title}`);
  n++;
}

const urls = [
  { loc: `${SITE}/`, pri: '1.0', freq: 'weekly' },
  { loc: `${SITE}/insights/`, pri: '0.9', freq: 'weekly' },
  ...TOOLS.map((t) => ({ loc: `${SITE}/tools/${t.slug}/`, pri: '0.9', freq: 'monthly' })),
  ...INSIGHTS.map((a) => ({ loc: `${SITE}/insights/${a.slug}/`, pri: '0.8', freq: 'monthly', lastmod: a.updated }))
];
writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod || TODAY}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n') +
  `\n</urlset>\n`, 'utf8');

console.log(`\n  페이지 ${n}개 + sitemap.xml(${urls.length} URL) 생성 완료`);
