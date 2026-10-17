const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+__dirname+'/decl_pages.html');await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
await p.pdf({path:process.argv[2],width:'297mm',height:'210mm',printBackground:true,preferCSSPageSize:true});await b.close()})();
