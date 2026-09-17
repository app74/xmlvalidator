# SEPA XML Validator

Tento projekt připravuje validator SEPA platebních XML souborů pro SharePoint Online. Cílem je ověřovat XML soubory klientsky v prohlížeči bez odesílání dat na externí server.

## Popis

Aplikace je navržena jako webová část SharePoint Framework (SPFx) pro interní ověření SEPA před uploadem do banky. V současné verzi je připraven základ core validátorů a testů, které jsou odladěné pro deterministické ověření:

- XML struktura a bezpečnostní kontrola
- podezřelé / neviditelné znaky
- Ctry
- IBAN
- NbOfTxs
- CtrlSum
- shrnutí a issue report

## Kompatibilní stack

Podle aktuálních metadat balíčku `@microsoft/generator-sharepoint` je podporovaná stabilní verze:

- SPFx: 1.23.2
- Node.js: >=22.14.0 <23.0.0
- React: 17.0.1
- TypeScript: 5.x
- Fluent UI: 8.x

V aktuálním workstation prostředí je běžící Node 24.19.0, proto je nutné pro finální SPFx scaffold a packaging použít Node 22.x (např. přes nvm-windows nebo nvm).

## Prerekvizity

- Node.js 22.14.x
- npm 10+
- Git
- SharePoint Online + App Catalog
- přístup k lokálnímu build environment pro SPFx

## Instalace

```bash
npm install
```

## Testování

```bash
npm test -- --run
```

## Build

```bash
npx tsc --noEmit
npm run build
```

## SPFx scaffold a vytvoření webpartu

Po nainstalování kompatibilního Node 22 použijte:

```bash
npx -p @microsoft/generator-sharepoint@1.23.2 -p yo -c "yo @microsoft/sharepoint"
```

Poté zvolte typ Web Part, název projektu a konfiguraci podle SharePoint Online rozhraní.

## Deployment do SharePoint Online

1. vytvořte build projektu podle SPFx procesu
2. zabalte `.sppkg`
3. nahrajte do App Catalog
4. přidejte web part na moderní stránku

## Ochrana soukromí

Všechny soubory jsou zpracovávány lokálně v prohlížeči. Neodesílají se na externí API ani na vlastní backend.

## Poznámka k projektu

Tato pracovní verze je připravena jako validující core layer a dokumentace. Pro plný SPFx web part je nutné dokončit scaffold v kompatibilním Node 22. Toto repo obsahuje základní návrh, AGENTS, plán a validátory, které jsou testované lokálně v Node.
