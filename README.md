# 弓弦小鎮 · Cello Town

A small, single-player practice room for cello learners. The first playable version focuses on one octave of **D major: D3 E3 F♯3 G3 A3 B3 C♯4 D4**. Warm illustrated room, direct touch-friendly hotspots, and a persistent little flower garden. No avatar navigation, login, leaderboard, microphone access, or recording.

## Run

Requires any static HTTP server. For example:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. ES modules require HTTP rather than opening `index.html` as a local file. No install, build, CDN, external fonts, analytics, or runtime dependencies are needed. Deploy the directory unchanged to any static hosting service.

## Three real interactions

1. **Listen:** Play a synthesized D-major example, tuned to A4 = 440 Hz. The confirmation unlocks when all eight notes finish. These are reference tones, not cello recordings.
2. **Follow a beat:** Adjustable 40–160 BPM metronome with a four-beat visual pulse and accented first beat. User confirms they actually practiced.
3. **Try without cues:** Note names are hidden, can be revealed whenever helpful, and the metronome remains available. User confirms the attempt; the app does not claim pitch accuracy or mastery.

Completing all three distinct tasks plants one flower and snapshots the current date, BPM, and practice note. Repeated confirmation cannot generate duplicate flowers. Replay resets only the current checklist, preserving all completed history, flowers, settings, and the current note. Partial checklist reset asks for confirmation. There is no destructive history-delete control. The history panel displays the latest ten sessions; older sessions remain stored.

## Persistence and privacy

State is versioned in `localStorage` under `cello-town-v1`. Notes are plain text, capped at 2,000 characters. Progress is local to this browser and origin; there is no cross-device sync or backend. Clearing browser/site data removes progress. Storage failures produce a visible warning. Unknown data versions fall back to a fresh state. Audio starts only after an explicit tap/click and stops when the page is hidden. This repository is a standalone MVP, not a live integration with the existing daily-key-practice website. Scale reference and metronome functionality are implemented locally; no existing user records are copied.

## Accessibility and layout

Semantic buttons/labels, keyboard activation, clear focus rings, live status messages, large touch controls, reduced-motion support, responsive single-column phone/tablet layout, and descriptive room illustration. Room actions are duplicated as conventional mission buttons, so the illustration is not required to navigate. Hidden cue text is also hidden from screen readers.

## Tests

```sh
npm test
node --check app.js
```

Uses Node's built-in test runner, no packages. Tests cover D-major notes, distinct mission completion, duplicate flower prevention, non-destructive replay, note snapshot, storage normalization, immutability, and serialization. Mock-DOM integration tests also verify separate selection/completion controls, gesture-triggered audio, demo completion unlock, background audio stop, and storage-failure fallback. These tests do **not** establish real-device audio compatibility or musical assessment accuracy.

### Manual acceptance checks

- On a phone/iPad, tap each room hotspot and each mission button; keyboard Tab/Enter reaches equivalent controls.
- Play the demo to the end. Confirm that all eight pitches highlight in turn and the completion button unlocks. Interrupt early: it should not unlock on the first attempt.
- Start/stop metronome, adjust BPM and volume. Switch missions or background the page: sound stops, no duplicate scheduler continues.
- Complete three tasks: exactly one flower. Reload: settings, note, checklist, flower and history remain.
- Replay: completed history and flower remain. Finish another full session: exactly one additional flower.
- Hide/reveal memory cues. Confirm this is self-reported practice, not an automated performance grade.
- Check narrow portrait layout, reduced motion, keyboard focus, and browser storage-disabled warning.

## Scope and next steps

This first stop intentionally contains only D major. It demonstrates the practice → reflection → garden loop. Future scope may include 24 keys, shared progress with the existing practice site, teacher-created exercises, and opt-in class challenges. These are **not implemented**. No ranking based on microphone-open time, tempo, or pitch detector output is included.

## GitHub Pages (when ready to publish)

A workflow is included at `.github/workflows/pages.yml`. After creating a repository and uploading these files to `main`, choose **Settings → Pages → Source: GitHub Actions**. Pushing to `main` or manually running the workflow runs tests, packages only `index.html`, `styles.css`, `app.js`, and `model.js`, then publishes them. The workflow does not publish tests or notes. No GitHub repository, Pages settings, or publication was performed as part of preparing this source. Be aware that the configured workflow publishes on subsequent main-branch pushes once Pages is enabled.

A separately supplied `cello-town-offline.html` bundles the same application into one file without module imports. Open it directly for an offline preview. Browser handling of local-file storage varies; a visible warning appears if saving fails. HTTP hosting is recommended for durable origin-scoped progress. Offline and hosted copies do not share progress.
