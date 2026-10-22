// Isolated battle document: removing the frame disposes its listeners, audio and GPU context.
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function enterBeat({engine,input,audio,boss='sloth',onFinish}) {
 const wasPaused=engine.paused;
 const fade=document.createElement('div');fade.style.cssText='position:fixed;inset:0;z-index:80;background:#040710;opacity:0;transition:opacity .45s;pointer-events:none';document.body.append(fade);
 const clear=()=>{input.down.clear();input.pressed.clear();};
 clear();audio.duck?.(true);audio.ctx?.suspend();requestAnimationFrame(()=>fade.style.opacity='1');await wait(480);engine.paused=true;
 const frame=document.createElement('iframe');frame.id='beat-host';frame.title='THE BEAT';frame.allow='autoplay; gamepad';frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:70;background:#080f18';
 const params=new URLSearchParams({boss,embedded:'1'}),q=new URLSearchParams(location.search);
 for(const k of ['assist','padtest','music','offset','summon'])if(q.has(k))params.set(k,q.get(k));
 if(q.get('beattest')==='1')params.set('test','1');
 frame.src='/rpg/play/pitch/beat/?'+params;
 let finished=false;
 const finish=async result=>{if(finished)return;finished=true;fade.style.opacity='1';await wait(480);removeEventListener('message',receive);frame.remove();clear();onFinish(result);engine.paused=wasPaused;audio.duck?.(false);audio.ctx?.resume();document.querySelector('#view')?.focus();fade.style.opacity='0';await wait(500);fade.remove();};
 const receive=e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='beat-complete'&&e.data.boss===boss)void finish(e.data.result);};
 addEventListener('message',receive);document.body.append(frame);
 frame.addEventListener('load',()=>{frame.contentWindow.focus();fade.style.opacity='0';},{once:true});
}
