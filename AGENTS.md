# Repository guidance

## Generation and verification scope

- Use the smallest implementation, regeneration, and verification scope that fully covers the requested behavior and its directly affected derived artifacts.
- Regenerate only affected artifacts. Prefer individual generators or targeted page generation over full-site generation, and avoid wrapper commands that also perform unrelated generation or validation.
- Do not run the public release build (`scripts/build-public-dist.py`, `npm run build-public-dist`, or an equivalent command) unless the user explicitly requests a release artifact or the requested outcome demonstrably requires one.
- Do not run full-site validation or the combined full generation pipeline (`scripts/generate-site-pages.py` or an equivalent command) unless the user explicitly requests it or a material-risk change cannot be assessed reliably with targeted checks.
- Prefer focused checks limited to the changed data, code paths, pages, locales, links, and formatting.
- A request to implement, update, fix, or finish a change does not by itself authorize a public build, full validation, or full regeneration.
- Before running a public build, full-site validation, or full-site regeneration without an explicit user request, explain the concrete necessity, expected scope, and why targeted alternatives are insufficient.
- When broader work is genuinely necessary, still exclude unaffected generators, artifacts, and locales whenever the available tooling allows it.

## Implementation conventions

- Reuse existing shared data structures, utilities, templates, and conventions when they fit the required behavior; avoid parallel implementations of behavior already handled centrally.
- Minimize page-specific, locale-specific, indicator-specific, and one-off rules unless the source semantics, data shape, or externally required behavior is genuinely unique.
- Do not introduce unnecessary abstraction merely to eliminate a small, well-contained exception.
- When a source-specific or otherwise unique exception must remain, keep it narrowly scoped and document, in the code or nearest configuration, why shared behavior is not safe or sufficient.
