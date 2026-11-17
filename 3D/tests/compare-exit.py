import json, os, statistics as s, sys
from pathlib import Path
root=Path(sys.argv[1])
sums={}
for build in ("baseline","candidate"):
 rows=[]
 for i in range(1,4):
  path=root / f"{build}-{i}" / "direct3D-cold-return-timing.json"
  d=json.loads(path.read_text())
  m=d["initialization"]
  assert d["town"]["firstDraw"] > m["entryStart"]
  assert d["exitCommand"]["event"] == "door-command"
  assert d["version"] == ("20261117-050" if build=="baseline" else "20261117-051")
  rows.append({"first_canvas":d["town"]["firstDraw"],"startup":d["town"]["evaluated"]-m["entryStart"],"graph_bound":m["rainSystemStart"]-m["navigationStart"],"from_html":d["navigation"]["responseEnd"],"assets":len(d["resources"]),"zero_transfer":sum(x["transferSize"]==0 for x in d["resources"])})
 sums[build]={"runs":rows,"median":{k:round(s.median(r[k] for r in rows),2) for k in rows[0]}}
(root / "summary.json").write_text(json.dumps(sums,indent=2)+"\n")
print(json.dumps(sums,indent=2))
