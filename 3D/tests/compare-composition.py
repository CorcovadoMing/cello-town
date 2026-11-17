import json,sys,pathlib,math
old,new=map(pathlib.Path,sys.argv[1:3]);rows=[]
for name in ['native-narrow065','native-tablet115','attachment-aspect1582','reference-wide2065','reference-wide225']:
 a=json.load(open(old/(name+'.json')))['composition'];b=json.load(open(new/(name+'.json')))['composition']
 assert a['stage']==b['stage'],(name,'stage size mismatch',a['stage'],b['stage'])
 if name.startswith('native'):
  for k in ['position','quaternion','zoom','fov','lens']:
   aa=a['camera'][k];bb=b['camera'][k]
   if not isinstance(aa,list):aa=[aa];bb=[bb]
   assert max(abs(x-y) for x,y in zip(aa,bb))<1e-6,(name,k,'narrow camera changed')
 row={'case':name,'aspect':a['stage']['aspect']}
 for part in ['torso','celloBody']:
  row[part]={'oldCenterX':a[part]['centerX'],'newCenterX':b[part]['centerX'],'shiftX':b[part]['centerX']-a[part]['centerX'],'oldWidth':a[part]['width'],'newWidth':b[part]['width'],'scaleRatio':b[part]['width']/a[part]['width'],'newVisibleFraction':b[part]['visibleFraction']}
 rows.append(row)
print(json.dumps({'narrowExact':True,'comparison':rows,'note':'Normalized metrics exclude head, hats and arms from torso; cello is ribs/back and top plate. Camera metrics are exact; small live torso motion can affect geometric deltas. Wide framing remains a screenshot-review decision, not a fabricated universal numeric target.'},indent=2))
