export function isPullToRefresh({dx,dy,touches,atTop,nestedCanScroll,zoomed=false}){
  return touches===1 && atTop && !nestedCanScroll && !zoomed && dy>6 && dy>Math.abs(dx);
}

export function installPullToRefreshGuard(doc=document, win=window){
  let origin=null;
  const nestedCanScroll=(target,root)=>{
    for(let el=target; el && el!==root && el!==doc.body; el=el.parentElement){
      if(el.nodeType!==1 || el.scrollTop<=1 || el.scrollHeight<=el.clientHeight)continue;
      if(/^(auto|scroll|overlay)$/.test(win.getComputedStyle(el).overflowY))return true;
    }
    return false;
  };
  doc.addEventListener('touchstart',e=>{
    const t=e.touches[0];
    origin=e.touches.length===1?{x:t.clientX,y:t.clientY,target:e.target}:null;
  },{passive:true});
  doc.addEventListener('touchmove',e=>{
    if(!origin || !e.cancelable)return;
    const t=e.touches[0],root=doc.scrollingElement||doc.documentElement;
    if(e.touches.length!==1 || !t){origin=null;return;}
    if(isPullToRefresh({dx:t.clientX-origin.x,dy:t.clientY-origin.y,touches:e.touches.length,
      atTop:root.scrollTop<=1,nestedCanScroll:nestedCanScroll(origin.target,root),
      zoomed:(win.visualViewport?.scale||1)>1.01}))e.preventDefault();
  },{passive:false});
  for(const event of ['touchend','touchcancel'])doc.addEventListener(event,()=>{origin=null;},{passive:true});
}
