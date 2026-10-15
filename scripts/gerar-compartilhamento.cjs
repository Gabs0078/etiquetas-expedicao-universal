'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
async function gerar(){
 const raiz=path.resolve(__dirname,'..');
 const logo=await fs.readFile(path.join(raiz,'assets/icons/app-icon.svg'),'utf8');
 const html=`
<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#0f172a;color:#f8fafc;font-family:Arial,sans-serif}
.card{position:relative;isolation:isolate;width:100%;height:100%;padding:72px 80px;overflow:hidden;background:radial-gradient(ellipse at 95% 0%,#12374a 0%,transparent 60%)}
.band{position:absolute;z-index:-1;height:24px;right:-80px;left:490px;top:96px;transform:skewX(-25deg);background:#16435980}
.band.second{left:600px;top:140px;height:14px;background:#16435950}
.brand{display:flex;gap:28px;align-items:center;justify-content:center}.brand svg{width:100px;height:100px}.wordmark{font-size:100px;letter-spacing:-5px;font-weight:750;line-height:1}.wordmark span{color:#38bdf8}
h1{text-align:center;font-size:48px;letter-spacing:-1.3px;line-height:1.15;margin:55px 0 18px;font-weight:650}
p{text-align:center;font-size:28px;line-height:1.4;color:#cbd5e1;margin:0}
.steps{display:flex;align-items:center;gap:22px;margin-top:66px;font-size:24px;font-weight:600;letter-spacing:-.3px}
.step{display:flex;align-items:center;gap:13px;white-space:nowrap}.number{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:#0c4a6e;color:#7dd3fc;font-size:22px}
.line{height:1px;background:#334155;flex:1}
</style><div class="card"><div class="band"></div><div class="band second"></div><div class="brand">%LOGO%<div class="wordmark">Tag<span>EX</span></div></div><h1>Etiquetas para expedição</h1><p>Preencha, importe XML e imprima.</p><div class="steps"><div class="step"><span class="number">1</span>Preencher</div><span class="line"></span><div class="step"><span class="number">2</span>Conferir</div><span class="line"></span><div class="step"><span class="number">3</span>Imprimir</div></div></div></html>
`.replace('%LOGO%',logo);
 const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{});
 try{const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);await fs.mkdir(path.join(raiz,'assets/brand'),{recursive:true});await page.screenshot({path:path.join(raiz,'assets/brand/tagex-compartilhamento-v1.png')});}
 finally{await browser.close()}
 console.log('Imagem de compartilhamento gerada: 1200 × 630.');
}
gerar().catch(e=>{console.error(e);process.exitCode=1});
