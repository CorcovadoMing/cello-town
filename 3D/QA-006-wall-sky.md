# Private 006: clarified floor shadow, sleeping cat, sky and mirror

The earlier wall-luminance interpretation in420bb746 was superseded by Ming's clarification. Public release remains005 pending separate approval.

## Actual floor-shadow correction
- Controlled same-camera per-mesh toggles proved the rectangular floor patch is cast by rearWall: rear-off removes it, side-off does not. Window/furniture shadows remain.
- Removed wall-only luminance shader. Original wall colors return. Both rendered wall bottoms are exactlyy=.015, matching finished floor top, not extending through it.
- Full rear wall no longer casts its tall rectangle. A shadow-only .775high proxy at the same foot produces a short real floor shadow; original height3.1. Material colorWrite/depthWrite false, no raycast, DoubleSide shadow. SVG omits proxy.
- Shadow bias−.00005, normalBias.002; skirting starts atfloor and covers wall joint. Sun location/intensity and floor materials unchanged.
- Actual isolated WebGL512² floor measurement: fullheight56616 darkpixels, shortheight15261, ratio26.96% including filtered edges. Geometric projected depth3.40→.85 (25%). The effect is attached to wall foot, not a translated synthetic rectangle. Front/diagonal renders inspected.

## Preserved/added decoration
- Cat intermittent unequal tail-flick windows, occasional ear twitch, subtle upper-body breathing. Paws/cushion unchanged; reduced motion resets rest.
- Bounded slow cloud drift±.10 within arch; fixed sun in front atz.05 versuscloud.036, both shadow-free. Reduced motion static.
- Mirror is explicitly a hazy color suggestion, not a true reflection: one128² CanvasTexture quad with three broad blurred color masses. Painted only on appearance rebuild; frame update onlyproximityopacity and bounded lateraloffset. No secondscene/render target/readback. SVG retains plain glass.
- Same private Chromium/SwiftShader baseline→mirror:390 calls188→189, triangles69402→69404, medianframe39.8→39.6ms;820 median46.8→46.8ms. These small samples show no material regression, not a physical-phone heat/battery guarantee.

## QA scope
- 32Node regressions.
- Full390/820/1280 WebGL lifecycle after floor-shadow fix;390 repeated after mirror; SVG820 fallback checked. Actual wardrobe/vanity/cello taps, arrival-only mock, focus/close and camera restoration.
- No product data, storage schema,2D source, formal deployment or remote changes.
