# TagEX brand assets

`tagex-monogram.svg` is the editable vector based on Gabriel's Photoshop revision: oversized X, chamfered T/E and the perforated label tip. The background and the separations between shapes are transparent. No fonts or embedded bitmap images are required.

`tagex-wordmark.svg` reproduces Gabriel's latest Photoshop composition: lowercase **ag**, chamfered T with a continuous top bar, oversized X and perforated label tip. Letter positions and proportions follow the submitted PSD, with aligned lower edges and compact spacing. The a/g counters have equal corner bevels and horizontal/vertical symmetry within each letter, preserving their outer contours. Unused left canvas space is cropped for display; the background stays transparent. Use this version in the application header and sharing image without a second text wordmark. The previous T-EX monogram remains available as a design source.

`../icons/app-icon.svg` is the simplified companion for browser tabs, Windows notification icons and application shortcuts: a single T cut into a label. This avoids compressing the five-letter name into a small square. The header image has an accessible TagEX name independently of the vector artwork.

Run `pnpm icons:build` to regenerate the transparent wordmark (1977 × 528), original monogram (1680 × 528), application PNGs and multi-resolution Windows ICO. The ICO includes 16, 20, 24, 32, 40, 48, 64, 128 and 256 px images. Windows PowerShell's legacy Icon class may choose 128 px when 256 px is requested; the 256 px PNG frame remains available to the Windows shell.

Edit the SVG sources, not the generated PNG/ICO files. The original PSD remains the author's editable source outside this repository. These application brand assets are separate from the sender/company logos printed on shipping labels.
