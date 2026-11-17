// Static, ephemeral navigation only. Coordinates are world pixels; tree points
// must be the same trunk centres used by the renderer, not canopy bounds.
export function treeBlockedTiles(trees, tileSize = 30) {
  const tiles = new Set();
  for (const {x, y} of trees) {
    const cx = Math.floor(x / tileSize), cy = Math.floor(y / tileSize);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) tiles.add(`${cx + dx},${cy + dy}`);
  }
  return tiles;
}

export function createNavigation({width = 960, height = 560, tileSize = 30, trees = [], blocked = () => false} = {}) {
  const tiles = treeBlockedTiles(trees, tileSize), cols = Math.ceil(width / tileSize), rows = Math.ceil(height / tileSize);
  // Numeric row index preserves off-board tree cells used by epsilon tests,
  // without allocating coordinate strings in the per-half-pixel hot loop.
  const treeRows = new Map();
  for (const tile of tiles) {const [cx, cy] = tile.split(',').map(Number); if (!treeRows.has(cy)) treeRows.set(cy, new Set()); treeRows.get(cy).add(cx);}
  const hasTrees = tiles.size > 0;
  const treeCell = (cx, cy) => treeRows.get(cy)?.has(cx) || false;
  const finite = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const isWalkable = (x, y) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x < width && y < height && (!hasTrees || !treeCell(Math.floor(x / tileSize), Math.floor(y / tileSize))) && !blocked(x, y);
  const centre = (cx, cy) => ({x: (cx + .5) * tileSize, y: (cy + .5) * tileSize});
  function lineClear(a, b) {
    if (!finite(a) || !finite(b) || !isWalkable(a.x, a.y) || !isWalkable(b.x, b.y)) return false;
    // Include every grid boundary, so even a diagonal touching a blocked tile
    // corner is rejected. Subpixel samples also respect existing static hazards.
    const dx = b.x - a.x, dy = b.y - a.y, steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 2)), times = [0, 1];
    for (let i = 1; i < steps; i++) times.push(i / steps);
    for (const [start, delta, size] of [[a.x, dx, width], [a.y, dy, height]]) {
      if (!delta) continue;
      for (let edge = tileSize; edge < size; edge += tileSize) {const t = (edge - start) / delta; if (t > 0 && t < 1) times.push(t);}
    }
    for (const t of times) {
      const x = a.x + dx * t, y = a.y + dy * t;
      if (!isWalkable(x, y)) return false;
      // Only tree cells need the conservative grid-corner test. Preserve the
      // exact old hazard predicate instead of growing all obstacles arbitrarily.
      if (hasTrees) {
        const cx = Math.floor(x / tileSize), cy = Math.floor(y / tileSize);
        const x0 = Math.floor((x - .00001) / tileSize), x1 = Math.floor((x + .00001) / tileSize);
        const y0 = Math.floor((y - .00001) / tileSize), y1 = Math.floor((y + .00001) / tileSize);
        // isWalkable already rejected the containing cell. Only consult the
        // index for an original epsilon corner that belongs to another cell.
        if ((x0 !== cx || y0 !== cy) && treeCell(x0, y0)) return false;
        if ((x0 !== cx || y1 !== cy) && treeCell(x0, y1)) return false;
        if ((x1 !== cx || y0 !== cy) && treeCell(x1, y0)) return false;
        if ((x1 !== cx || y1 !== cy) && treeCell(x1, y1)) return false;
      }
    }
    return true;
  }
  const nodes = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const p = centre(cx, cy); if (isWalkable(p.x, p.y)) nodes.push({...p, cx, cy, id: `${cx},${cy}`});
  }
  const byId = new Map(nodes.map(n => [n.id, n])), adjacency = new Map();
  for (const n of nodes) {
    const edges = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const p = byId.get(`${n.cx + dx},${n.cy + dy}`); if (!p) continue;
      if (dx && dy && (!byId.has(`${n.cx + dx},${n.cy}`) || !byId.has(`${n.cx},${n.cy + dy}`))) continue;
      if (lineClear(n, p)) edges.push([p, Math.hypot(p.x - n.x, p.y - n.y)]);
    }
    adjacency.set(n.id, edges);
  }
  function findPath(from, to) {
    if (!finite(from) || !finite(to) || !isWalkable(from.x, from.y) || !isWalkable(to.x, to.y)) return null;
    if (lineClear(from, to)) return [{x: to.x, y: to.y}];
    const distances = new Map(), previous = new Map(), open = new Set(), goals = new Set();
    // Local exact-coordinate connectors avoid snapping into a blocked cell or
    // silently changing the requested destination.
    for (const n of nodes) {
      if (Math.hypot(n.x - from.x, n.y - from.y) <= tileSize * 2 && lineClear(from, n)) {distances.set(n.id, Math.hypot(n.x - from.x, n.y - from.y)); open.add(n.id);}
      if (Math.hypot(n.x - to.x, n.y - to.y) <= tileSize * 2 && lineClear(n, to)) goals.add(n.id);
    }
    let end = null;
    while (open.size) {
      let id, best = Infinity;
      for (const candidate of open) {const n = byId.get(candidate), score = distances.get(candidate) + Math.hypot(n.x - to.x, n.y - to.y); if (score < best) {id = candidate; best = score;}}
      open.delete(id);
      if (goals.has(id)) {end = id; break;}
      for (const [n, cost] of adjacency.get(id)) {
        const next = distances.get(id) + cost;
        if (next < (distances.get(n.id) ?? Infinity)) {distances.set(n.id, next); previous.set(n.id, id); open.add(n.id);}
      }
    }
    if (end === null) return null;
    const raw = [{x: to.x, y: to.y}];
    for (let id = end; id; id = previous.get(id)) {const n = byId.get(id); raw.unshift({x: n.x, y: n.y});}
    const result = []; let anchor = from, i = 0;
    while (i < raw.length) {let j = raw.length - 1; while (j > i && !lineClear(anchor, raw[j])) j--; result.push(raw[j]); anchor = raw[j]; i = j + 1;}
    return result;
  }
  return {isWalkable, lineClear, findPath};
}
