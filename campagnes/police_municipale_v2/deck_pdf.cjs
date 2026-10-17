const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for (const [f,o,w,h] of [['deck.html',process.argv[2],'297mm','210mm'],['recap.html',process.argv[3],'420mm','297mm']]){
await p.goto('file://'+__dirname+'/'+f);await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
await p.pdf({path:o,width:w,height:h,printBackground:true,preferCSSPageSize:true});
if(f=='recap.html'){await p.setViewportSize({width:1587,height:1123});await p.screenshot({path:o.replace('.pdf','.png'),fullPage:false});}}
await b.close()})();
