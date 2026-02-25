# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Tailwind CSS

This project now includes Tailwind CSS for utility‑first styling. The configuration files
`tailwind.config.js` and `postcss.config.js` live in the root of the `client` folder and
are already wired into Vite.

> **Note:** the ESLint configuration is pinned to ESLint 9.x to satisfy peer
> dependencies of plugins (`eslint-plugin-react-hooks` etc.). If you update
> eslint yourself, you may need to adjust or reinstall lint-related packages,
> or install with `npm install --legacy-peer-deps` to bypass peer conflicts.
> To install dependencies after pulling from the repository run (ensure you clear any
> existing modules first):

```bash
cd client
rm -rf node_modules package-lock.json yarn.lock
npm install   # or yarn
```

```bash
cd client
npm install
# or yarn
```

The global stylesheet (`src/index.css`) begins with the Tailwind directives
`@tailwind base;`, `@tailwind components;` and `@tailwind utilities;`. Preexisting
custom rules remain below those directives and can be migrated incrementally.

Dark mode is managed by toggling the `dark` class on the `<html>` element (see
`Header.tsx`). Tailwind’s `dark:` modifiers apply appropriately; you can change
the storage key or strategy if you prefer.

Legacy CSS files such as `src/styles/dashboard.css` have been removed – all of the
layout and component styling is now done with Tailwind utility classes. You can
safely delete any other custom styles as you migrate features.

Purge (content) paths are set to include all `.jsx`, `.tsx`, `.js`, and `.ts` files
in `src/` plus the `index.html` template. You can extend the theme or add plugins by
editing `tailwind.config.js`.

Switching existing component CSS to Tailwind classes can be done gradually; there is no
need for an all‑at‑once rewrite.
