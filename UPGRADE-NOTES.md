# PP Tip Run – visual upgrade

This version upgrades the existing PP Tip Run project while preserving its React/Vite structure, store, menus, score/reward logic and browser control API.

## Visual changes
- More detailed PP mascot: white oversized head, glossy black shades, antenna, smile, sporty jacket, articulated limbs, cuffs and running shoes.
- Three-lane railway corridor with steel rails, sleepers, overhead catenary frames, city buildings and clouds.
- Subway train-front hazards with windows, headlights and bright stripe; trains must be avoided by changing lanes.
- Existing coins, jump/slide obstacles, lane movement and reward effects retained.
- Canvas remains capped at DPR 1.5 to reduce mobile GPU load.

## Run locally
1. Extract this ZIP.
2. Open the extracted folder in VS Code.
3. Run `npm install`.
4. Run `npm run dev`.
5. For a production build, run `npm run build`.

The project dependencies are listed in `package.json`. A production build could not be verified in the preparation environment because npm dependency installation timed out; run the build locally after `npm install`.
