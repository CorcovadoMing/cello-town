# Private 006 wall, sleeping-cat and sky follow-up

Baseline: a65d1828325b306978745df31dc91e7b474499ac (unpublished 006). Public release remains 005 until separately approved.

- Wall bottom extends into plinth; continuous skirting overlaps wall/floor and thin contact trim joins the seam. Original geometry already intersected floor: the reported floating appearance was primarily the bright seam and shading, not a literal gap.
- Wall-only material retains 25% of dark shading in linear light. This is not a promise of exactly 75% reduction in display RGB. Sun direction/intensity, floor materials, shadows on other objects remain unchanged; wall casting/receiving remains enabled.
- Actual WebGL front samples: wall RGB154/170/132 →187/200/168 at two unobstructed locations. Two floor samples remain212/190/143 before/after. Front and diagonal views visually checked.
- Sleeping upper body breath raises/scales the upper silhouette, retaining its lower contour. Paws/cushion stay fixed. Unequal quiet intervals separate brief tail-tip flicks; occasional small ear twitch. Reduced motion resets all to rest.
- Cloud drifts ±.10 units slowly inside the aperture. Sun remains fixed and is physically in front of cloud (.05 vs .036 local depth); mullions remain ahead. Neither sky layer casts shadows. Reduced motion uses centered cloud.
- 31 isolated tests pass, including deterministic anchor/flick samples, reduced motion, wall material isolation and bounded cloud motion. Actual timed WebGL samples confirm pawY=.143, cushionY=.066 throughout, varying upper-bodyY and tail angle.
- 390/820/1280 actual WebGL room/furniture/cello mock lifecycle passed after wall/cat change; final cloud addition repeated390 plus SVG820 fallback. No actual tablet device claim.
- Appearance storage, task data, furniture/camera interactions, and all 2D source untouched.
