// Moments that should only play once per player (Atlas taking form, the recognition). Stored in this
// browser; add ?replay=1 to the URL to see them again.
const KEY = 'atlas.seen.v1';
const replay = new URLSearchParams(location.search).has('replay');
function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
export function seen(id) { return !replay && !!read()[id]; }
export function markSeen(id) { try { const s = read(); s[id] = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
