(() => {
  "use strict";

  const BTN_CLASS = "jlc-copy-btn";
  const BROWSE_RE = /\/browse\/([A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)*-\d+)/;

  const CLIPBOARD_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z"/>' +
    '<path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>' +
    '<path d="M8 12h8M8 16h5"/></svg>';

  const CHECK_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M4 12.5 9.5 18 20 7"/></svg>';

  const SUMMARY_SELECTORS = [
    '[data-testid="issue.views.issue-base.foundation.summary.heading"]',
    'h1[data-testid*="summary"]',
    '#summary-val',
    'h1'
  ];

  function issueKeyFromHref(href) {
    const match = href && href.match(BROWSE_RE);
    return match ? match[1].toUpperCase() : null;
  }

  /** Anchors that represent the issue key in a breadcrumb (Jira Cloud) or the key field (Jira DC). */
  function findIssueKeyAnchors() {
    const anchors = new Set();

    document.querySelectorAll('a[href*="/browse/"]').forEach((anchor) => {
      if (!issueKeyFromHref(anchor.getAttribute("href"))) return;
      const inBreadcrumb = anchor.closest(
        '[data-testid*="breadcrumb" i], nav[aria-label*="readcrumb" i], ol, #breadcrumbs-container'
      );
      if (inBreadcrumb) anchors.add(anchor);
    });

    const dcKeyField = document.querySelector("#key-val");
    if (dcKeyField && issueKeyFromHref(dcKeyField.getAttribute("href"))) anchors.add(dcKeyField);

    return [...anchors];
  }

  function readIssue(anchor) {
    const href = anchor.getAttribute("href");
    const key = issueKeyFromHref(href);
    if (!key) return null;

    const scope = anchor.closest('[role="dialog"]') || document;
    let summary = "";
    for (const selector of SUMMARY_SELECTORS) {
      const el = scope.querySelector(selector);
      const text = el && el.textContent.trim();
      if (text) {
        summary = text;
        break;
      }
    }

    return {
      key,
      summary,
      url: new URL(href, location.origin).href,
      label: summary ? `${key} ${summary}` : key
    };
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function copyViaExecCommand(text, html) {
    const onCopy = (event) => {
      event.clipboardData.setData("text/plain", text);
      event.clipboardData.setData("text/html", html);
      event.preventDefault();
    };
    document.addEventListener("copy", onCopy, true);
    try {
      return document.execCommand("copy");
    } finally {
      document.removeEventListener("copy", onCopy, true);
    }
  }

  async function copyLink(issue) {
    const text = issue.label;
    const html = `<a href="${escapeHtml(issue.url)}">${escapeHtml(text)}</a>`;

    if (navigator.clipboard && typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([text], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" })
          })
        ]);
        return true;
      } catch {
        // Fall through to the execCommand path (older Firefox / permission denied).
      }
    }

    return copyViaExecCommand(text, html);
  }

  let resetTimer = null;

  function flash(button, ok) {
    button.innerHTML = ok ? CHECK_SVG : CLIPBOARD_SVG;
    button.classList.toggle("jlc-ok", ok);
    button.classList.toggle("jlc-error", !ok);
    button.dataset.jlcTip = ok ? "Copied!" : "Copy failed";
    button.classList.add("jlc-show-tip");

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      button.innerHTML = CLIPBOARD_SVG;
      button.classList.remove("jlc-ok", "jlc-error", "jlc-show-tip");
      delete button.dataset.jlcTip;
    }, 1500);
  }

  function createButton(anchor) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = BTN_CLASS;
    button.title = "Copy link (key + title)";
    button.setAttribute("aria-label", "Copy issue link with key and title");
    button.innerHTML = CLIPBOARD_SVG;

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const issue = readIssue(anchor);
      if (!issue) {
        flash(button, false);
        return;
      }
      flash(button, await copyLink(issue));
    });

    return button;
  }

  function injectButtons() {
    findIssueKeyAnchors().forEach((anchor) => {
      const next = anchor.nextElementSibling;
      if (next && next.classList.contains(BTN_CLASS)) return;
      anchor.insertAdjacentElement("afterend", createButton(anchor));
    });
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      injectButtons();
    });
  }

  injectButtons();
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
