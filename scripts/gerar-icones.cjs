'use strict';
// Brand vectors are the editable source; PNGs and the multi-resolution Windows ICO are derived.
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),sizes=[16,20,24,32,40,48,64,128,256];
function dib(size,rgba){
 const stride=Math.ceil(size/32)*4,pixels=size*size*4,out=Buffer.alloc(40+pixels+stride*size);
 out.writeUInt32LE(40,0);out.writeInt32LE(size,4);out.writeInt32LE(size*2,8);out.writeUInt16LE(1,12);out.writeUInt16LE(32,14);out.writeUInt32LE(pixels,20);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const from=(y*size+x)*4,to=40+((size-1-y)*size+x)*4;
  out[to]=rgba[from+2];out[to+1]=rgba[from+1];out[to+2]=rgba[from];out[to+3]=rgba[from+3];
  if(!rgba[from+3])out[40+pixels+(size-1-y)*stride+(x>>3)]|=1<<(7-(x&7));
 }
 return out;
}
function ico(images){
 const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);let offset=header.length;
 images.forEach(({size,data},i)=>{const p=6+i*16;header[p]=header[p+1]=size===256?0:size;header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(data.length,p+8);header.writeUInt32LE(offset,p+12);offset+=data.length;});
 return Buffer.concat([header,...images.map(i=>i.data)]);
}
async function generate(){
 const svg=await fs.readFile(path.join(root,'assets/icons/app-icon.svg'),'utf8'),browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const page=await browser.newPage();
  const images=[];
  for(const size of [...sizes,192,512]){
   const result=await page.evaluate(async({svg,size})=>{
    const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await img.decode();
    const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,size,size);
    return {png:c.toDataURL('image/png').split(',')[1],rgba:size<256?Array.from(ctx.getImageData(0,0,size,size).data):null};
   },{svg,size});
   const png=Buffer.from(result.png,'base64');
   if(size===192||size===512)await fs.writeFile(path.join(root,'assets/icons/app-icon-'+size+'.png'),png);
   else images.push({size,data:size===256?png:dib(size,result.rgba)});
  }
  await fs.writeFile(path.join(root,'assets/icons/app-icon.ico'),ico(images));
  for(const name of ['tagex-monogram','tagex-wordmark']){
  const vector=await fs.readFile(path.join(root,'assets/brand',name+'.svg'),'utf8');
  const png=await page.evaluate(async svg=>{
   const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await img.decode();
   const bounds=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
   const c=document.createElement('canvas');c.width=bounds[2]*4;c.height=bounds[3]*4;c.getContext('2d').drawImage(img,0,0,c.width,c.height);
   return c.toDataURL('image/png').split(',')[1];
  },vector);
  await fs.writeFile(path.join(root,'assets/brand',name+'.png'),Buffer.from(png,'base64'));
  }
 }finally{await browser.close();}
}
if(require.main===module)generate().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={generate};
