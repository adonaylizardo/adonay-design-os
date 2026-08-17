# Websites to Review

Add live URLs below. The agent uses Browser MCP to navigate, snapshot, and screenshot each page.

## Pages

### Page 1 — *(name, e.g. Homepage)*

**URL:**

**Viewport:** *(desktop / mobile / both — default: desktop 1280px)*

**Auth notes:** *(login required? test credentials? public only?)*

**Review focus:** *(what to evaluate on this page)*

---

### Page 2 — *(optional)*

**URL:**

**Viewport:**

**Auth notes:**

**Review focus:**

---

## For the agent

When evaluating:
1. Skip lines with placeholder text like "(paste", "(optional)", or empty URLs
2. For each valid URL: `browser_navigate` → `browser_snapshot` → `browser_take_screenshot`
3. Save screenshots to `insights/snapshots/YYYY-MM-DD-[page-slug].png`
4. Reference screenshot paths in artifact-review.md and student-feedback.md
5. If mobile viewport is specified, resize or use responsive testing before snapshot
