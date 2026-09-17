# Plan

## 1. Scope
- [x] Build a deterministic SEPA XML validation library.
- [x] Prepare a future-ready folder structure for a SharePoint Framework deployment.

## 2. Compatible stack
For the SharePoint implementation, use:
- [x] SPFx 1.23.2
- [x] Node.js 22.14.x
- [x] React 17.0.1
- [x] TypeScript 5.x
- [x] Fluent UI 8.x

- [x] Keep the validation logic runnable in a normal Node test environment while preserving the design ready for browser-side SPFx use.

## 3. Workstream A: Core validation
- [x] Detect dangerous XML declarations, DOCTYPE, and entity patterns.
- [x] Scan raw XML text for suspicious or non-printable characters.
- [x] Extract Ctry values and validate exact uppercase two-letter format.
- [x] Extract IBAN values and validate checksum and syntax.
- [x] Read NbOfTxs and compare against actual InstdAmt count.
- [x] Read CtrlSum and compare against exact sum of InstdAmt in cents.
- [x] Produce deterministic issue cards and a summary.

## 4. Workstream B: UI and deployment
- [x] Build a SharePoint Web Part with drag-and-drop and file selection.
- [x] Show result dashboard, summary, file metadata, and privacy notice.
- [x] Prepare report export in TXT/CSV format.
- [x] Package using .sppkg through the SharePoint App Catalog flow.

## 5. Workstream C: Local testing harness
- [x] Create a standalone React/Vite test harness for browser testing without SharePoint.
- [x] Reuse the existing validation service and report export logic without duplicating business rules.
- [x] Add local file selection and drag-and-drop testing.
- [ ] Verify validation results, issue list, and TXT/CSV report downloads locally.
- [x] Add a documented start command for the local harness.

## 6. Workstream D: Quality gates
- [x] Unit tests for valid and invalid data in the core validation prototype.
- [x] Build and type-check pass.
- [x] Export package for SharePoint deployment when the environment supports the required Node version.
- [x] Add dedicated tests for the SPFx validation service.
- [ ] Add dedicated component tests for file selection, validation display, and report download actions.

## 7. Acceptance criteria
- [x] XML stays in-browser only.
- [x] No external API calls.
- [x] All critical checks are explicit and deterministic.
- [x] The project is ready for SPFx deployment, even if the active workstation must use Node 22 for the final scaffold and package step.
