# Unreleased

Target: 0.9.1

## What Changed

### Fixed

- Closing a Morelord window before its saved position is restored no longer leaves that window on the page. The restore waits one frame, then does nothing unless the window is still rendered and its element is still connected. A dialog that closes during that frame can finish closing.

## Verification

`test/window-geometry-service.test.mjs` covers a null element, a window that is no longer rendered, and an element that is no longer connected when the restore frame runs. A window that is still rendered and connected is still repositioned. `npm test` and `npm run check:design-system` pass. Live Foundry verification is still outstanding.
