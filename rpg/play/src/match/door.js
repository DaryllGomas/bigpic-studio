// A separate document owns the duel's audio, input and rendering resources.
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function enterMatch({engine,input,audio,onFinish}) {
 const wasPaused=engine.paused,wasRunning=audio.ctx?.state==='running';
 const clear=()=>{input.down.clear();input.pressed.clear();};
 const fade=document.createElement('div');
 fade.style.cssText='position:fixed;inset:0;z-index:80;background:#040710;opacity:0;transition:opacity .45s;pointer-events:none';
 document.body.append(fade);clear();audio.duck?.(true);void audio.ctx?.suspend();
 requestAnimationFrame(()=>fade.style.opacity='1');await wait(480);engine.paused=true;
 const frame=document.createElement('iframe');frame.id='match-host';frame.title='The Current';frame.allow='autoplay; gamepad';
 frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:70;background:#080f18';
 frame.src='/rpg/play/pitch/current-match/?embedded=1';
 let finished=false;
 const finish=async result=>{
  if(finished)return;finished=true;fade.style.opacity='1';await wait(480);
  removeEventListener('message',receive);frame.remove();clear();
  try{onFinish(result);}finally{
   engine.paused=wasPaused;audio.duck?.(false);if(wasRunning)void audio.ctx?.resume();
   document.querySelector('#view')?.focus();fade.style.opacity='0';await wait(500);fade.remove();
  }
 };
 const receive=e=>{
  if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='match-complete'||e.data.boss!=='current')return;
  if(e.data.result===null||e.data.result?.won===true)void finish(e.data.result);
 };
 addEventListener('message',receive);
 frame.addEventListener('load',()=>{frame.contentWindow.focus();fade.style.opacity='0';},{once:true});
 document.body.append(frame);
}
