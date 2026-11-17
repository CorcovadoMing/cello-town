// One fixed same-origin scene bridge. No save, storage, timer or coordinate transfer.
import {MUSIC_ROOM_DOOR,MUSIC_ROOM_APPROACH} from './music-room-art.js?v=exp2';
const {centerX,landing}=MUSIC_ROOM_APPROACH;
export const ROOM_ENTRY=Object.freeze({x:centerX,y:landing.y+8});
export const ROOM_RETURN=Object.freeze({x:centerX,y:landing.y+landing.h-4,facing:'front',walking:false});
export function roomReturnURL(href){
 const url=new URL(href);
 if(url.searchParams.getAll('from').length!==1||url.searchParams.get('from')!=='room')return null;
 url.searchParams.delete('from');return url;
}
export function roomDoorNearby({x,y}){
 return Math.abs(x-centerX)<=52&&y>=ROOM_ENTRY.y-7&&y<=landing.y+landing.h+34;
}
export function roomDoorHit(x,y){
 const dx=Math.abs(x-centerX);
 // Extend around the door and treads, but not into either window or the road.
 return (dx<=38&&y>=MUSIC_ROOM_DOOR.y-4&&y<=MUSIC_ROOM_DOOR.y+MUSIC_ROOM_DOOR.h+10)
  ||(dx<=37&&y>=landing.y-4&&y<=landing.y+landing.h+11);
}
export function createDoorApproach(returning=false){
 let armed=!returning;
 return {
  disarm(){armed=false;},
  step(before,after,northIntent){
   // Returning/Back cannot immediately re-enter. Leave the small landing first.
   if(Math.abs(after.x-centerX)>32||after.y>landing.y+landing.h+16){armed=true;return false;}
   if(armed&&northIntent&&Math.abs(after.x-centerX)<=16&&before.y>ROOM_ENTRY.y&&after.y<=ROOM_ENTRY.y){armed=false;return true;}
   return false;
  }
 };
}
