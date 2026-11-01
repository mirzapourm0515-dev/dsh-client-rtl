# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-11-02

First public release.

### Added

- RTL layout for the conversation surface: prose, headings, lists, tables, blockquotes
  and message bubbles.
- LTR pinning with `unicode-bidi: isolate` for `pre`, `code`, `kbd` and `samp`.
- Runtime container detection: the nearest scrollable ancestor of a transcript or message
  anchor is marked `data-dsh-rtl-pane` instead of relying on hashed class names.
- Best-effort marking of activity rows (`Think`, tool calls, reasoning) that render
  outside the scroll container.
- `MutationObserver` plus a one-second safety pass so re-renders keep their direction.
- Windows installer (`scripts/install.ps1`) with profile backup and idempotent patching.
- Documentation: architecture, selector strategy, troubleshooting, bilingual README.

### Known limitations

- Activity rows may stay LTR on builds whose markup does not expose a row anchor.
- Only the conversation surface is mirrored; the sidebar, header and composer keep LTR.
- `tui` and `headless` profiles have no DOM and are out of scope.
