---
trigger: always_on
description: Always consult the design document before any development work in this project.
---

# Read the Design Document First

Before making **any** code change, creating files, or implementing a feature in this
repository, you MUST first read `docs/DESIGN.md` and align your work with it.

Rules:
1. **Read `docs/DESIGN.md` before development.** Treat it as the source of truth for
   the design system (colors, spacing, typography), screens/routes, and core logic.
2. **Match the design tokens exactly** (section 5 of the doc). Do not invent colors,
   spacing, or font sizes that are not defined there.
3. **Stay within scope.** Do not add features listed under "Out of Scope" unless the
   user explicitly asks and the doc is updated first.
4. **Doc-first changes.** If a requested change conflicts with `docs/DESIGN.md`,
   update the document first, then implement the code to match.
5. Keep features lean and avoid over-engineering.
