import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>\s*({\s*const editionSwitch=[\s\S]*?})\s*<\/script>/)?.[1];
test('version link selects counterpart by path alone, preserving edition-separated data',()=>{
  for(const [url,want] of [
    ['/cello-town/',['實驗版','/cello-town/experimental/']],
    ['/cello-town/?next=/experimental/#test',['實驗版','/cello-town/experimental/']],
    ['/cello-town/index.html',['實驗版','/cello-town/experimental/']],
    ['/cello-town/experimental/',['正式版','/cello-town/']],
    ['/cello-town/experimental/index.html?x=1#test',['正式版','/cello-town/']],
    ['/cello-town/experimental',['正式版','/cello-town/']]
  ]){
    const link={textContent:'實驗版',href:'/cello-town/experimental/'},switcher={hidden:true,querySelector:()=>link};
    const context={location:new URL(url,'https://corcovadoming.github.io'),document:{getElementById:()=>switcher}};
    vm.runInNewContext(script,context);
    assert.deepEqual([link.textContent,link.href],want,url);
    assert.equal(switcher.hidden,false);
  }
});
