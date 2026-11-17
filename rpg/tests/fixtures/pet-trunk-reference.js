// Frozen original inclusive tree-root collision predicate.
export function petTrunkBlocked(trees,x,y){return trees.some(([tx,ty,scale])=>x>=tx-9*scale-14&&x<=tx+10*scale+14&&y>=ty+34*scale-7&&y<=ty+46*scale+7);}
