# PP Tip Run

A lightweight 3D endless-runner built with React, TypeScript, Vite, Three.js, React Three Fiber, Drei, and Zustand. The mascot and environment are procedural; no external game assets are required. PP tip notifications are fictional in-game rewards only—there are no payments or wallet connections.

## Requirements
- Node.js 20 or newer
- npm

## Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The production site is written to `dist/`.

## Controls
- **A / Left Arrow:** move left
- **D / Right Arrow:** move right
- **W / Up Arrow / Space:** jump
- **S / Down Arrow:** slide
- **Escape:** pause or resume
- **Enter:** start or restart from the relevant screen
- **Mobile:** swipe in a direction or use the on-screen buttons

Collect 50 coins in a run to trigger a fictional “YOU JUST GOT TIPPED BY PP!” celebration. A collision ends the run with “YOU LOST YOUR TIP!”. Best score, best distance, and sound preference are stored locally when browser storage is available.

## Deploy

### Vercel
1. Push the project to a Git repository.
2. Import the repository in Vercel.
3. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Deploy.

### Netlify
1. Push the project to a Git repository and import it in Netlify, or upload the built `dist/` folder.
2. Set **Build command** to `npm run build` and **Publish directory** to `dist`.

## Notes
- The mascot is a procedural 3D approximation. If a supplied reference image is available later, use it to refine proportions and details.
- Audio uses short Web Audio tones, avoiding third-party copyrighted sounds. Browser audio policies may require user interaction.
- The game uses a bounded pool of world objects and delta-time-based movement. It has not been tested on every physical mobile device; run the production build and verify on target devices before public release.
