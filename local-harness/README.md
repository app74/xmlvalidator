# Local React/Vite test harness

This harness runs the SEPA XML validator UI without SharePoint. It reuses the SPFx validation service and report export code, so business rules are not duplicated.

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
4. Try valid XML, an invalid `Ctry` or IBAN, mismatched `NbOfTxs`/`CtrlSum`, and XML containing `DOCTYPE` or an entity declaration.

The XML is processed locally in the browser and is not uploaded anywhere.
