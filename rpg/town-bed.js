// One cultivated flower bed. The geometry is shared by the soil art and
// rain masks; plant rewards still use the established six slot coordinates.
export const GARDEN_SOIL=Object.freeze([
 [746,422],[756,416],[777,413],[802,412],[828,412],[852,411],[877,413],[893,417],
 [901,424],[904,439],[904,458],[904,479],[898,493],[887,501],[868,504],
 [843,504],[820,505],[796,504],[772,504],[755,500],[744,493],[739,484],
 [737,468],[738,446],[740,430]
].map(Object.freeze));
export const GARDEN_ROWS=Object.freeze([
 {center:440,start:752,end:892,spread:15,seed:2},
 {center:482,start:749,end:891,spread:14,seed:7}
].map(Object.freeze));
// Very shallow ridges: close inspection reveals cultivation, not platforms.
export const ROW_SECTION=Object.freeze([
 [-1,0,.89],[-.76,.27,.84],[-.42,.73,1.03],[-.09,1,1.10],[.31,.78,1.02],[.74,.31,.92],[1,0,.86]
].map(Object.freeze));
export function rowPoint(row,t,offset,lift){
 const x=row.start+(row.end-row.start)*t;
 const soft=Math.min(1,t*8,(1-t)*8);
 const z=row.center+.72*Math.sin(t*4.4+row.seed)+offset*(.68+.32*soft)*row.spread;
 return [x,1.21+lift*soft*(.34+.025*Math.sin(x*.21+row.seed)),z];
}
