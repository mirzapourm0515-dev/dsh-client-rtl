# How it works

## The problem with selectors

DeepSeek Harness is built with CSS modules. In the shipped bundle, class names carry a
per-build hash:

```css
.LOmM4q_userRow { flex-direction: column; align-items: flex-end; display: flex }
.xeixwq_table   { table-layout: fixed; width: 100% }
```

The readable suffix survives (`_userRow`), the hash does not. Any stylesheet that keys on
a full class name breaks on the next release.

Suffix matching (`[class*="_userRow"]`) survives hashes, but it is not enough on its own:

- some suffixes are ambiguous — `contentColumn` looks like the chat column but is a cell
  of the Trajectory table;
- some elements that need flipping carry no useful class at all — the conversation
  scroll container is a plain `div`;
- user rows and assistant prose are siblings in different subtrees, so there is no single
  selector that covers both.

## The approach: mark, then style

Instead of styling elements, the plugin marks **one container** and lets CSS cascade:

```js
const MARK = 'data-dsh-rtl-pane'
```

1. Find an anchor (`_transcript`, else `_userRow`).
2. Walk up until an element reports `overflow-y: auto|scroll`.
3. Set `data-dsh-rtl-pane` on it.
4. Style `[data-dsh-rtl-pane]`.

Walking up to the scroller is what makes the result coherent: the scroller is the
element that owns the conversation's geometry, so flipping it flips every message,
tool call and divider inside it at once, regardless of how their own classes are named.

### Re-marking

React replaces nodes; attributes set by a plugin on a removed node are gone with it. The
plugin therefore installs a `MutationObserver` on `document.body` (child-list, subtree)
and re-runs the marking pass on any change, plus a 1 s interval as a safety net for
container swaps that happen without a child-list mutation of the body.

Both are removed on plugin teardown:

```js
ctx.effect(() => () => {
  observer.disconnect()
  clearInterval(timer)
  style.remove()
})
```

## What is pinned to LTR, and why

Only `pre`, `code`, `kbd` and `samp` are forced back to LTR, with
`unicode-bidi: isolate`.

- **`pre`/`code`** — a command, a path, a JSON body or a diff is read left-to-right in
  every locale. Mirroring it produces code that cannot be typed back.
- **`unicode-bidi: isolate`** — without isolation, a trailing punctuation mark after an
  LTR token inside an RTL paragraph is placed by the paragraph direction and jumps to the
  wrong end. Isolation gives each code element its own bidi context.

Everything else inherits the pane direction, so Persian prose, list markers, table cells
and blockquotes all start at the right edge.

## What this plugin does not do

| Not done | Why |
|---|---|
| Mirror the sidebar, panels, header | scope: the request is the conversation surface; mirroring navigation breaks muscle memory |
| Translate strings | out of scope; the Harness locale service owns that |
| Set `dir="rtl"` on `<html>` | it would mirror the entire application, including the composer and settings |
| Force user bubbles to a side | in RTL the bubble mirrors with the pane; pinning it produced overflow past the pane edge |
| Style by build-specific hash | hashes change between releases |

## Verifying a change safely

The plugin is visible in the running app, and its effect is entirely CSS. To check a
modification:

1. Edit `client.js`.
2. Reload the window (`Ctrl+R`) or restart the app.
3. Confirm that Persian prose starts at the right edge and that a code block still reads
   left-to-right.
4. Confirm the sidebar is unchanged.

If the marking pass cannot find an anchor, nothing is marked and the UI simply stays LTR
— there is no failure state that breaks the application.
