# Plan

## 1. Scope
Build a deterministic SEPA XML validation library and a future-ready folder structure for a SharePoint Framework deployment.

## 2. Compatible stack
For the SharePoint implementation, use:
- SPFx 1.23.2
- Node.js 22.14.x
- React 17.0.1
- TypeScript 5.x
- Fluent UI 8.x

The workspace here keeps the validation logic runnable in a normal Node test environment while preserving the design ready for browser-side SPFx use.

## 3. Workstream A: Core validation
- Detect dangerous XML declarations, DOCTYPE, and entity patterns.
- Scan raw XML text for suspicious or non-printable characters.
- Extract Ctry values and validate exact uppercase two-letter format.
- Extract IBAN values and validate checksum and syntax.
- Read NbOfTxs and compare against actual InstdAmt count.
- Read CtrlSum and compare against exact sum of InstdAmt in cents.
- Produce deterministic issue cards and a summary.

## 4. Workstream B: UI and deployment
- Build a SharePoint Web Part with drag-and-drop and file selection.
- Show result dashboard, summary, file metadata, privacy notice.
- Prepare report export in TXT/CSV format.
- Package using .sppkg through the SharePoint App Catalog flow.

## 5. Workstream C: Quality gates
- Unit tests for valid and invalid data.
- Build and type-check pass.
- Export package for SharePoint deployment when the environment supports the required Node version.

## 6. Acceptance criteria
- XML stays in-browser only.
- No external API calls.
- All critical checks are explicit and deterministic.
- The project is ready for SPFx deployment, even if the active workstation must use Node 22 for the final scaffold and package step.
