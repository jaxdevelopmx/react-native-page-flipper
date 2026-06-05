# Changelog

## 1.0.2

### Fixed

- `ERR_PNPM_PREPARE_PACKAGE` on GitHub installs (`prepare` no longer runs `bob build` in consumer projects)
- Worklets version mismatch when consumed with Reanimated 4 (ship `react-native` source entry; bob build no longer stamps worklet plugin version)

### Added

- Generic `PageFlipper<T>` support for typed `data` and `renderPage`
- `prefetchPage` prop with automatic adjacent-page warm-up for string URLs
- Exported `PrefetchPage`, `PageFlipDirection`, and related TypeScript types with JSDoc

### Changed

- Migrated gestures to `GestureDetector` + `Gesture.Pan()` for Reanimated 4 compatibility
- Removed portrait remount keys and the delayed `loaded` hack to reduce image flicker
- Memoized `getPageStyle` and reset animation state when pages change
- Updated TypeScript to 5.9 and modernized `tsconfig`
- README now documents `pnpm`, Reanimated 4, and `expo-image` usage

### Fixed

- Transform type errors in `FrontShadow` and `utils.transformOrigin`
- Portrait back-face opacity causing visible flicker during flips
- Landscape page remounts on every index change
