# dsh-client-rtl

**Right-to-left conversation layout for [DeepSeek Harness][dsh] — Persian, Arabic and Hebrew inside a left-to-right application.**

**English** | [فارسی](README.fa.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform: DeepSeek Harness](https://img.shields.io/badge/platform-DeepSeek%20Harness-black)](https://github.com/deepseek-ai)
[![Plugin: client](https://img.shields.io/badge/plugin-client%20side-a855f7)](#how-it-works)

---

## The problem

DeepSeek Harness ships an LTR-only interface. There is no RTL mode, no `direction`
setting, and its locale plugin carries no text-direction field. If you write Persian,
Arabic or Hebrew, the *characters* run right-to-left because Unicode bidi says so — but
everything around them does not:

- paragraphs start at the left edge and end ragged on the right;
- your own message bubbles sit on the wrong side;
- list markers, quotes and table cells are anchored left;
- mixed Persian/English lines look like they have been shuffled.

The result is the familiar "my text is inside-out" feeling, even though the text itself is
correct.

## What this plugin does

It flips **only the conversation surface** to right-to-left:

| Element | Direction |
|---|---|
| Message prose, headings, lists, tables, quotes | **RTL** — start at the right edge |
| Your message bubble | mirrors with the pane, stays inside it |
| Code blocks, inline code, paths, key names | **LTR** — deliberately pinned |
| Sidebar, panels, settings, composer | untouched (LTR) |

Code is never mirrored. A shell command, a file path or a diff is not Persian text, and
flipping it is how "RTL support" usually becomes an unreadable mess.

> The plugin changes layout only. It sends no network requests, imports no Harness
> package, reads no files, and adds exactly one `<style>` element to the document.

## Install

### Requirements

- DeepSeek Harness desktop or web build with client plugins (`dsh.client`) enabled — any
  release that serves bundles from `/plugins`.
- A writable profile directory: `$DSH_HOME/profiles/<profile>` (default
  `~/.dsh/profiles/desktop` on Windows, `~/.dsh/profiles/web` for the web profile).

### Option A — manual (works everywhere)

1. Copy this package into the profile's `node_modules`:

   ```
   ~/.dsh/profiles/desktop/node_modules/dsh-client-rtl/
   ├── package.json
   ├── index.js
   └── client.js
   ```

   On Windows, from a checkout of this repository:

   ```powershell
   $dest = "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-client-rtl"
   New-Item -ItemType Directory -Force $dest | Out-Null
   Copy-Item package.json, index.js, client.js $dest -Force
   ```

2. Register the entry in the profile patch layer, `~/.dsh/profiles/desktop/cordis.patch.yml`:

   ```yaml
   - insert:
       - id: rtl
         name: "dsh-client-rtl"
   ```

   The `insert:` wrapper is required. A bare `- id: … / name: …` row is an *override* of
   an existing plugin id, and the Harness silently reports `entry "rtl" not found`.

3. Restart the application (or reload the window with `Ctrl+R`).

### Option B — scripted (Windows)

```powershell
.\scripts\install.ps1                 # copies the package and patches the profile
.\scripts\install.ps1 -WhatIfCopy     # show the plan, change nothing
```

The script backs up `cordis.patch.yml` to `cordis.patch.yml.bak` before editing and is
idempotent: running it twice does not duplicate the entry.

### Uninstall

Remove the `- insert:` block from `cordis.patch.yml` and restart. Deleting the package
directory is optional — an unreferenced package is never loaded.

## Verify it loaded

1. Open a session with at least one assistant answer.
2. Persian text should now start at the right edge, and `code` spans should stay
   left-to-right.
3. If nothing changed, see [docs/troubleshooting.md](docs/troubleshooting.md). The most
   common cause is the `insert:` indentation.

## How it works

```
┌──────────────────┐   boot    ┌────────────────────────────┐
│ Harness desktop  │ ────────► │ Loader composes the        │
│ app (Electron)   │           │ profile tree + patch layers│
└──────────────────┘           └─────────────┬──────────────┘
                                             │ scans `dsh.client`
                                             ▼
                               ┌────────────────────────────┐
                               │ dsh-client-modules serves  │
                               │ /plugins/dsh-client-rtl.js │
                               └─────────────┬──────────────┘
                                             │ <script> in renderer
                                             ▼
                               ┌────────────────────────────┐
                               │ window.__ModuleLoader__    │
                               │ .load({ id, factory })     │
                               └─────────────┬──────────────┘
                                             │ factory() → apply(ctx)
                                             ▼
                    ┌───────────────────────────────────────────┐
                    │ 1. inject one <style>                     │
                    │ 2. find the scroll container of the       │
                    │    transcript / first message row         │
                    │ 3. mark it  data-dsh-rtl-pane             │
                    │ 4. MutationObserver → re-mark on rerender │
                    └───────────────────────────────────────────┘
```

Full component and lifecycle detail: [docs/architecture.md](docs/architecture.md).
Selector strategy and the reasoning behind runtime detection:
[docs/how-it-works.md](docs/how-it-works.md).

**Why runtime detection instead of plain selectors?** The Harness bundle emits hashed
CSS modules (`LOmM4q_userRow`, `xeixwq_table`), and those hashes change between builds.
A stylesheet keyed to `[class*="_transcript"]` alone also catches unrelated modules — in
one build `contentColumn` turned out to be a cell of the Trajectory table. Locating the
scroll container at runtime and marking it is stable across builds and tolerant of
missing anchors.

## Compatibility

| | |
|---|---|
| Tested against | DeepSeek Harness `0.2.1-rc.5`, Windows 11 24H2–26H1, Chromium 156 |
| Should work on | any build whose client bundle keeps the `_transcript` / `_userRow` class suffixes |
| Fails safely | if the anchors disappear, the plugin marks nothing and the UI stays LTR — it never throws into the host |
| Profiles | `desktop` (verified), `web`; `tui` is out of scope — there is no DOM |

## Project layout

```
dsh-client-rtl/
├── package.json          # dsh.client declaration + exports
├── index.js              # host half: an intentional no-op
├── client.js             # browser half: marker + stylesheet
├── docs/
│   ├── architecture.md   # components, boot sequence, lifecycle, failure modes
│   ├── how-it-works.md   # selector strategy, why markers, what is pinned LTR
│   └── troubleshooting.md
├── scripts/
│   └── install.ps1       # idempotent installer for Windows
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

## Other languages

- [فارسی — Persian](README.fa.md)

## Contributing

Issues and pull requests are welcome — especially anchor names from builds where the
plugin stopped matching. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Meysam Mirzapour

[dsh]: https://github.com/deepseek-ai
