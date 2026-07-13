# visual-component-tools

[![npm](https://img.shields.io/npm/v/@acrodata/visual-component-tools.svg)](https://www.npmjs.com/package/@acrodata/visual-component-tools)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/acrodata/visual-component-tools/blob/main/LICENSE)

CLI tool for scaffolding, developing, and packaging Angular-based visual components with Module Federation support.

## Installation

```bash
npm install -g @acrodata/visual-component-tools
```

## Quick Start

### Single Project

Create a standalone project with components at the root level:

```bash
adviz new my-components
cd my-components
adviz generate my-chart
adviz start my-components
```

### Workspace (Multi-Project)

Create an empty workspace, then add multiple projects:

```bash
adviz new my-workspace --workspace
cd my-workspace
adviz create viz-basic
adviz create viz-echarts
adviz generate my-chart --project=viz-basic
adviz start viz-basic
```

## CLI Commands

### `adviz new <name>`

Bootstrap a new project or workspace from scratch.

```bash
adviz new <name> [options]
```

| Option | Description |
|---|---|
| `--workspace` | Create an empty workspace (no initial project) |
| `--skip-install` | Skip running `npm install` after scaffolding |

**Single-project mode** (default) creates a complete project:

```
my-project/
├── package.json
├── angular.json          # single project, root: ""
├── tsconfig.json
├── tsconfig.app.json
└── src/
    ├── index.html
    └── main.ts
```

**Workspace mode** (`--workspace`) creates an empty shell:

```
my-workspace/
├── package.json
├── angular.json          # newProjectRoot: "projects", projects: {}
├── tsconfig.json
└── projects/             # use `adviz create` to add
```

---

### `adviz create <name>`

Add a new sub-project to an existing workspace.

```bash
cd my-workspace
adviz create <name>
```

Creates the project under `projects/<name>/` and registers it in `angular.json`.

```
projects/<name>/
├── package.json
├── tsconfig.app.json
└── src/
    ├── index.html
    └── main.ts
```

---

### `adviz generate <name>`

Generate a new visual component inside a project.

```bash
adviz generate <name> [--project <project>]
# or shorthand:
adviz g <name> [--project <project>]
```

| Option | Description |
|---|---|
| `--project <project>` | Target project name (auto-detected in single-project mode) |

Creates the component under `src/<name>/`:

```
src/<name>/
├── index.ts         # extends VisualComponent
├── index.html       # template
├── index.scss       # styles
├── configs.ts       # VisualConfigs definition
└── manifest.json    # component metadata
```

---

### `adviz start <name>`

Start the dev server for a project.

```bash
adviz start <name> [options]
```

| Option | Description |
|---|---|
| `-p, --port <port>` | Set the port to listen on |
| `-h, --host <host>` | Set the host to listen on |

The default port is auto-detected from the project's `package.json` `server` field.

---

### `adviz package <name>`

Build and package a project into a `.zip` file.

```bash
adviz package <name>
```

Runs `ng build` and creates a zip archive at `dist/<name>.zip`, ready for deployment.

---

### `adviz publish <name>`

Publish a packaged project (coming soon).

```bash
adviz publish <name>
```

## Workflow Summary

```
adviz new          →  scaffold a project or workspace
  adviz create     →  add sub-projects (workspace mode)
  adviz generate   →  add components to a project (alias: adviz g)
  adviz start      →  run dev server
  adviz package    →  build & zip for distribution
```

## License

MIT
