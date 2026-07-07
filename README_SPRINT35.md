Sprint 35 — Atlas Blueprint Export
A system-wide map should be publishable, not just explorable.

What this sprint does
- Adds a new Atlas workspace control: Open Full Blueprint.
- Adds PNG export alongside the existing SVG export.
- Rebuilds Atlas image/SVG export into a publication-style blueprint sheet.
- Reserves a protected title masthead so the title never gets buried behind nodes.
- Adds a copyright footer to generated exports.
- Adds connection statements below generated diagrams so the diagram travels with its meaning.
- Uses a clustered full-system layout for the full blueprint export to reduce overlap and make the entire Atlas readable at once.

Files included
- assets/system/ap-atlas.js
- docs/ap-v2/AP_ATLAS_BLUEPRINT_EXPORT.md
- README_SPRINT35.md

How to apply
1. Open the repo root.
2. Replace the existing file with the included file:
   - assets/system/ap-atlas.js
3. Copy the documentation file if you want to keep sprint notes in-repo.
4. Commit and deploy.

What to test
1. Open the Atlas page.
2. Confirm the controls now include:
   - Open Full Blueprint
   - Download PNG
3. Select a focused node and click Open Map Image.
   - The title should render in a protected header area.
   - Connection statements should appear below the diagram.
   - The copyright footer should appear at the bottom.
4. Click Download SVG and Download PNG.
   - Both should download cleanly.
5. Click Open Full Blueprint.
   - A full-system blueprint sheet should open in a new tab.
   - The Atlas should be arranged in a non-overlapping clustered system view.
   - Buttons inside that sheet should allow SVG and PNG download.

Notes
- The full-system blueprint uses a dedicated cluster-based export layout instead of the interactive projection layout.
- The interactive Atlas remains the exploration surface.
- The full blueprint is the publication/export surface.
