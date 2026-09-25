import { detectPlatform, profileFor, candidateStatus, analyzePixels, csvValue } from './matrix-core.mjs';
const $ = id => document.getElementById(id);
const KEY='hdr-calibration-matrix-v1';
const envForm=$('environment-form'), cellForm=$('cell-form');
const settingNames={auto_brightness:'自动亮度',low_power:'低电量模式',night_shift:'夜览 / 护眼',true_tone:'原彩 / 自适应色彩',system_theme:'系统主题'};
for(const [name,label] of Object.entries(settingNames)){
  const node=document.createElement('label');node.textContent=label;
  const select=document.createElement('select');select.name=name;
  const options=name==='system_theme'?['unknown','light','dark']:['unknown','on','off','unavailable'];
  for(const value of options) select.add(new Option({unknown:'未记录',light:'浅色',dark:'深色',on:'ON',off:'OFF',unavailable:'无此设置'}[value],value));
  node.append(select);$('robustness').append(node);
}
let manifest,samples,selected=0,mode='hdr',analysis=null,shotImage=null,shotInfo=null,selection=null;
let store={trials:[],active:null}, diag={}, hints={};
try { const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.trials&&saved.active)store=saved; } catch {}
const active=()=>store.active;
const environment=()=>Object.fromEntries(new FormData(envForm));
const ua=navigator.userAgent;
const mq=matchMedia('(dynamic-range: high)');
const supports={noLimit:CSS.supports('dynamic-range-limit','no-limit'),standard:CSS.supports('dynamic-range-limit','standard')};
function makeTrial(env){return {schema_version:1,trial_id:crypto.randomUUID(),created_at:new Date().toISOString(),profile:profileFor(env),protocol:'matrix-v1',environment:env,observations:{}};}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(store));$('save-status').textContent='已自动保存在本浏览器。截图不保存、不上传；请导出 JSON / CSV 留档。';}catch{$('save-status').textContent='本地保存不可用或空间不足，请立即导出记录。';}}
function getEnv(){return active().environment;}
function syncEnvironment(){
  if(Object.keys(active().observations).length)return;
  active().environment=environment();active().profile=profileFor(getEnv());
  analysis=null;renderProfile();renderLayout();persist();
}
function renderProfile(){
  $('profile').textContent=active().profile;
  const locked=Object.keys(active().observations).length>0;
  $('environment-fields').disabled=locked;
  $('trial-status').textContent=`试次 ${active().trial_id.slice(0,8)} · ${Object.keys(active().observations).length}/54 格已记录 · 历史 ${store.trials.length} 次。${locked?'条件已锁定；改变条件请新建试次。':'先填写条件，再进行评分。'}`;
}
function updateDiagnostics(){
  diag={userAgent:ua,userAgentData:hints,platformGuess:detectPlatform(ua,hints,navigator.maxTouchPoints),profile:active()?.profile,dynamicRangeHigh:mq.matches,videoDynamicRangeHigh:matchMedia('(video-dynamic-range: high)').matches,supports,DPR:devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},orientation:innerWidth>innerHeight?'landscape':'portrait',visualViewportScale:window.visualViewport?.scale??null,matrixRowFilter:$('row-filter').value,matrixSampleWidth:Number($('sample-size').value),contentLayout:active()?.environment.content_layout,actualHDROutput:'unverified; requires user A/B observation',imageErrors:[...document.querySelectorAll('#matrix img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.dataset.cell)};
  $('diagnostics').textContent=JSON.stringify(diag,null,2);
  $('capability').textContent=`dynamic-range: high = ${mq.matches} · no-limit ${supports.noLimit?'支持':'不支持'} / standard ${supports.standard?'支持':'不支持'}。${diag.imageErrors.length?'部分图片加载失败，请刷新。':'能力报告不代表实际 HDR 已显示。'}`;
  const images=[...document.querySelectorAll('#matrix img')];
  $('loaded').textContent=`${images.filter(i=>i.complete&&i.naturalWidth>0).length} / 54 已解码`;
}
function sampleNode(cell,focus=false){
  const container=document.createElement('div');container.className=focus?'focus-sample':'cell';
  if(!focus){container.dataset.cell=cell.id;
    const head=document.createElement('div');head.className='cell-head';
    const button=document.createElement('button');button.type='button';button.textContent=cell.id;button.setAttribute('aria-label',`选择 ${cell.id} B${cell.bg_nit} T${cell.text_nit}`);button.addEventListener('click',()=>selectCell(manifest.cells.indexOf(cell),true));
    const params=document.createElement('span');params.textContent=`B${cell.bg_nit} / T${cell.text_nit}`;head.append(button,params);container.append(head);
  }else{const caption=document.createElement('div');caption.className='sample-caption';caption.textContent=`${cell.id} · B${cell.bg_nit} / T${cell.text_nit} nit · ${mode==='hdr'?'HDR':mode==='standard'?'standard':'SDR 基准'}`;container.append(caption);}
  const image=document.createElement('img');image.src=`assets/matrix-v1/${cell.file}`;image.width=manifest.width;image.height=manifest.height;image.className='hdr-asset';image.alt=`${cell.id} 测试 AB12`;image.dataset.cell=cell.id;image.addEventListener('load',updateDiagnostics);image.addEventListener('error',updateDiagnostics);
  const baseline=document.createElement('div');baseline.className='sdr-baseline';baseline.textContent=manifest.text;container.append(image,baseline);
  if(!focus){const foot=document.createElement('div');foot.className='cell-foot';foot.textContent=cell.bg_nit===cell.text_nit?'零对比度对照':'尚未评分';container.append(foot);}
  return container;
}
function renderMatrix(){
  for(let r=0;r<6;r++){
    $('row-filter').add(new Option(`${String.fromCharCode(65+r)} 行 · B${manifest.backgrounds[r]} nit`,String(r)));
    const row=document.createElement('div');row.className='matrix-row';row.dataset.row=r;
    manifest.cells.filter(c=>c.row===r).forEach(c=>row.append(sampleNode(c)));$('matrix').append(row);
  }
  manifest.cells.forEach((c,i)=>$('cell-picker').add(new Option(`${c.id} · B${c.bg_nit} / T${c.text_nit}`,i)));
}
function renderLayout(){
  const layout=getEnv().content_layout;
  $('matrix').hidden=layout!=='matrix';
  $('focus-samples').replaceChildren();$('focus-samples').dataset.mode=mode;
  if(layout!=='matrix'){
    const count=layout==='six'?6:layout==='twelve'?12:1;
    for(let n=0;n<count;n++) $('focus-samples').append(sampleNode(manifest.cells[selected],true));
  }
}
function setMode(next){
  mode=next;$('experiment').dataset.mode=mode;$('focus-samples').dataset.mode=mode;
  document.querySelectorAll('[data-mode][aria-pressed]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('mode-note').textContent=mode==='hdr'?'A：请求真实 HDR 显示。原屏评分请在此模式进行。':mode==='standard'?'B：同一 AVIF 限制到 SDR，仅作参考，不等于系统截图。':'C：普通黑字浅底 HTML，不使用 HDR，B/T 参数不适用于此基准。';
  if(mode==='standard'&&!supports.standard)$('mode-note').textContent+=' 当前浏览器不支持此 CSS 属性，不能形成有效对照。';
  analysis=null;$('analysis-previews').hidden=true;$('analysis-status').textContent='显示模式已改变，请确认截图模式并重新分析。';
  renderLayout();updateDiagnostics();
}
function selectCell(index,scroll=false){
  selected=(index+54)%54;const cell=manifest.cells[selected];$('cell-picker').value=selected;
  $('focus-label').textContent=`${cell.id} · B${cell.bg_nit} / T${cell.text_nit}`;
  document.querySelectorAll('.cell').forEach(node=>node.classList.toggle('selected',node.dataset.cell===cell.id));
  const record=active().observations[cell.id];cellForm.reset();
  if(record)for(const key of ['screen_score','zoom_readable','enhanced_readable','delta_threshold','cell_notes'])cellForm.elements[key].value=record[key]??'';
  analysis=record?.analysis??null;
  selection=null;drawShot();
  $('analysis-previews').hidden=true;$('analysis-status').textContent=analysis?`此格已保存 ΔY=${analysis.shot_delta_y.toFixed(4)}。再次分析会替换本格测量。`:'尚未分析当前格；请框选该编号对应的测试图。';
  $('cell-result').textContent=record?record.conclusion:'';renderLayout();
  if(scroll)$('focus-panel').scrollIntoView({behavior:'auto',block:'start'});
}
function renderResults(){
  $('results').replaceChildren();let candidates=0;
  for(const cell of manifest.cells){
    const record=active().observations[cell.id];if(!record)continue;
    if(record.conclusion.startsWith('候选'))candidates++;
    const tr=document.createElement('tr');
    for(const text of [cell.id,`${cell.bg_nit}/${cell.text_nit}`,record.screen_score??'—',record.analysis?.shot_delta_y.toFixed(3)??'—',record.conclusion]){const td=document.createElement('td');td.textContent=text;tr.append(td);}$('results').append(tr);
    const card=[...document.querySelectorAll('.cell')].find(n=>n.dataset.cell===cell.id);card.querySelector('.cell-foot').textContent=`原屏 ${record.screen_score??'—'} / 4 · ${record.conclusion}`;
  }
  $('summary').textContent=`本次记录 ${Object.keys(active().observations).length}/54 格，初筛候选 ${candidates} 格。候选仅适用于本试次条件，尚未证明跨平台或不同亮度下稳定。`;
}
function download(text,type,name){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function allTrials(){return [...store.trials,active()].map(t=>({...t,cells:Object.values(t.observations),observations:undefined}));}
function exportCsv(){
  const columns=['trial_id','created_at','profile',...Object.keys(getEnv()),'id','bg_nit','text_nit','screen_score','shot_delta_y','y_bg','y_text','zoom_readable','enhanced_readable','delta_threshold','conclusion','cell_notes','mode','orientation','DPR','viewport','screenshot_file','analysis_details'];
  const rows=[columns.map(csvValue).join(',')];
  for(const trial of allTrials())for(const cell of trial.cells){
    const row={...trial,...trial.environment,...cell,shot_delta_y:cell.analysis?.shot_delta_y,y_bg:cell.analysis?.y_bg,y_text:cell.analysis?.y_text,orientation:cell.diagnostics?.orientation,DPR:cell.diagnostics?.DPR,viewport:JSON.stringify(cell.diagnostics?.viewport),screenshot_file:cell.analysis?.file?.name,analysis_details:JSON.stringify(cell.analysis)};
    rows.push(columns.map(k=>csvValue(row[k])).join(','));
  }
  download('\uFEFF'+rows.join('\r\n'),'text/csv;charset=utf-8',`hdr-matrix-${Date.now()}.csv`);
}
function drawShot(){
  const canvas=$('screenshot-canvas'),ctx=canvas.getContext('2d');if(!shotImage)return;
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(shotImage,0,0);
  if(selection){ctx.strokeStyle='#00b77b';ctx.lineWidth=Math.max(2,canvas.width/300);ctx.strokeRect(selection.x,selection.y,selection.w,selection.h);}
}
function selectRect(rect){selection=rect;for(const [field,key]of [['crop-x','x'],['crop-y','y'],['crop-w','w'],['crop-h','h']])$(field).value=Math.round(rect[key]);drawShot();}
function imagePoint(event){const canvas=$('screenshot-canvas'),rect=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(event.clientX-rect.left)*canvas.width/rect.width)),y:Math.max(0,Math.min(canvas.height,(event.clientY-rect.top)*canvas.height/rect.height))};}
let dragStart=null;
$('screenshot-canvas').addEventListener('pointerdown',e=>{dragStart=imagePoint(e);e.currentTarget.setPointerCapture(e.pointerId);});
$('screenshot-canvas').addEventListener('pointermove',e=>{if(!dragStart)return;const p=imagePoint(e);selectRect({x:Math.min(p.x,dragStart.x),y:Math.min(p.y,dragStart.y),w:Math.abs(p.x-dragStart.x),h:Math.abs(p.y-dragStart.y)});});
$('screenshot-canvas').addEventListener('pointerup',()=>{dragStart=null;});
$('screenshot-canvas').addEventListener('pointercancel',()=>{dragStart=null;});
for(const id of ['crop-x','crop-y','crop-w','crop-h'])$(id).addEventListener('input',()=>{selection={x:+$('crop-x').value,y:+$('crop-y').value,w:+$('crop-w').value,h:+$('crop-h').value};drawShot();});
$('screenshot').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  analysis=null;shotImage=null;shotInfo=null;selection=null;$('screenshot-wrap').hidden=true;$('confirm-sdr').checked=false;$('analysis-previews').hidden=true;
  if(!['image/png','image/jpeg'].includes(file.type)){$('analysis-status').textContent='仅接受 SDR PNG / JPEG。HDR 截图请保留原文件，记录可读性即可。';return;}
  const url=URL.createObjectURL(file),image=new Image();
  try{image.src=url;await image.decode();if(image.width*image.height>40000000)throw Error('截图过大，请先用系统截图工具裁出测试区域。');shotImage=image;shotInfo={name:file.name,type:file.type,size:file.size,width:image.width,height:image.height};
    const canvas=$('screenshot-canvas');canvas.width=image.width;canvas.height=image.height;selection=null;$('screenshot-wrap').hidden=false;drawShot();$('analysis-status').textContent=`已载入 ${image.width}×${image.height}。请拖动框选 ${manifest.cells[selected].id} 的完整测试图（宽高比 3:1）。`;
  }catch(error){$('analysis-status').textContent=`无法读取截图：${error.message}`;}finally{URL.revokeObjectURL(url);}
});
$('analyze').addEventListener('click',()=>{
  try{
    if(!shotImage||!selection)throw Error('请载入截图并选择区域。');
    if(!$('confirm-sdr').checked||getEnv().capture_mode!=='SDR'||getEnv().screenshot_hdr!=='no')throw Error('请确认试次为 SDR、截图不保留 HDR，并勾选原始 SDR 文件确认。');
    const {x,y,w,h}=selection;
    if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<240||h<80||x+w>shotImage.width||y+h>shotImage.height)throw Error('选区必须在截图内，且至少 240×80 像素；推荐单格复测截图。');
    if(Math.abs(w/h-3)>.12)throw Error('请框选整张测试图内部，宽高比应接近 3:1，不包含编号或边框。');
    const preview=$('crop-preview');preview.width=480;preview.height=160;const ctx=preview.getContext('2d',{colorSpace:'srgb',willReadFrequently:true});ctx.drawImage(shotImage,x,y,w,h,0,0,480,160);
    const pixels=ctx.getImageData(0,0,480,160);
    analysis={...analyzePixels(pixels.data,samples),cell_id:manifest.cells[selected].id,mode,rect:{x,y,w,h},file:shotInfo,original_sdr_confirmed:true,analyzed_at:new Date().toISOString()};
    const enhanced=$('enhanced-preview');enhanced.width=480;enhanced.height=160;const ec=enhanced.getContext('2d');
    const sorted=[];for(let i=0;i<pixels.data.length;i+=4)sorted.push((pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3);sorted.sort((a,b)=>a-b);
    const low=sorted[Math.floor(sorted.length*.01)],high=sorted[Math.floor(sorted.length*.99)];
    const output=ec.createImageData(480,160);
    for(let i=0;i<pixels.data.length;i+=4){for(let c=0;c<3;c++)output.data[i+c]=high>low?Math.max(0,Math.min(255,(pixels.data[i+c]-low)*255/(high-low))):pixels.data[i+c];output.data[i+3]=255;}
    ec.putImageData(output,0,0);$('analysis-previews').hidden=false;
    $('analysis-status').textContent=`${analysis.cell_id}：Y背景=${analysis.y_bg.toFixed(4)}；Y文字=${analysis.y_text.toFixed(4)}；ΔY=${analysis.shot_delta_y.toFixed(4)} / 255。手工对齐可能引入误差；请放大并检查增强预览，再保存本格记录。`;
  }catch(error){analysis=null;$('analysis-previews').hidden=true;$('analysis-status').textContent=error.message;}
});
$('clear-analysis').addEventListener('click',()=>{analysis=null;$('analysis-previews').hidden=true;$('analysis-status').textContent='当前分析已清除；保存本格记录后生效。';});
cellForm.addEventListener('submit',event=>{
  event.preventDefault();if(mode!=='hdr'){$('cell-result').textContent='请切回 A · HDR 再评估原屏可读性并保存。';return;}
  if(!getEnv().device.trim()||!getEnv().os_version.trim()){$('cell-result').textContent='请先填写设备型号与 OS 版本，避免混淆不同平台记录。';return;}
  updateDiagnostics();const values=Object.fromEntries(new FormData(cellForm));const cell=manifest.cells[selected];
  const record={id:cell.id,bg_nit:cell.bg_nit,text_nit:cell.text_nit,screen_score:values.screen_score===''?null:Number(values.screen_score),zoom_readable:values.zoom_readable,enhanced_readable:values.enhanced_readable,delta_threshold:Number(values.delta_threshold),cell_notes:values.cell_notes,analysis:analysis?.cell_id===cell.id?analysis:null,mode,diagnostics:structuredClone(diag),recorded_at:new Date().toISOString()};
  record.shot_delta_y=record.analysis?.shot_delta_y??null;record.conclusion=candidateStatus(record,getEnv());active().observations[cell.id]=record;active().updated_at=new Date().toISOString();persist();renderProfile();renderResults();$('cell-result').textContent=`已保存 ${cell.id}：${record.conclusion}`;
});
envForm.addEventListener('change',syncEnvironment);
$('new-trial').addEventListener('click',()=>{
  const prior=getEnv();if(Object.keys(active().observations).length)store.trials.push(active());
  store.active=makeTrial({...prior});$('environment-fields').disabled=false;analysis=null;
  document.querySelectorAll('.cell-foot').forEach(n=>n.textContent='尚未评分');
  renderProfile();selectCell(selected);renderResults();persist();updateDiagnostics();
});
$('export-json').addEventListener('click',()=>download(JSON.stringify({schema_version:1,exported_at:new Date().toISOString(),trials:allTrials()},null,2),'application/json',`hdr-matrix-${Date.now()}.json`));
$('export-csv').addEventListener('click',exportCsv);
document.querySelectorAll('.modebar button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('row-filter').addEventListener('change',e=>document.querySelectorAll('.matrix-row').forEach(row=>row.hidden=e.target.value!=='all'&&row.dataset.row!==e.target.value));
$('sample-size').addEventListener('change',e=>$('matrix').style.setProperty('--sample-width',`${e.target.value}px`));
$('cell-picker').addEventListener('change',e=>selectCell(Number(e.target.value)));
$('prev-cell').addEventListener('click',()=>selectCell(selected-1));$('next-cell').addEventListener('click',()=>selectCell(selected+1));
mq.addEventListener('change',updateDiagnostics);window.addEventListener('resize',updateDiagnostics);
document.addEventListener('visibilitychange',updateDiagnostics);
async function init(){
  [manifest,samples]=await Promise.all(['assets/matrix-v1/manifest.json','assets/matrix-v1/samples.json'].map(async path=>{const response=await fetch(path);if(!response.ok)throw Error(`加载失败 ${path}`);return response.json();}));
  if(navigator.userAgentData){try{hints=await navigator.userAgentData.getHighEntropyValues(['platformVersion','model','fullVersionList']);}catch{hints=navigator.userAgentData.toJSON();}}
  if(!store.active){
    const env=environment();env.platform=detectPlatform(ua,hints,navigator.maxTouchPoints);env.device=hints.model||'';
    env.browser=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'请确认';
    env.browser_version=(ua.match(env.browser==='Edge'?/Edg\/([\d.]+)/:env.browser==='Chrome'?/Chrome\/([\d.]+)/:/Version\/([\d.]+)/)||[])[1]||'';
    if(env.platform==='Android'&&hints.platformVersion)env.os_version=`Android ${hints.platformVersion}`;
    store.active=makeTrial(env);
  }
  for(const [key,value]of Object.entries(getEnv()))if(envForm.elements[key])envForm.elements[key].value=value;
  renderMatrix();$('experiment').dataset.mode='hdr';renderProfile();selectCell(0);renderResults();updateDiagnostics();persist();
}
init().catch(error=>{$('capability').textContent=`初始化失败：${error.message}。请刷新后重试。`;console.error(error);});
