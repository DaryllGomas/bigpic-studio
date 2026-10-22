// Presentation clocks never enter the deterministic duel kernel.
const $=s=>document.querySelector(s);
export function initMotion(){
 const image=$('#siren'),canvas=document.createElement('canvas');canvas.id='siren-flow';canvas.className='siren-art';canvas.setAttribute('aria-hidden','true');image.after(canvas);
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false});
 if(!gl){canvas.hidden=true;$('#arena').dataset.flow='css-fallback';return;}
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform sampler2D art;uniform float time;
 void main(){vec2 q=vec2(uv.x,1.-uv.y);float robe=smoothstep(.18,.85,q.y);float flow=sin(q.y*32.-time*2.3)*.004+sin(q.y*57.+time*1.7)*.002;
 q.x+=flow*(.28+robe);q.y+=sin(q.x*28.+time)*.0015*robe;
 vec4 c=texture2D(art,q);float screen=step(c.r,c.b*1.13)*step(c.g,c.b*.97)*robe;
 c.rgb*=1.+screen*(sin(q.y*185.+time*11.)*.09+sin(time*4.)*.05);gl_FragColor=c;}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
 gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 let uploaded='';const time=gl.getUniformLocation(program,'time');
 function frame(t){
  if(image.complete&&image.naturalWidth&&uploaded!==image.src){canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;gl.viewport(0,0,canvas.width,canvas.height);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);uploaded=image.src;canvas.style.setProperty('--face-offset',getComputedStyle(image).getPropertyValue('--face-offset'));image.style.opacity='0';$('#arena').dataset.flow='webgl';}
  if(uploaded){gl.uniform1f(time,t/1000);gl.drawArrays(gl.TRIANGLES,0,6);}requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
}
function particles(x,y,n,colour,spread=130){
 for(let i=0;i<n;i++){
  const el=document.createElement('i');el.className='battle-particle';el.style.background=colour;$('#effects').append(el);
  const angle=i*2.39996,dist=spread*(.35+(i%7)/9);
  const animation=el.animate([{left:x+'px',top:y+'px',opacity:1,transform:'scale(1)'},{left:x+Math.cos(angle)*dist+'px',top:y+Math.sin(angle)*dist+40+'px',opacity:0,transform:'scale(.1)'}],{duration:650+i%4*70,easing:'ease-out'});animation.onfinish=()=>el.remove();
 }
}
export async function castMotion(result,wait){
 const arena=$('#arena'),caster=$(result.actor?'#siren-stage':'#atlas'),target=$(result.actor?'#atlas':'#siren-stage');
 const strong=result.power||result.maxRun>=4||result.waves>=3,scale=result.power?1:result.maxRun>=5?1:.65;
 caster.classList.add('casting');arena.dataset.beat='freeze';
 $('#board').classList.add('hit-stop');await wait(strong?100:60);$('#board').classList.remove('hit-stop');
 const w=innerWidth,h=innerHeight,from={x:w*(result.actor?.79:.19),y:h*.48},to={x:w*(result.actor?.2:.79),y:h*.5};
 const bolt=document.createElement('i');bolt.className='cast-bolt';bolt.classList.toggle('violet',!!result.actor);$('#effects').append(bolt);arena.dataset.beat='projectile';
 // Powered impact lands during the panel hold; clears follow as it slides out.
 const flightMs=result.power?600:300,impactMs=result.power?900:strong?400:420;
 const flight=bolt.animate([{left:from.x+'px',top:from.y+'px',transform:`rotate(${result.actor?178:2}deg) scale(${scale})`},{left:to.x+'px',top:to.y+'px',transform:`rotate(${result.actor?178:2}deg) scale(${scale})`}],{duration:flightMs,easing:'ease-in'});
 await flight.finished;bolt.remove();arena.dataset.beat='impact';target.classList.add('recoiling');
 particles(to.x,to.y,strong?30:12,result.actor?'#bbb5ff':'#b8f5ff',strong?150:80);
 const flash=document.createElement('i');flash.className='impact-flash';flash.style.left=to.x+'px';flash.style.top=to.y+'px';$('#effects').append(flash);flash.animate([{opacity:1,scale:'.2'},{opacity:0,scale:'2'}],{duration:impactMs-40}).onfinish=()=>flash.remove();
 const shake=strong?7*scale:3;arena.animate([{translate:'0 0'},{translate:`${-shake}px ${shake/2}px`},{translate:`${shake}px ${-shake/2}px`},{translate:'0 0'}],{duration:260});
 await wait(impactMs);target.classList.remove('recoiling');caster.classList.remove('casting');delete arena.dataset.beat;
}
export async function shatter(tiles,wait,duration=650){
 $('#arena').dataset.transition='shatter';
 tiles.forEach((t,i)=>{const r=t.getBoundingClientRect();particles(r.x+r.width/2,r.y+r.height/2,3,i%2?'#ffdf9c':'#bbf4ff',65);t.animate([{opacity:1,scale:'1'},{opacity:0,scale:'.05',translate:`${(i%8-3.5)*16}px -40px`}],{duration:duration*.92,fill:'forwards'});});
 await wait(duration);$('#arena').dataset.transition='push';$('#board').style.visibility='hidden';await wait(duration);
}
export async function reform(tiles,wait,duration=900){
 $('#arena').dataset.transition='reform';$('#board').style.visibility='';
 tiles.forEach((t,i)=>{t.getAnimations().forEach(a=>a.cancel());t.animate([{opacity:0,translate:'0 100px',filter:'brightness(3)'},{opacity:1,translate:'0 0',filter:'brightness(1)'}],{duration:duration*.67,delay:(7-Math.floor(i/8))*duration*.039,fill:'backwards'});});
 await wait(duration);delete $('#arena').dataset.transition;
}
