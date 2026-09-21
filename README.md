# PhotoStamp Foundation

Implement Phase 1 of PhotoStamp now. Use internal planning and do not present another implementation plan for user approval.

PROJECT OVERVIEW
PhotoStamp: A focused, privacy-friendly Android utility app (built with web tech / Capacitor wrapper) that reads capture dates from photos and burns customizable date/time stamps onto them in batches. No accounts, login, ads, cloud sync, or monetization.

PHASE 1 SCOPE — Foundation, Picker & Batch UI:
1. Capacitor configuration and Android permissions setup:
   - Configure permissions structure for Android gallery read (READ_MEDIA_IMAGES for Android 13+ with fallback for older Android versions) and storage write access.
   - Implement an on-brand permission rationale screen that clearly explains why gallery access is needed before prompting the user.
2. Home Screen:
   - Modern, premium empty-state UI prompting the user to select photos.
   - Multi-select photo picker supporting both native Capacitor gallery selection when running in a native shell and HTML5 file picker (multiple images) for web/preview testing.
3. Batch Selection Screen:
   - Clean grid view of all selected images with thumbnail previews and badge indicators (e.g. "Ready" / "Date needed").
   - Ability to remove individual photos from the batch, clear all, or add more photos.
   - Action bar with photo count and "Continue to Customize" action.
4. Navigation Shell:
   - Connect the full flow: Home → Batch Selection → Edit/Preview (Phase 2 placeholder) → Success (Phase 3 placeholder).
   - Keep Phase 2 & 3 stamping and saving logic out of this phase.
5. Design Language:
   - Modern, premium, minimal utility aesthetic.
   - Dark mode as default with light mode toggle support.
   - Generous whitespace, clean typography, confident accent color, rounded corners, subtle glassmorphism/borders, and lightweight transitions.

NOTE: Do not build Phase 2 (EXIF extraction / stamping customization) or Phase 3 (saving / album writing) yet. Strict Phase 1 scope only.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stamp-my-moments.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1f399373-3eba-4be3-8a27-4d4531c445ca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
