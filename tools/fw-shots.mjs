// Fresh v0.12 photography. Run only on Atlas:
// atlas-run ~/Projects/games/god-game/dist tools/fw-shots.mjs <output>
// Append "late" to capture only the Nexus, Telor and festivals.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM,args:['--use-gl=angle','--use-angle=vulkan','--enable-gpu','--ignore-gpu-blocklist']});
const p=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await p.goto(process.env.SITE_URL+'/index.html?shot=default&unlock=story');
await p.waitForFunction(()=>window.game,null,{timeout:120000});
await p.evaluate(()=>{for(const s of document.querySelectorAll('style'))if(s.textContent.includes('visibility: hidden !important'))s.remove();});
await p.getByText('Begin',{exact:false}).first().click();
await p.waitForFunction(()=>game.pace.confirmed&&game.story.active,null,{timeout:60000});
await p.evaluate(()=>{game.input.inside=false;game.audio.setMuted(true);document.querySelector('.hud').style.opacity='0';});
const pose=async(kind,d,pitch,yaw,hour,dx=0,dz=0)=>p.evaluate(([kind,d,pitch,yaw,hour,dx,dz])=>{
 const c=kind==='city'?game.nexus.site.pos:game.villages[0].worship?.pos??game.villages[0].center;
 game.godCam.setPose({x:c.x+dx,z:c.z+dz,distance:d,pitch,yaw},true,game.terrain);game.dayTime=hour;game.input.inside=false;
},[kind,d,pitch,yaw,hour,dx,dz]);
const shot=async name=>{await p.evaluate(()=>game.postfx.setQuality('high'));await p.waitForTimeout(2500);console.log(name,await p.evaluate(()=>({quality:game.postfx.quality,exposure:game.renderer.toneMappingExposure,camera:game.godCam.getPose()})));await p.screenshot({path:`${process.env.OUT_DIR}/${name}.png`});console.log(name);};
if(!process.argv.includes('late')) {
await p.evaluate(()=>game.advance(20));
await pose('village',78,.68,.5,.42);await shot('01-village');
await pose('village',40,.5,.9,.42,8,12);await shot('01b-cottages');
await p.evaluate(()=>game.shrines.setStage(0,'temple',true));
await p.waitForTimeout(24000);
await pose('village',92,.66,.5,.735);await shot('02-temple');
await pose('village',78,.68,1.7,.68);await shot('02b-temple');
await p.evaluate(()=>{game.rival.ui.advisors.say({who:'spirit',text:'Look at them dance!'},{pri:'important',cooldown:0});});
await p.evaluate(()=>document.querySelector('.hud').style.opacity='1');
await shot('03-lumi');
await p.evaluate(()=>document.querySelector('.hud').style.opacity='0');
await p.evaluate(()=>{game.rival.isle.setTier(game.rival.maxTier,game.rival.maxTier,true);const c=game.rival.isle.group.position;const o=game.rival.shotPose(game.rival.maxTier);game.godCam.setPose({...o,x:c.x,z:c.z,distance:220,pitch:.34},true,game.terrain);game.dayTime=.72;});await shot('04-citadel');
}
await p.evaluate(()=>game.nexus.debug('nexus'));await p.waitForTimeout(1000);
await p.evaluate(()=>game.nexus.debug('ring'));await p.evaluate(()=>{game.advance(3);game.paused=true;});
// Capture-only workaround: Telor's lamp uniform aliases LAMP_LIGHT; night updates
// otherwise multiply the base colour repeatedly. Detach it, preserving the intended RGB.
await p.evaluate(()=>{const u=game.nexus.telor.lampGlow.material.uniforms.uColor;u.value.setRGB(1.6,1.08,.5);u.value=u.value.clone();});
await pose('city',62,.5,1.4,.8);await shot('05-nexus');
for(const t of [14,32,72,142,172,186.5]) {await p.evaluate(t=>{game.nexus.debug('city',t);game.advance(3);},t);await p.waitForTimeout(300);}
await pose('city',260,.85,.5,.82);await shot('06-telor');
await pose('city',150,.65,1.1,.81);await shot('06b-telor');
await p.evaluate(()=>{game.paused=false;game.nexus.debug('end');});
await p.waitForFunction(()=>game.nexus.state().end?.card,null,{timeout:180000});
await p.waitForTimeout(6500);await p.keyboard.press('Escape');
await p.waitForFunction(()=>game.nexus.phase==='done',null,{timeout:60000});
await p.evaluate(()=>{game.advance(1);game.paused=true;game.after.debug('festival','autumn');game.after.debug('celebrate',66);game.advance(1);});
await pose('city',100,.52,1.7,.81);await shot('07-lanterns');
await pose('city',190,.5,.8,.81);await shot('07b-lanterns');
await p.evaluate(()=>{game.after.debug('celebrate',119);game.advance(4);game.seasons.jumpTo('winter',.36);game.after.debug('festival','winter');game.after.debug('celebrate',92);game.paused=false;});
await pose('city',260,.28,1.1,.86);await p.waitForTimeout(3000);await shot('08-midwinter');
await fs.writeFile(`${process.env.OUT_DIR}/report.json`,JSON.stringify({errors,nexus:await p.evaluate(()=>game.nexus.state()),after:await p.evaluate(()=>game.after.state())},null,2));
await browser.close();
