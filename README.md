# TagEX — Shipping labels

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md) · [简体中文](README.zh-Hans.md)

**Open-source shipping labels for paper and thermal rolls.** Enter shipment details manually, import Brazilian NF-e XML files, or search configured company folders using the optional local service.

**[Try the web app](https://gabs0078.github.io/etiquetas-expedicao-universal/)** · **[Download Windows](https://github.com/Gabs0078/etiquetas-expedicao-universal/releases/tag/v0.5.1)** · **[Installation guide](https://gabs0078.github.io/etiquetas-expedicao-universal/instalar.html)** · **[Contributing](CONTRIBUTING.md)**

## What it does

- Batch printing with sequential package labels; edit an invoice without adding a duplicate.
- A4, A3, A2, A5, Letter and Legal sheets; large-label layouts, landscape and grid/list arrangements.
- Thermal rolls from 80 × 35 to 100 × 150 mm, resizable company logos and optional label fields.
- Local/offline processing, light/dark themes, and UI languages: English (default), Portuguese, Spanish and Simplified Chinese.
- Optional Windows folder wizard and persistent SQLite search index.

**Language is separate from document support.** The current importer reads **Brazilian outgoing NF-e, model 55**. XML is a general file format; invoices from other countries may use different schemas. Switching UI language does not add support for those schemas. Printed captions remain in Portuguese, and invoice names, addresses and fiscal values are not translated. Other document readers can be added through adapters.

## Windows: no commands needed

1. Download **TagEX-Windows-0.5.1.zip** from Releases. “Source code” is for developers and does not contain the bundled runtime.
2. Extract the entire ZIP and open **Instalar TagEX.exe**.
3. Install for your Windows account, then open the **TagEX** shortcut.
4. Choose manual/XML use or configure invoice folders. Folder integration is optional.

Windows 10/11 x64. Node.js and the XML parser are bundled; installing the downloaded package needs no internet or administrator access. The installer is currently unsigned and updates are manual. Linux and macOS packages are planned; the web app can be used in a compatible browser.

## Offline and data

Manual entry, XML files saved locally, batch editing and printing work offline, with a browser and available printer. Shared folders need access to the company network/VPN. The search index is not a copy of the XMLs: importing a search result rereads its original file.

Company profiles, logos, preferences and batches are stored in the browser for the origin used. **GitHub Pages and the local address have separate data.** There is no automatic cross-browser or cross-origin migration. Local folder settings and the index are stored under %LOCALAPPDATA%\EtiquetasExpedicao. The app does not install printer drivers or change firewall/sharing settings.

## Develop

The browser app is plain HTML/CSS/JavaScript, without a frontend framework or build requirement. Manual entry and XML upload can also run from index.html. The optional Node.js service uses Node.js 24 or newer.

1. Clone this repository.
2. Run pnpm install --frozen-lockfile with pnpm 11.25.0.
3. Run pnpm test.
4. Install the test browser with pnpm exec playwright install chromium, then run pnpm test:browser. On Windows, BROWSER_CHANNEL=msedge uses installed Edge.
5. For the generic local service, configure integracao/config.local.json using config.exemplo.json and run pnpm start. Open the address shown by the service and enter its temporary access code.

The Windows release includes the Node runtime; a source checkout does not. See [package maintenance](docs/pacote-windows.md) for packaging and installer tests.

## Translations and document adapters

Translation catalogs live in assets/i18n. Run pnpm i18n:build after editing them. Translations are bundled and work offline; no translation service receives invoice data. See [CONTRIBUTING](CONTRIBUTING.md) for placeholders, testing and adding a language.

The shared normalizer is assets/js/nfe.js. New countries/document formats should have explicit readers, schema identification and fictitious fixtures. Do not infer fiscal rules from a user's language or translate addresses to make a document fit.

## Limits and validation

Up to 100 invoices or 3,000 labels per batch, 1–999 packages per invoice, 100 XMLs per selection and 2 MB per XML. The importer checks basic structure and consistency and requires user review. It does not verify digital signatures, the complete fiscal schema or current authorization/cancellation status with a tax authority. Check the issuing business system when necessary.

Only fictitious data belongs in issues and tests. Do not commit actual invoices, credentials, company settings or customer logos.

## License

[MIT](LICENSE), copyright Gabriel de Godoy Nery Theodoro. Contributions and translation reviews are welcome.
