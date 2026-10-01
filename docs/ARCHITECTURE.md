# Architecture

## Why there is still one HTML file

The public release is deliberately portable: open `index.html` and the app works offline. The editable source is split so that portability does not force maintainers to work in a monolith.

## Build flow

```text
HTML template + ordered CSS modules + shared core + ordered app modules
                              ↓
                        scripts/build.mjs
                              ↓
                          index.html
```

Files in `src/js/app/` begin with a number because the generated browser application shares one private closure. The order is explicit and deterministic.

`src/js/core.js` is different: it is a real standalone module with no DOM dependency. Node tests require it directly, and the generated page loads the same source before the browser application.

## Change rules

1. Edit files under `src/`, never the generated `index.html`.
2. Keep each application module focused and below 260 lines.
3. Put output, validation, and schema rules in `src/js/core.js`.
4. Add a regression test whenever copied text or imported data changes.
5. Run `npm run check` before committing.
6. Update `docs/VARIABLE_MATRIX.md` when a public variable changes.

## Human handoffs

Every application module contains a searchable comment beginning with `* Future work:`. These notes are written for people working without an LLM. They should explain intent, not restate the code.

## Safety boundaries

- No patient data.
- No runtime network requests.
- Local files are size-checked, parsed, normalized, and escaped.
- The preview may add visual highlights, but copied output remains plain text.
- “Ready” means builder fields are complete; it never means Epic or a clinician approved the content.
