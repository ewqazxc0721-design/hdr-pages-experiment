const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.avif':'image/avif','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+(route==='/'?'/index.html':route));
  if(!target.startsWith(root+path.sep)||route.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);return res.end();}
  fs.readFile(target,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(8765,'127.0.0.1',()=>console.log('http://127.0.0.1:8765/matrix.html'));
