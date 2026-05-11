# op-flex

OP Flex storefront — React + Vite app in `wtflex-react/`.

## Live site (GitHub Pages)

After you enable **Settings → Pages → Build and deployment → Source: GitHub Actions**, pushes to `main` build and deploy the app.

Public URL: [https://opflexstore-sketch.github.io/op-flex/](https://opflexstore-sketch.github.io/op-flex/)

## Local development

```bash
cd wtflex-react
npm install
npm run dev
```

Production build (uses `/op-flex/` base path like GitHub Pages):

```bash
cd wtflex-react
npm run build
npm run preview
```

Open the preview URL shown in the terminal (includes `/op-flex/`).
