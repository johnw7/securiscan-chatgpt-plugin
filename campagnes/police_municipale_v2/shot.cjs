const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for(const f of process.argv.slice(2)){const p=await b.newPage({viewport:{width:1240,height:1754},deviceScaleFactor:3});
await p.goto('file://'+__dirname+"/"+f+".html");await p.waitForLoadState('networkidle');await p.waitForFunction(()=>document.body.dataset.ok);await p.waitForTimeout(300);
await (await p.$('#poster')).screenshot({path:__dirname+'/'+f+'.png',omitBackground:true});await p.close()}
await b.close()})();
