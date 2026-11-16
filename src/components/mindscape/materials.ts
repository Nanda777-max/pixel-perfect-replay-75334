import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
export function tokenColour(name:string) {
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');if(!ctx)return 'rgb(128,128,128)';ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--'+name).trim();ctx.fillRect(0,0,1,1);const pixel=ctx.getImageData(0,0,1,1).data;return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
}
export function roomTexture(kind:'wood'|'paper'|'rug') {
 const canvas=document.createElement('canvas'); canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d'); if(!ctx)return new CanvasTexture(canvas);
 const css=getComputedStyle(document.documentElement);
 ctx.fillStyle=css.getPropertyValue(kind==='wood'?'--wood-light':kind==='rug'?'--sage':'--paper');ctx.fillRect(0,0,512,512);
 for(let i=0;i<700;i++) {const n=(Math.sin(i*127.1)*43758.54)%1;ctx.globalAlpha=.06+Math.abs(n)*.12;ctx.fillStyle=css.getPropertyValue(kind==='wood'?'--wood':'--foreground'); if(kind==='wood')ctx.fillRect(0,i%512,512,1);else ctx.fillRect(Math.abs(n)*512,(i*83)%512,2,kind==='rug'?12:2);}
 ctx.globalAlpha=.2;if(kind==='wood'){for(let i=0;i<8;i++){ctx.strokeStyle=css.getPropertyValue('--wood');ctx.strokeRect(i*64,0,64,512);}}
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.wrapS=texture.wrapT=RepeatWrapping;return texture;
}