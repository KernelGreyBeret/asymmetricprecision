# Sprint 30 — Launch Readiness 2

**A system is ready when it can explain its own readiness.**

Sprint 30 is the second launch gate for AP v2. It does not add a new public content surface. It gives AP a static and runtime readiness layer so the site can be checked before it becomes the production standard.

## Drop-in files

- `assets/system/ap-launch-readiness.css`
- `assets/system/ap-launch-readiness.js`
- `assets/system/ap-system.css`
- `assets/system/ap-system.js`
- `tools/ap-preflight-v2.js`
- `docs/ap-v2/AP_LAUNCH_READINESS_2.md`
- `docs/ap-v2/AP_PRELAUNCH_AUDIT.md`
- `launch/LAUNCH_GATE_v2.md`

## Run the static audit

From the repository root:

```bash
node tools/ap-preflight-v2.js
```

The tool writes:

```text
launch/ap-preflight-report.json
```

## Runtime audit

Open the browser console on any page and inspect:

```js
window.APSystem.launchReadiness.report
```

Or rerun:

```js
window.APSystem.launchReadiness.rerun()
```
