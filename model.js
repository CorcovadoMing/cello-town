export const MISSIONS = ['listen', 'rhythm', 'memory'];
export const NOTES = ['D3', 'E3', 'F♯3', 'G3', 'A3', 'B3', 'C♯4', 'D4'];
export function fresh() { return { version: 1, bpm: 72, volume: 0.45, note: '', current: [], history: [] }; }
export function normalize(input) {
  const s = fresh();
  if (!input || input.version !== 1) return s;
  s.bpm = Math.min(160, Math.max(40, Number(input.bpm) || 72));
  s.volume = Number.isFinite(input.volume) ? Math.min(1, Math.max(0, input.volume)) : .45;
  s.note = typeof input.note === 'string' ? input.note.slice(0, 2000) : '';
  s.current = [...new Set((Array.isArray(input.current) ? input.current : []).filter(x => MISSIONS.includes(x)))];
  s.history = (Array.isArray(input.history) ? input.history : []).filter(x => x && typeof x.id === 'string' && typeof x.at === 'string' && Number.isFinite(x.bpm));
  return s;
}
export function complete(state, mission, at = new Date().toISOString()) {
  if (!MISSIONS.includes(mission) || state.current.includes(mission)) return state;
  const next = { ...state, current: [...state.current, mission], history: [...state.history] };
  if (next.current.length === 3) next.history.push({ id: at, at, bpm: next.bpm, note: next.note });
  return next;
}
export function replay(state) { return { ...state, current: [] }; }
