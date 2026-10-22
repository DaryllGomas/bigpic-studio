// Pure, defensive save state. Delivery spends only the current stage's materials.
export const HOME_KEY = 'atlas.home.v1';
export const STAGES = [{kind:'stone', count:6}, {kind:'timber', count:8}, {kind:'reed', count:10}];
const count = n => Number.isFinite(n) ? Math.max(0, Math.min(999, Math.floor(n))) : 0;
export class Homestead {
  constructor(storage = null) {
    this.storage = storage; this.stage = 0; this.carried = {stone:0,timber:0,reed:0};
    try { const d = JSON.parse(storage?.getItem(HOME_KEY)); if(d?.v === 1) { this.stage = Number.isInteger(d.stage) ? Math.max(0,Math.min(3,d.stage)) : 0; for(const k in this.carried) this.carried[k] = count(d.carried?.[k]); } } catch {}
  }
  get snapshot() { return {v:1, stage:this.stage, carried:{...this.carried}}; }
  get need() { return STAGES[this.stage] ?? null; }
  get ready() { return !!this.need && this.carried[this.need.kind] >= this.need.count; }
  save() { try { this.storage?.setItem(HOME_KEY, JSON.stringify(this.snapshot)); } catch {} }
  gather(kind, n=1) { if(!Object.hasOwn(this.carried,kind) || !Number.isFinite(n) || n <= 0) return false; this.carried[kind] = count(this.carried[kind]+Math.floor(n)); this.save(); return true; }
  deliver() { if(!this.ready) return false; this.carried[this.need.kind]-=this.need.count; this.stage++; this.save(); return true; }
  debugGive(kind,n) { return this.gather(kind,n); }
  debugStage(n) { if(!Number.isInteger(n)||n<0||n>3)return false; this.stage=n; this.save(); return true; }
}
