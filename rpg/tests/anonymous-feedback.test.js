import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Town page offers its own anonymous form as a no-referrer footer link, not an embed',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const footer=html.match(/<footer class="project-footer">[\s\S]*?<\/footer>/)?.[0];
  assert.match(footer,/<a href="https:\/\/docs\.google\.com\/forms\/d\/e\/1FAIpQLScfHc3fqJL5cJjAi_-kuzQPDHVyWZdy9GsMT2fhNXkyHx7oNA\/viewform" referrerpolicy="no-referrer">匿名意見回饋（不需登入）<\/a>/);
  assert.doesNotMatch(html,/<(?:form|iframe)\b/i);
  assert.equal((html.match(/docs\.google\.com\/forms/g)||[]).length,1);
  assert.match(html,/aria-label="版本 20261128-027">20261128-027<\/span>/);
});
