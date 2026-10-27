# Windows and release-package validation

The repository's `Source and release-package checks` GitHub Actions workflow runs
on Windows, macOS and Linux after push, and can also be started manually. It runs
the unit tests and syntax checks, builds the ZIP, extracts it, and checks the
extracted package's imports, assets, locales and path portability. This is **not a
native Chrome UI or screenshot-permission test**. A green job alone does not
establish that Windows graphics, input or capture permissions work correctly.

## Native Windows acceptance check

Use a separate Chrome profile and the extracted release ZIP. Keep only one
TabGrid installation enabled in that test profile; loading a different folder
can create another extension identity with separate settings and preview data.

1. Load the folder containing `manifest.json` through **Load unpacked** at
   `chrome://extensions`. Confirm that TabGrid reports no service-worker errors.
2. Open two ordinary HTTPS pages. Visit each, allow it to finish loading, then
   click the pinned TabGrid icon. Confirm the grid opens and its preview matches
   the page. Repeat immediately after an automatic capture and after Chrome has
   been idle long enough for the extension worker to stop.
3. Repeat with New Tab and a Chrome settings page using the pinned icon. Directly
   switching into an existing TabGrid tab does not create the initial `activeTab`
   grant required for restricted pages.
4. Reload the extension, refresh the ordinary test pages, then repeat capture.
   Test an empty profile separately from a profile with stored previews and a
   custom background. Do not delete the user's existing profile or settings.
5. Test Classic, Flat and Glassmorphism in light and dark mode, with and without
   wallpaper. Check window tint differences, Recently closed captions, menu and
   dialog closing, Undo, drag reorder, and keyboard focus. Also test Windows
   reduced-motion and GPU-unavailable fallback rendering.
6. Close a test tab and Undo it. The previous tab/group highlight must remain,
   and TabGrid entries from older installations must be absent from TabGrid's
   Recently closed list. Chrome's own restore history remains untouched.

## Evidence on 2026-10-26

Only macOS is available in the current workspace; no Windows VM or remote Windows
session was available. The cross-platform workflow is included for hosted validation. Its automated
checks do not replace native Windows acceptance, which remains outstanding.
See `docs/verification.md` and the GitHub Actions run for completed checks.
