# Morelord PDF reference library

Generated September 7, 2026 using the shared Morelord document style: Arial, US Letter, white pages, pale-blue table headers, muted running labels, and numbered pages.

Brand and business docs (brand guide, product guide, demo recording guide) now live in Google Drive: [Morelord Gaming](https://drive.google.com/drive/folders/1JKMCzl8f7MyNhgtuIMzCz1Y2o4_w9cC0). This folder no longer includes a branding-guide PDF.

- [Core reference](Morelord-Core-Reference.pdf): September 7, 2026 snapshot of the README and the GM product guide. The product guide now lives in Google Drive; this PDF is not rebuilt from that guide.
- [Character Export reference](Morelord-Character-Export-Reference.pdf): README, usage, export format, and release instructions.
- [Craftworks reference](Morelord-Craftworks-Reference.pdf): README, User Guide, documentation landing page, GM manual, and player manual.
- [Downtime reference](Morelord-Downtime-Reference.pdf): current README, Sessions, Projects, and activity workflows.
- [Encounters reference](Morelord-Encounters-Reference.pdf): README, documentation landing page, and GM manual.
- [Journeys reference](Morelord-Journeys-Reference.pdf): README, documentation landing page, GM manual, player guide, and GM travel rules reference.
- [Marketplace reference](Morelord-Marketplace-Reference.pdf): README, documentation landing page, GM manual, and player manual.

The module PDFs are conversions of source documents, preserving their original version labels and content. Some manuals predate local module manifests. Historical manual claims are not newly validated release claims.

Matching [HTML fragments](../foundry-descriptions/README.md) can be copied directly into a Foundry listing editor. They are local copies; this repository no longer regenerates them from a markdown brand guide.

Compendium has no README or user guide in the reviewed folder. Historical release notes, architecture audits, development plans, and content-pack format references are outside this user/GM reference collection.

Regenerate the module manuals with `../../tools/build-reference-pdfs.py`, passing `--node` and `--marked` paths for the available Node runtime and marked package. The builder requires Python packages ReportLab, Pillow, and pypdf, and Windows Arial fonts. It reads each module README and manual that still lives in that module repository. `build-manifest.json` records the source inventory and output page counts. Re-render and visually review PDFs after regeneration.
