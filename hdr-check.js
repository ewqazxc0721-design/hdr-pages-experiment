'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const fixtures={matrix:{src:'assets/matrix-v1/B9-B203-T1000.avif',width:480,height:160},legacy:{src:'assets/hdr-pq-test-tagged.avif',width:1600,height:1250}};
let limited=params.get('range')==='standard';
$('asset').value=params.get('asset')==='legacy'?'legacy':'matrix';
$('layout').value=params.get('layout')==='scroll'?'scroll':'plain';
function refresh(){
  const img=$('test-image'),style=getComputedStyle(img),host=getComputedStyle($('test-host'));
  const ready=img.complete&&img.naturalWidth>0;
  $('status').textContent=`当前：${limited?'SDR · standard':'HDR 请求 · no-limit'}；${ready?'图片已解码':'图片加载中或解码失败'}。`;
  $('toggle').textContent=limited?'切换到 HDR':'切换到 SDR';
  $('toggle').setAttribute('aria-pressed',String(limited));
  $('diagnostics').textContent=JSON.stringify({revision:'flow-2',userAgent:navigator.userAgent,asset:$('asset').value,layout:$('layout').value,requestedRange:limited?'standard':'no-limit',computedRange:style.getPropertyValue('dynamic-range-limit'),dynamicRangeHigh:matchMedia('(dynamic-range: high)').matches,supportsNoLimit:CSS.supports('dynamic-range-limit','no-limit'),supportsStandard:CSS.supports('dynamic-range-limit','standard'),loaded:ready,naturalSize:[img.naturalWidth,img.naturalHeight],displaySize:[img.getBoundingClientRect().width,img.getBoundingClientRect().height],hostOverflow:[host.overflowX,host.overflowY],DPR:devicePixelRatio,actualHDR:'requires physical A/B observation'},null,2);
  const url=new URL(location.href);url.searchParams.set('asset',$('asset').value);url.searchParams.set('layout',$('layout').value);url.searchParams.set('range',limited?'standard':'hdr');history.replaceState(null,'',url);
}
function update(){
  const fixture=fixtures[$('asset').value];
  $('test-host').className=$('layout').value==='scroll'?'scroll':'';
  const img=$('test-image');img.className=limited?'standard':'';img.width=fixture.width;img.height=fixture.height;
  if(img.getAttribute('src')!==fixture.src)img.src=fixture.src;
  refresh();
}
$('toggle').addEventListener('click',()=>{limited=!limited;update();});
$('asset').addEventListener('change',update);$('layout').addEventListener('change',update);
$('reload').addEventListener('click',()=>location.reload());
$('test-image').addEventListener('load',refresh);$('test-image').addEventListener('error',refresh);
window.addEventListener('resize',refresh);matchMedia('(dynamic-range: high)').addEventListener('change',refresh);
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('diagnostics').textContent);$('copy-status').textContent='已复制';}catch{$('copy-status').textContent='请长按上面的文字复制';}});
update();
