# sepa-xml-validator

## Summary

Client-side SEPA XML validator for SharePoint Online. It checks XML structure and security, suspicious characters, Ctry, BIC, IBAN, NbOfTxs, and CtrlSum. It also provides explicit step-by-step repairs with revalidation and a local React/Vite harness for testing without SharePoint.

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.23.2-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)

> Get your own free development tenant by subscribing to [Microsoft 365 developer program](http://aka.ms/o365devprogram)

## Prerequisites

- Node.js 22.14.x (SPFx 1.23.2 compatibility)
- npm 10+
- SharePoint Online and App Catalog for deployment

## Solution

| Solution | Description |
| --- | --- |
| sepa-xml-validator | SEPA XML validation web part for SharePoint Online |

## Version history

| Version | Comments |
| --- | --- |
| 0.1.0 | Initial validator implementation |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- in the command-line run:
  - `npm install -g @rushstack/heft`
  - `npm install`
  - `heft start`

> Include any additional steps as needed.

Other build commands can be listed using `heft --help`.

## Testing the validator

From the repository root, run the validation prototype tests and type-check:

```powershell
npm install
npm test
npm run build
```

From the `sepa-xml-validator` folder, run the SPFx tests, build, and package generation:

```powershell
npm install
npm run build
```

The SharePoint package is generated at `sharepoint/solution/sepa-xml-validator.sppkg`.

For a manual browser test, start the SPFx development server with `heft start --clean`, open the SharePoint hosted workbench, add the SEPA XML Validator web part, and test these cases:

- a valid XML file with matching `Ctry`, `NbOfTxs`, and `CtrlSum`;
- an invalid country code or IBAN;
- mismatched transaction count or control sum;
- XML containing `DOCTYPE` or an entity declaration;
- TXT and CSV report downloads after validation.

## Features

- Browser-only XML processing without external API calls
- XML tag pairing and dangerous declaration checks
- Ctry, BIC, IBAN, NbOfTxs, and CtrlSum validation
- Step-by-step repair proposals with confirmation and final revalidation
- TXT/CSV reports and repaired XML download

> Notice that better pictures and documentation will increase the sample usage and the value you are providing for others. Thanks for your submissions advance.

> Share your web part with others through Microsoft 365 Patterns and Practices program to get visibility and exposure. More details on the community, open-source projects and other activities from http://aka.ms/m365pnp.

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/sharepoint/dev/spfx/build-for-teams-overview)
- [Use Microsoft Graph in your solution](https://docs.microsoft.com/sharepoint/dev/spfx/web-parts/get-started/using-microsoft-graph-apis)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
- [Heft Documentation](https://heft.rushstack.io/)