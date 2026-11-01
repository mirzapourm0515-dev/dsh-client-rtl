# Contributing

Thanks for taking the time to improve `dsh-client-rtl`.

## Reporting a problem

A useful report includes:

1. DeepSeek Harness version and platform (`dsh --version`, OS build).
2. The profile name you installed into (`desktop`, `web`, …).
3. What you expected and what you saw — a screenshot with the code block and one Persian
   paragraph visible is ideal.
4. The output of `dsh --profile <name> --dump-config` around the `rtl` entry.
5. If only part of the conversation flipped, the class list of the rows that stayed
   LTR:

   ```js
   [...document.querySelectorAll('[class]')]
     .map(el => el.className)
     .filter(cls => typeof cls === 'string' && /row|think|activity|step/i.test(cls))
     .slice(0, 40)
   ```

   Please strip conversation text from it; class names are enough.

## Pull requests

- Keep the host half (`index.js`) inert. All DOM work belongs in `client.js`.
- Scope every CSS rule to `[data-dsh-rtl-pane]`. A rule that leaks into the sidebar is a
  regression.
- Never mirror `pre`, `code`, `kbd` or `samp`.
- Prefer behaviour that degrades to "nothing happens" over behaviour that throws.
- Run `npm test` (syntax check on both entry files) before opening the PR.
- Update `CHANGELOG.md` under an `Unreleased` heading.

## Adding an anchor

Anchor suffixes live in two arrays at the top of `client.js`. To support a build whose
rows are not covered:

1. Add the suffix to `ROW_ANCHORS` (or `PANE_ANCHORS` if it identifies the scrollable
   conversation container).
2. Explain in the PR which element it selects and why it is unambiguous.
3. Verify with a screenshot that the sidebar and composer are still LTR.

## Code style

Plain ES modules, no build step, no dependencies. Two-space indentation, semicolon-free
statements consistent with the existing file, JSDoc on every exported or non-obvious
function.
