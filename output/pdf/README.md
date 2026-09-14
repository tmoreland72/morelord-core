# Morelord PDF reference library

Generated September 7, 2026 using the shared Morelord document style: Arial, US Letter, white pages, pale-blue table headers, muted running labels, and numbered pages.

- [Consolidated branding guide](Morelord-Branding-Guide-v2.2.pdf): identity, product inventory, UI contract, marketing copy, and governance for all eight reviewed Morelord folders.
- [Core reference](Morelord-Core-Reference.pdf): README and GM Product Guide.
- [Character Export reference](Morelord-Character-Export-Reference.pdf): README, usage, export format, and release instructions.
- [Craftworks reference](Morelord-Craftworks-Reference.pdf): README, User Guide, documentation landing page, GM manual, and player manual.
- [Downtime reference](Morelord-Downtime-Reference.pdf): current README, Sessions, Projects, and activity workflows.
- [Encounters reference](Morelord-Encounters-Reference.pdf): README, documentation landing page, and GM manual.
- [Journeys reference](Morelord-Journeys-Reference.pdf): README, documentation landing page, GM manual, player guide, and GM travel rules reference.
- [Marketplace reference](Morelord-Marketplace-Reference.pdf): README, documentation landing page, GM manual, and player manual.

The branding guide is updated and consolidated. The module PDFs are conversions of source documents, preserving their original version labels and content. Some manuals predate local module manifests, and the older Core GM guide lists Foundry 13; the branding guide records Core's current minimum 13 / verified 14 manifest values. Historical manual claims are not newly validated release claims.

Branding guide v2.2 uses a top-level Suite Copy section with module headings beneath it and regular body paragraphs throughout the copy. Each installed module has a literal Foundry HTML code block; matching [HTML fragments](../foundry-descriptions/README.md) can be copied directly into a listing editor. Use the builder's `--brand-only` option to refresh the guide and fragments without re-exporting module manuals.

Compendium has no README or user guide in the reviewed folder; its manifest-level role and compatibility are included in the branding guide. Historical release notes, architecture audits, development plans, and content-pack format references are outside this user/GM reference collection.

Edit `../../MORELORD-BRAND-GUIDE.md` for future brand changes. `../../MORELORD-MARKETING-BRANDING.md` is a compatibility redirect. Regenerate this library with `../../tools/build-reference-pdfs.py`, passing `--node` and `--marked` paths for the available Node runtime and marked package. The builder requires Python packages ReportLab, Pillow, and pypdf, and Windows Arial fonts. `build-manifest.json` records the complete source inventory and output page counts. Re-render and visually review PDFs after regeneration.
