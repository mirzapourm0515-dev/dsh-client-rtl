/**
 * Browser half of dsh-client-rtl.
 *
 * DeepSeek Harness renders its interface left-to-right with no RTL support and no
 * text-direction setting, so Persian, Arabic and Hebrew prose is read right-to-left
 * only because of Unicode bidi — the layout, message bubbles and alignment all stay
 * LTR. This module fixes the conversation surface without touching the application:
 *
 *   1. it injects one stylesheet, scoped to a `data-dsh-rtl-pane` marker;
 *   2. it finds the conversation's scroll container at runtime and marks it;
 *   3. it re-marks after every re-render through a MutationObserver.
 *
 * Class names in the Harness bundle are hashed CSS modules (`LOmM4q_userRow`,
 * `xeixwq_table`), so no selector here depends on a stable class name longer than the
 * loose `_name` suffix used to locate anchors.
 */

const MARK = 'data-dsh-rtl-pane'

/**
 * Anchors that identify the conversation surface. Any of them may be absent on the
 * first render (an empty session has no transcript yet), so every pass is best-effort.
 */
const PANE_ANCHORS = ['[class*="_transcript"]', '[class*="_userRow"]']

/**
 * Activity rows (Think / tool calls / reasoning) that render in their own layout.
 * They are marked directly because they do not always sit inside the scroll container.
 */
const ROW_ANCHORS = [
  '[class*="_rowHead"]',
  '[class*="_activityMessage"]',
  '[class*="_modelReasoningRow"]',
  '[class*="_stepBody"]',
  '[class*="_rowActivitySlot"]',
]

const CSS = `
/* ---- the marked surface reads right-to-left ---- */
[${MARK}] { direction: rtl; }

/* ---- prose starts at the right edge ---- */
[${MARK}] p,
[${MARK}] li,
[${MARK}] h1,
[${MARK}] h2,
[${MARK}] h3,
[${MARK}] h4,
[${MARK}] blockquote,
[${MARK}] td,
[${MARK}] th { text-align: start; }

/* ---- code, paths and keys never mirror ---- */
[${MARK}] pre,
[${MARK}] code,
[${MARK}] kbd,
[${MARK}] samp {
  direction: ltr;
  text-align: left;
  unicode-bidi: isolate;
}

/* ---- list markers sit on the right ---- */
[${MARK}] ul,
[${MARK}] ol {
  padding-inline-start: 1.4em;
  padding-inline-end: 0;
}
`

/**
 * Finds the nearest vertically scrollable ancestor, which is the element that owns the
 * conversation's scroll position and therefore its layout direction.
 *
 * @param {Element} element
 * @returns {Element | undefined}
 */
function scrollableAncestor(element) {
  let node = element
  while (node && node !== document.body) {
    const style = getComputedStyle(node)
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') return node
    node = node.parentElement
  }
  return undefined
}

/**
 * Marks one element, preferring its scroll container when `useScrollParent` is set.
 *
 * @param {Element} element
 * @param {boolean} useScrollParent
 * @returns {void}
 */
function mark(element, useScrollParent) {
  const target = (useScrollParent && scrollableAncestor(element)) || element
  if (target && !target.hasAttribute(MARK)) target.setAttribute(MARK, '')
}

/** Marks every anchor currently in the document. Idempotent and cheap. */
function markAll() {
  for (const selector of PANE_ANCHORS) {
    for (const element of document.querySelectorAll(selector)) mark(element, true)
  }
  for (const selector of ROW_ANCHORS) {
    for (const element of document.querySelectorAll(selector)) mark(element, false)
  }
}

window.__ModuleLoader__.load({
  id: 'dsh-client-rtl',
  factory() {
    return {
      inject: [],
      apply(ctx) {
        const style = document.createElement('style')
        style.setAttribute('data-plugin', 'dsh-client-rtl')
        style.textContent = CSS
        document.head.append(style)

        markAll()

        const observer = new MutationObserver(() => markAll())
        observer.observe(document.body, { childList: true, subtree: true })

        // Containers can be replaced once shortly after mount; re-check on a slow timer
        // so a missed mutation cannot leave the pane unmarked.
        const timer = setInterval(markAll, 1000)

        ctx.effect(() => () => {
          observer.disconnect()
          clearInterval(timer)
          style.remove()
        })
      },
    }
  },
})
