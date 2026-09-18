# Lokálne spustenie SEPA XML validátora

Tento postup umožňuje spustiť aplikáciu na inom počítači bez SharePointu a bez prihlásenia do Microsoft účtu.

## Prvé spustenie

1. Nainštalujte **Node.js 22.x, minimálne verziu 22.14.0**, vrátane npm.
2. Získajte projekt jedným z nasledujúcich spôsobov:

   **Klonovanie z GitHubu (bez ručného kopírovania):** Nainštalujte Git, otvorte PowerShell v priečinku, do ktorého chcete projekt uložiť, a spustite:

   ```powershell
   git clone https://github.com/app74/xmlvalidator.git
   ```

   Vznikne priečinok `xmlvalidator` so zdrojovými súbormi projektu. Ak je repozitár súkromný, potrebujete prístup k nemu a prihlásenie do GitHubu.

   **Kopírovanie:** Skopírujte celý priečinok projektu `xmlvalidator`. Priečinky `node_modules` kopírovať nemusíte. Samotný priečinok `local-harness` nestačí, pretože používa zdrojové súbory zo susedného priečinka `sepa-xml-validator`.

3. Otvorte PowerShell a spustite nasledujúce príkazy. Cestu upravte podľa umiestnenia projektu:

   ```powershell
   cd C:\cesta\xmlvalidator\local-harness
   npm.cmd ci
   npm.cmd run dev
   ```

4. V prehliadači otvorte **http://localhost:5173**. Ak terminál vypíše inú adresu, použite tú.

Závislosti stačí nainštalovať v priečinku `local-harness`. V koreňovom priečinku projektu ani v priečinku `sepa-xml-validator` ich pre tento spôsob spustenia inštalovať nemusíte.

## Ďalšie spustenia

V PowerShelli spustite:

```powershell
cd C:\cesta\xmlvalidator\local-harness
npm.cmd run dev
```

Potom otvorte adresu vypísanú v termináli. Terminál nechajte počas používania aplikácie otvorený. Server zastavíte klávesovou skratkou **Ctrl+C**.

## Internet a ochrana údajov

Internet je potrebný na klonovanie projektu z GitHubu a na prvotné stiahnutie závislostí cez `npm.cmd ci`. Po ich nainštalovaní môže lokálna aplikácia fungovať bez internetu.

XML súbory sa spracúvajú lokálne v prehliadači a nikam sa neodosielajú.
