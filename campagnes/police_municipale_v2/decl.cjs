const { chromium } = require('playwright'); const fs = require('fs');
(async()=>{const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const only=process.argv.slice(3);
const b=await chromium.launch();const p=await b.newPage();
for(const l of fs.readFileSync(__dirname+'/decl/jobs.txt','utf8').trim().split('\n')){
 const [n,w,h]=l.split(' '); if(only.length&&!only.includes(n))continue;
 await p.setViewportSize({width:+w,height:+h});
 await p.goto('file://'+__dirname+'/decl/'+n+'.html');
 await p.waitForSelector('body[data-ok]');await p.waitForLoadState('networkidle');
 await p.locator('#f').screenshot({path:out+'/'+n+'.jpg',type:'jpeg',quality:92});}
await b.close()})();
