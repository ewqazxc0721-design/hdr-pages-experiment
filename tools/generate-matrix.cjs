const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'), work=path.join(root,'.calibration-build');
const out=path.join(root,'assets','matrix-v1');
const encoder=process.argv[2];
if(!encoder) throw Error('Usage: node tools/generate-matrix.cjs /path/to/avifenc');
const W=480,H=160,N=W*H, mask=fs.readFileSync(path.join(work,'text-mask.raw'));
assert.equal(mask.length,N);
const B=[180,203,230,260,300,400],T=[230,260,300,350,400,500,600,800,1000];
function pq(nits){const p=(nits/10000)**(2610/16384);return ((3424/4096+(2413/128)*p)/(1+(2392/128)*p))**(2523/32);}
fs.mkdirSync(out,{recursive:true});
const samples={width:W,height:H,text:[],background:[]};
for(let y=8;y<H-8;y+=3) for(let x=8;x<W-8;x+=3){
  let low=255,high=0;
  for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++) {const v=mask[(y+dy)*W+x+dx];if(Math.abs(dx)<=1&&Math.abs(dy)<=1)low=Math.min(low,v);high=Math.max(high,v);}
  if(low===255) samples.text.push(y*W+x);
  if(high===0) samples.background.push(y*W+x);
}
assert.ok(samples.text.length>50);
fs.writeFileSync(path.join(out,'samples.json'),JSON.stringify(samples));
const manifest={version:'matrix-v1',text:'测试 AB12',width:W,height:H,backgrounds:B,texts:T,cicp:[9,16,9],depth:10,range:'full',encoding:'lossless AV1 YUV444 10-bit',font:'Microsoft YaHei Bold 52px',mask_sha256:createHash('sha256').update(mask).digest('hex'),cells:[]};
for(let r=0;r<B.length;r++) for(let c=0;c<T.length;c++){
  const bg=B[r],text=T[c],id=String.fromCharCode(65+r)+(c+1);
  const pixels=Buffer.alloc(N*6);
  for(let i=0;i<N;i++) pixels.writeUInt16LE(Math.round(pq(bg+(text-bg)*mask[i]/255)*1023),i*2);
  for(let i=N*2;i<pixels.length;i+=2) pixels.writeUInt16LE(512,i);
  const input=path.join(work,`${id}.y4m`), file=`${id}-B${bg}-T${text}.avif`;
  fs.writeFileSync(input,Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F1:1 Ip A1:1 C444p10 XYSCSS=444P10 XCOLORRANGE=FULL\nFRAME\n`),pixels]));
  const result=spawnSync(encoder,['-q','100','-s','6','-j','2','--cicp','9/16/9',input,path.join(out,file)],{encoding:'utf8'});
  if(result.status!==0) throw Error(result.stderr+'\n'+result.stdout);
  const bytes=fs.readFileSync(path.join(out,file));
  // Independent container metadata check. Decoder verification runs separately.
  const colr=bytes.indexOf(Buffer.from('colrnclx'));
  assert.ok(colr>=0);assert.equal(bytes.readUInt16BE(colr+8),9);assert.equal(bytes.readUInt16BE(colr+10),16);assert.equal(bytes.readUInt16BE(colr+12),9);assert.ok(bytes[colr+14]&128);
  manifest.cells.push({id,row:r,column:c,bg_nit:bg,text_nit:text,bg_code:Math.round(pq(bg)*1023),text_code:Math.round(pq(text)*1023),file,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
  console.log(`${id} B${bg}/T${text}: ${bytes.length} bytes`);
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Generated ${manifest.cells.length} fixtures; samples: ${samples.text.length} text / ${samples.background.length} background.`);
