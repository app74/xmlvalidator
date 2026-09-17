# AGENTS.md

## Role
This repository is intended to implement a SEPA XML validator for payment files. The work must prioritize deterministic validation, privacy, security, accessibility, and maintainability.

## Constraints
- Keep all processing client-side in the browser for the final SharePoint Online implementation.
- Do not upload XML to external services or third-party APIs.
- Do not guess or silently repair invalid XML.
- Never use `dangerouslySetInnerHTML` for XML rendering.
- Treat uploaded XML as untrusted input.
- For any validation that cannot run, report a not checked result instead of marking it as OK.

## Standards
- Code and technical comments in English.
- User-facing strings in Slovak.
- Keep validation logic small, testable, and deterministic.
- Use strong TypeScript typing and avoid `any` where practical.
- Prefer explicit validation results and issue records over hidden assumptions.

## Project flow
1. Validate raw XML structure and reject unsafe / DTD / entity declarations.
2. Scan for suspicious characters before semantic validation.
3. Validate Ctry, IBAN, NbOfTxs and CtrlSum.
4. Produce a summary and issue list without altering the original file.
5. Keep the architecture ready for a later SharePoint SPFx UI layer.
