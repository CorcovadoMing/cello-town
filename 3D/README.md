# Cello Town · 3D dressing room prototype001
Independent fixed-angle Three.js scene, procedural chibi avatar, face/hair/skin/clothes/headwear/accessory presets, keyboard/touch movement and local appearance persistence.

No imported 2D game state. Save key `cello-town-3d-avatar-v1`; no audio/microphone/network data uploads. Three.js is served locally at deployment, not from a CDN.

## Reproducible deployment
From the repository 3D directory:
```
cd 3D
npm ci --ignore-scripts --no-audit --no-fund
node scripts/vendor-three.mjs
node --test tests/*.test.js
```
Then copy `3D/` to Pages artifact `3D/`. Keep existing2D artifact untouched. Do not upload `node_modules/`, package tarball, or extracted package tree.
Pinned dependency `three@0.160.1`, MIT. Lock integrity from npm registry in package-lock.json. Vendor script copies build/three.module.js, examples/jsm/renderers/SVGRenderer.js and Projector.js, LICENSE. The example modules only receive relative import-path rewrites. Primary renderer WebGL; unsupported browsers use labeled official SVGRenderer same3D geometry, lower fidelity and10FPS. SVG does not support GPU shadows and has painter-depth limitations.

No collision/navigation beyond bounded room floor in this prototype; this is not the full town. Face changes are presets, not free mesh sculpting. Reduced motion removes ambient idle sway; direct walking remains responsive. Window-hidden rendering and keyboard controls pause/reset.
