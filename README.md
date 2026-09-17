# SEPA XML Validator

Tento projekt připravuje validator SEPA platebních XML souborů pro SharePoint Online. Cílem je ověřovat XML soubory klientsky v prohlížeči bez odesílání dat na externí server.

## Popis

Aplikace je navržena jako webová část SharePoint Framework (SPFx) pro interní ověření SEPA před uploadem do banky. V současné verzi je připraven základ core validátorů a testů, které jsou odladěné pro deterministické ověření:

- XML struktura a bezpečnostní kontrola
- párování XML tagů
- podezřelé / neviditelné znaky
- Ctry
- BIC
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

## Lokální React/Vite harness

Pro testování uživatelského rozhraní bez SharePointu je k dispozici samostatný React/Vite harness v adresáři `local-harness`. Používá stejnou validační službu a exportní logiku jako SPFx webpart.

```powershell
cd local-harness
npm install
npm run dev
```

Otevřete URL, kterou vypíše Vite, obvykle `http://localhost:5173`.

Lokálně lze ověřit:

- výběr a drag-and-drop XML souboru,
- validační souhrn a seznam nálezů,
- krokované opravy s náhledem a potvrzením každého kroku,
- finální kontrolu opraveného XML,
- stažení opraveného XML a TXT/CSV reportů.

Opravy jsou pouze deterministické a explicitně potvrzované. Neplatné IBANy a `DOCTYPE`/entity deklarace se neopravují automaticky.

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

Repozitář obsahuje core validátor, SPFx webpart, lokální React/Vite harness, testy, dokumentaci a plán. Pro SPFx build a packaging používejte kompatibilní Node 22.x.
