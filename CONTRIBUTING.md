# Contributing to TagEX

Bug reports, code improvements, document adapters and translation reviews are welcome. Start with an issue for changes affecting fiscal rules or introducing dependencies.

## Set up and validate

Use Node.js 24 and pnpm 11.25.0. Run pnpm install --frozen-lockfile, pnpm test and pnpm test:browser. Install Chromium with pnpm exec playwright install chromium; BROWSER_CHANNEL=msedge can be used on Windows.

Test the actual behavior affected by a change. Label layout changes need preview/print checks; document readers need fictitious fixtures. Automated PDF checks do not certify a physical printer.

## Translations

- Source catalogs are the JSON arrays in assets/i18n. Each row contains Portuguese legacy message ID/text, English, Spanish and Simplified Chinese, in that order.
- The first column is an existing message identifier; do not change it just to reword another language.
- Preserve every numbered placeholder, such as {0}; its value may contain a customer name or an invoice number.
- Run pnpm i18n:build. Commit the JSON sources and generated catalogs.js/catalogs.json together.
- Text is inserted as text or explicitly escaped before HTML rendering. Do not place HTML or scripts in a translation.
- English is the first-use default. Explicit language choices are saved. No external translation service is used.
- Translate interface text, not XML content, business names, addresses, codes or fiscal rules. Printed captions are currently Portuguese and independent from interface language.
- Locale tags are en, pt-BR, es and zh-Hans. Simplified Chinese describes the written UI; it is not a claim about every Chinese locale or fiscal format.

Native speakers are encouraged to review terminology and layout. Please include the language and a screenshot using fictitious data when reporting a translation issue.

## Additional document formats

NF-e model 55 is the currently supported invoice format. A new reader should identify an explicit schema/namespace/version, validate the required fields and normalize to the app's shared data model. Add tests for accepted, malformed, unsupported and ambiguous input. Do not guess a fiscal format from interface language.

Preserve user review, sender identity, delivery-address priority and optional postal codes. Add country-specific formatting only when backed by the document format and tests; allow corrections.

## Pull requests

Explain the problem, resulting behavior and relevant validation. Keep changes focused. Do not commit real XMLs, access tokens, company configuration, indexes, customer logos or private paths.

The Windows release is built and tested in CI before a new version is published. Increase the package version for a new downloadable build, update release links/notes, and bump the static cache when changing browser assets. Existing releases are not overwritten.

Contributions are provided under the project's existing [MIT license](LICENSE).
