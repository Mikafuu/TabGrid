import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
    const request=new URL(req.url,'http://localhost');
    const pathname=request.pathname;
    const relative=pathname.startsWith('/_favicon/')?'tileIcon.png':pathname==='/'?'grid.html':decodeURIComponent(pathname.slice(1));
    const path=resolve(root,relative);
    if(!path.startsWith(root+'/')) {res.writeHead(403).end();return;}
    try {
        let data=await readFile(path);
        if(relative==='grid.html') data=data.toString().replace('<script type="module" src="grid.js"></script>','<script type="module" src="tests/preview-chrome.mjs"></script>');
        if(request.searchParams.has('dark')) {
            if(relative==='grid.html') data=data.toString().replace('href="grid.css"','href="grid.css?dark"').replace('href="theme.css"','href="theme.css?dark"');
            if(relative.endsWith('.css')) data=data.toString().replaceAll('(prefers-color-scheme: dark)','all');
        }
        // Fixture-only CSS preference simulation; this does not change the OS.
        if(request.searchParams.has('opaque')) {
            if(relative==='grid.html') data=data.toString().replace('href="glass.css"','href="glass.css?opaque"');
            if(relative==='glass.css') data=data.toString().replace('(prefers-reduced-transparency: reduce)','all');
        }
        res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; connect-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'"});res.end(data);
    }catch{res.writeHead(404).end();}
}).listen(4173,'127.0.0.1',()=>process.stdout.write('TabGrid UI sandbox: http://127.0.0.1:4173\n'));
