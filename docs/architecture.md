# Architecture

`dsh-client-rtl` is a **client plugin**: a package that the DeepSeek Harness Loader
mounts on both sides of the app, with the browser half doing all of the work.

## Components

| File | Side | Responsibility | Failure impact |
|---|---|---|---|
| `package.json` | both | Declares `dsh.client` and the `./client` export so the module system can serve a browser bundle | package is ignored; UI stays LTR |
| `index.js` | host (Node) | Intentional no-op. Exists so the Loader can compose the entry | none |
| `client.js` | renderer | Injects one stylesheet, marks containers, re-marks after re-renders | no marking; UI stays LTR |

The plugin is deliberately split this way: everything that touches the DOM lives in the
browser half, and the host half holds no state, no services and no configuration. That
keeping the host half inert is what makes the plugin safe to mount — a throwing host
plugin can take the app down, a browser plugin can only fail to style.

## Boot sequence

```
 Harness app boot
        │
        ▼
 Loader composes the profile tree      ~/.dsh/profiles/<profile>/cordis.patch.yml
        │                              (bundle layers first, then your patch)
        ▼
 dsh-client-modules scans enabled entries for a `dsh.client` declaration
        │
        ▼
 Host serves the bundle at /plugins/dsh-client-rtl.js
        │
        ▼
 Renderer loads it; window.__ModuleLoader__.load({ id, factory })
        │
        ▼
 Cordis calls factory() → { inject: [], apply(ctx) }
        │
        ├── document.head.append(<style>)
        ├── markAll()                     ← marks whatever already rendered
        ├── MutationObserver(markAll)     ← survives re-renders
        └── setInterval(markAll, 1000)    ← catches one-off container replacement
```

`apply` returns nothing; everything it creates is registered for teardown through
`ctx.effect(...)`, so unloading the plugin removes the stylesheet, the observer and the
timer.

## Runtime marking

```
        document.body
              │
              ▼
   ┌──────────────────────────────┐
   │ conversation scroll container│  ◄── found via overflowY: auto|scroll
   │  data-dsh-rtl-pane           │      from a `_transcript` / `_userRow` anchor
   └──────────────┬───────────────┘
                  │ contains
      ┌───────────┴────────────┐
      ▼                        ▼
 assistant transcript      user rows, tool rows
 (prose, tables, code)     (Think, Pwsh, reasoning)
```

Marking happens in two modes:

1. **Pane mode** — for `_transcript` and `_userRow` anchors, the nearest scrollable
   ancestor is marked. Marking the scroller instead of the anchor means the whole
   conversation mirrors consistently, including elements rendered between messages.
2. **Row mode** — for `_rowHead`, `_activityMessage`, `_modelReasoningRow`, `_stepBody`
   and `_rowActivitySlot` anchors, the row itself is marked. These rows are sometimes
   rendered outside the scroll container, where pane direction does not reach them.

Both modes are idempotent: re-marking an already marked element is a no-op, which keeps
the per-second pass free.

## Styling contract

All rules are scoped to `[data-dsh-rtl-pane]`, so nothing outside a marked container can
be affected. Four rule groups:

| Group | Rule | Reason |
|---|---|---|
| Direction | `direction: rtl` | flips inline flow, flex order and scrollbar side |
| Prose alignment | `text-align: start` on block text | right-aligns paragraphs without hardcoding `right` |
| Machine text | `direction: ltr` + `unicode-bidi: isolate` on `pre`, `code`, `kbd`, `samp` | code is not prose; isolation stops it dragging neighbouring punctuation |
| Lists | `padding-inline-start: 1.4em` | keeps markers inside the right edge instead of off-screen |

## Failure modes

| Situation | Behaviour |
|---|---|
| Anchors not found (empty session, changed build) | `markAll()` marks nothing; UI stays LTR |
| Pane replaced by React | observer fires; the new container is marked |
| Container replaced between mutations | the 1 s timer re-marks it |
| Plugin throws inside `apply` | only this plugin's fibre fails; the stylesheet is never injected |
| Plugin removed from the patch | observer and timer are disposed through `ctx.effect`; the `<style>` node is removed |

The plugin never reads from the host, never writes outside `document.head` and the
marked containers' `data-` attributes, and never intercepts events. Nothing it does can
change what the agent sends or receives.

## Why not ship a locale?

The Harness locale service localises strings, not direction. There is no `direction`
field in its catalog, and `html[dir]` is not set by the shell. A locale package would
translate text and still leave the layout LTR, so the fix has to be layout-level.
