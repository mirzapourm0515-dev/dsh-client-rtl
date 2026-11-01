# Troubleshooting

## Nothing changed after restarting

**The patch entry is probably not being applied.** The Harness profile patch layer treats
a bare row as an *override* of an existing plugin id. With no plugin named `rtl`, it logs
`patch: entry "rtl" not found` and continues silently.

Wrong:

```yaml
- id: rtl
  name: "dsh-client-rtl"
```

Right:

```yaml
- insert:
    - id: rtl
      name: "dsh-client-rtl"
```

Check the composition without committing to a boot:

```sh
dsh --profile <name> --dump-config | grep -A2 rtl
```

The entry should appear in the printed tree with no `not found` warning.

## The entry is in the tree but the UI is still LTR

1. **The package is not resolvable.** From the profile directory:
   `node -e "console.log(require.resolve('dsh-client-rtl'))"` must print a path. If it
   throws, the copy went to the wrong `node_modules` — it must be
   `$DSH_HOME/profiles/<profile>/node_modules/dsh-client-rtl`.
2. **`dsh.client` is missing or malformed.** The host only serves bundles for packages
   that declare it:

   ```json
   "dsh": { "client": { "platform": "web", "immediately": true, "inject": [] } }
   ```

3. **The bundle was cached.** A full app restart is more reliable than `Ctrl+R`; the host
   composes the boot graph at startup.

## Only part of the conversation flipped

That is expected when a build renames its anchors. The plugin flips what it can find:

- prose and bubbles flip when `_transcript` or `_userRow` exists;
- tool/thinking rows flip only when one of the row anchors matches.

Open an issue with the build version and, if you can, the class list of the rows that
stayed LTR:

```js
// paste in the devtools console of the Harness window
[...document.querySelectorAll('[class]')]
  .map(el => el.className)
  .filter(cls => typeof cls === 'string' && /row|think|activity|step/i.test(cls))
  .slice(0, 40)
```

## Code blocks look broken

They should be pinned to `direction: ltr`. If a code block renders mirrored, another
stylesheet in the app is winning on specificity. Confirm the pin is present:

```js
[...document.querySelectorAll('[data-dsh-rtl-pane] code')]
  .map(el => getComputedStyle(el).direction)
```

Every entry must be `ltr`.

## The sidebar also flipped

It should not — all rules are scoped to `[data-dsh-rtl-pane]`. If it happened, a marked
element is an ancestor of the sidebar, which means the scroll-container walk climbed too
far. Report the build; the anchor set needs narrowing.

## Uninstalling

Remove the `- insert:` block, restart. Leftover:

- `<style data-plugin="dsh-client-rtl">` — removed with the plugin on restart;
- `data-dsh-rtl-pane` attributes — harmless, and re-marked only while the plugin runs;
- the package directory — never loaded once the entry is gone.
