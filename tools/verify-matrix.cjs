const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets','matrix-v1'),work=path.join(root,'.calibration-build');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
const [decoder,probe]=process.argv.slice(2);if(!decoder||!probe)throw Error('Usage: node tools/verify-matrix.cjs avifdec ffprobe');
assert.equal(manifest.cells.length,54);assert.equal(new Set(manifest.cells.map(c=>c.id)).size,54);
const report={checked_at:new Date().toISOString(),cells:[]};
for(const cell of manifest.cells){
  const source=path.join(dir,cell.file),decoded=path.join(work,`${cell.id}-decoded.y4m`);
  let result=spawnSync(decoder,['-j','2',source,decoded],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  const raw=b=>b.subarray(b.indexOf(Buffer.from('FRAME\n'))+6);
  assert.ok(raw(fs.readFileSync(decoded)).equals(raw(fs.readFileSync(path.join(work,`${cell.id}.y4m`)))),'Decoded pixels differ for '+cell.id);
  result=spawnSync(probe,['-v','error','-show_streams','-show_frames','-of','json',source],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(result.stdout);
  for(const item of [data.streams[0],data.frames[0]]){
    assert.equal(item.pix_fmt,'yuv444p10le');assert.equal(item.color_primaries,'bt2020');assert.equal(item.color_transfer,'smpte2084');assert.equal(item.color_space,'bt2020nc');assert.equal(item.color_range,'pc');
  }
  report.cells.push({id:cell.id,pixels_lossless:true,container_and_bitstream_hdr:true});
}
fs.mkdirSync(path.join(root,'validation'),{recursive:true});
fs.writeFileSync(path.join(root,'validation','matrix-assets.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS: 54/54 independently decoded, pixels match source exactly, stream and frame metadata verified.');
