# TagEX 0.5.0 — Languages and download menu

- English is the first-use interface language. Portuguese (Brazil), Spanish and Simplified Chinese can be selected in the header; the choice is saved in the browser.
- Windows installer, welcome screen and folder wizard include a language selector. The local launcher passes its language to a browser without an existing preference.
- The installation button is now a download icon and OS menu. Windows links to the complete package; Linux and macOS are marked Coming soon. The installation guide remains in the menu and is available in all four languages, including offline.
- English README, translated quick starts, contribution guidelines, issue and pull request templates support open-source collaboration under the existing MIT license.
- Translation catalogs are bundled locally. No translation service receives invoice data.
- Fixed Windows PowerShell 5.1 installation/update cleanup when the temporary directory uses a Windows 8.3 profile alias; directory boundaries and installed-app markers are still checked.

**Document support:** the reader still supports Brazilian outgoing NF-e, model 55. XML syntax is general, but invoice schemas vary. UI language does not select a different fiscal reader. Invoice data is not translated; printed captions stay in Portuguese in this release.

**Windows setup:** download **TagEX-Windows-0.5.0.zip**, extract the entire archive, then open **Instalar TagEX.exe**. Node.js and the XML parser are included. Folder integration is optional. The release remains unsigned and updates are manual.

**Português:** seletor de idioma no aplicativo e no instalador, guia traduzido e menu de download com Windows disponível e Linux/macOS em breve. O formato fiscal e os dados impressos foram preservados. Para começar, extraia o ZIP completo e abra Instalar TagEX.exe.

Validation covers catalog completeness/placeholders, language persistence, drafts and XML review, unchanged printed data, responsive OS menu, keyboard navigation, offline installation guide, local service, printing layouts, and installation/update/uninstall in an isolated temporary directory without a global Node runtime.
