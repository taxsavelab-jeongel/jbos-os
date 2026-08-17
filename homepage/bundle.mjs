/* 단일 파일 배포본 생성기.
 *
 *   node bundle.mjs
 *
 * index.html 의 외부 CSS/JS/SVG 참조를 전부 인라인으로 치환해
 * 「정엘기업연구소_홈페이지.html」 하나만 있으면 더블클릭으로 열리는
 * 파일을 만든다. 웹폰트(Pretendard)만 CDN 에 남으므로, 오프라인에서는
 * 시스템 고딕으로 대체 렌더된다.
 *
 * 실제 배포(Cloudflare Workers)는 homepage/ 디렉터리를 통째로 올리므로
 * 이 파일은 검토용 전달본 전용이다. build.mjs 를 먼저 돌린 뒤 실행할 것.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = '정엘기업연구소_홈페이지.html';
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

let html = read('./index.html');

/* SVG 는 data URI 로 — favicon 과 og:image 참조에 쓰인다. */
const markUri =
  'data:image/svg+xml;base64,' + Buffer.from(read('./assets/mark.svg')).toString('base64');
html = html.replaceAll('assets/mark.svg', markUri);

/* 치환문자열이 아니라 함수를 넘긴다 — 문자열로 넘기면 $$ 가 $ 로,
   $& 가 매치 전체로 해석된다. site.js 의 $$() 헬퍼가 그대로 깨진다. */
const inline = (pattern, tag, file) => {
  const before = html;
  html = html.replace(pattern, () => `<${tag}>\n${read(file)}\n</${tag}>`);
  if (html === before) throw new Error(`인라인 대상 없음: ${file}`);
};

inline(/<link[^>]+href="assets\/styles\.css"[^>]*>/, 'style', './assets/styles.css');
inline(/<script[^>]+src="assets\/calculators\.js"[^>]*><\/script>/, 'script', './assets/calculators.js');
inline(/<script[^>]+src="assets\/site\.js"[^>]*><\/script>/, 'script', './assets/site.js');

const leftover = [...html.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)].map((m) => m[1]);
if (leftover.length) throw new Error(`인라인되지 않은 참조: ${leftover.join(', ')}`);

writeFileSync(new URL('./' + OUT, import.meta.url), html);
console.log(`  생성 ${OUT} — ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB, 외부 assets 참조 없음`);
