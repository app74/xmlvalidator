# Local React/Vite test harness

This harness runs the SEPA XML validator UI without SharePoint. It reuses the SPFx validation service and report export code, so business rules are not duplicated.

Vite explicitly uses this directory's `tsconfig.json` for shared sources as well. Installing dependencies in `sepa-xml-validator` is not required to run the harness.

## Start

From the repository root:

```powershell
cd local-harness
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Test manually

1. Select or drag an XML file into the drop zone.
2. Check the summary, validation checks, and issue list.
3. Download both TXT and CSV reports.
4. Use the step-by-step repair panel, review the original and proposed value, and explicitly apply or skip each suggestion.
5. Try valid XML, an invalid `Ctry`, BIC, or IBAN, mismatched `NbOfTxs`/`CtrlSum`, mismatched XML tags, and XML containing `DOCTYPE` or an entity declaration.

Only deterministic repairs are offered. Invalid IBANs and `DOCTYPE`/entity declarations remain manual-only findings. After every applied repair, the XML is validated again and the final status is shown.

The XML is processed locally in the browser and is not uploaded anywhere.
