# Cello procedural model 002: isolated handoff

## Integrate
Use `cello-replacement.js.txt` to replace the contiguous original `// Cello resting in left corner.` block up to, but not including, `// Plant and reading stool`. Existing global `T` and `scene` are its only dependencies. No new runtime module or deployment allowlist changes. Original transform remains (-2.27, .2, -1.4), z rotation -.12. Original/candidate app files have not been modified by this agent.

Original source verified with finger_audit: CorcovadoMing/cello-town experimental/3d, 3D/app.js Git blob 699aef61eed00824f7fdff1198be9364fdc373b7 (SHA256 6c2f3a7836c3a35c61ea791070762ffcbe088c5fc812cc8dd13aa089d9b72b7b).
Final snippet SHA256: 70490c54e0a18f9abee99de6d7d67c0c7150a0d2e49a40bd2454c74ff1830541.

## Implemented
Sculpted upper/lower bouts, narrow waist and four corners; rib depth; arched top with two genuine f-hole cutouts, inset dark openings and notches; continuous edge/purfling geometry; neck heel, tapered fingerboard, nut, scroll, pegbox, four alternating pegs; two-foot/kidney bridge, four strings and fine tuners, tapered tailpiece/tailgut, endpin; cambered bow with hair, frog, ferrule, eye, screw and tip. Warm original palette, no texture/request/random/animation or new dependency. Static geometry merged by eight colors.

## Verified
- Syntax checks: standalone module and isolated original-app insertion PASS.
- `node --test model.test.js`: 3/3 PASS. Finite positions/normals, deterministic repeated geometry; 4 pegs, 4 strings with three segments each; component inventory/envelope; paired raycasts confirm BOTH mirrored f apertures actually open at three separated heights.
- Geometry: 6,846 triangles in 8 material batches (not a measured renderer frame draw-call count). Geometry+normal SHA256 1f46d28f9bda73c365d121f23694dde398e23028a749be004c240ee14e88ec4a.
- Official source SVGRenderer used in Node with minimal DOM, front and angled closeup images rendered and inspected (`front.png`, `angle.png`). Both f holes read dark/equally and rim substantially continuous. Top cap tessellation limits painter-sorting artifacts without renderOrder/depth override. Tiny SVG seams and occasional front/rear ordering artifacts remain, especially at steep angles. These are NOT proof of WebGL appearance.
- The earlier asymmetric f-hole bug was real (mirrored winding and oversized bevel). Fixed by explicit CCW hole winding, no bevel on top aperture edges and inward positioning. Regression raycast test added. Earlier images/snippet superseded.

## Not yet verified
No integrated room-scale view or actual WebGL/mobile-GPU performance claim. Cloud Chromium launch is blocked by process socket restrictions (one normal and one approved retry both failed); not retried further. Parent/practice_wide should run integrated near/far room view and physical/Mac WebGL QA. Static triangle budget is a design cap, not performance evidence. Camera remains the application's existing camera. No publish performed.
