# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Formatting and pre-commit checks

Install dependencies with `bun install`; the `prepare` script installs Husky hooks.

- `bun run format` formats the project and sorts Tailwind classes.
- `bun run format:check` checks formatting without changing files.
- `bun run lint` runs Oxlint across the project.
- `bun run lint:staged` checks files currently staged in Git.

The pre-commit hook runs lint-staged using `.lintstagedrc`. Staged JavaScript and TypeScript files run through Oxlint with safe fixes, then Prettier. Supported styles, documents, and configuration files run through Prettier. Prettier uses `src/index.css` for Tailwind v4 and sorts classes in `cn` and `cva` calls. Builds remain a separate check: `bun run build`.
