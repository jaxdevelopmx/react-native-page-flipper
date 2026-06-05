# react-native-page-flipper

Page curl / book flip effect for React Native. Works on **iOS**, **Android**, and **Web**.

[Live demo](https://chris24elias.github.io/react-native-page-flipper/)

## Requirements

- React Native >= 0.70
- `react-native-gesture-handler` >= 2
- `react-native-reanimated` >= 3 or **4**
- `react-native-linear-gradient` (native shadows)
- `expo-linear-gradient` (web shadows)

For **Reanimated 4**, also install `react-native-worklets` in your app if your setup requires it.

## Installation

```sh
pnpm add react-native-page-flipper
pnpm add react-native-gesture-handler react-native-reanimated react-native-linear-gradient
```

Expo / Web:

```sh
pnpm add expo-linear-gradient
```

### Install from GitHub

```sh
pnpm add github:jaxdevelopmx/react-native-page-flipper
```

Git installs use the `src/` entry (`react-native` field). No build step runs in your project.

### Local development (monorepo / link)

```json
{
  "dependencies": {
    "react-native-page-flipper": "link:../react-native-page-flipper"
  }
}
```

If the package lives outside your app root, configure Metro `watchFolders` for the linked path.

### Reanimated setup

```js
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

```tsx
// App entry
import 'react-native-gesture-handler';
```

Wrap your app with `GestureHandlerRootView` when using React Native CLI.

### Worklets version mismatch

If you see `Mismatch between JavaScript code version and Worklets Babel plugin version`, ensure:

1. `react-native-worklets` matches the version required by your `react-native-reanimated` install
2. `react-native-reanimated/plugin` is the **last** entry in your app's `babel.config.js`
3. Restart Metro with cache cleared: `npx expo start --clear`

This package ships source via the `react-native` field so Metro compiles worklets with **your** app's Babel plugins.

## Usage

```tsx
import React from 'react';
import { Image } from 'expo-image';
import PageFlipper from 'react-native-page-flipper';

const PAGES = [
  'https://example.com/page-1.jpg',
  'https://example.com/page-2.jpg',
];

export default function Reader() {
  return (
    <PageFlipper
      data={PAGES}
      portrait
      singleImageMode
      pageSize={{ width: 210, height: 334 }}
      contentContainerStyle={{ flex: 1 }}
      renderPage={(uri) => (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
        />
      )}
      onFlippedEnd={(index) => console.log('page', index)}
    />
  );
}
```

### Generic data

```tsx
type Slide = { id: string; imageUrl: string };

<PageFlipper<Slide>
  data={slides}
  renderPage={(slide) => (
    <Image source={{ uri: slide.imageUrl }} style={{ flex: 1 }} />
  )}
  prefetchPage={(slide) => Image.prefetch(slide.imageUrl)}
/>
```

### Imperative API

```tsx
const ref = useRef<PageFlipperInstance>(null);

ref.current?.nextPage();
ref.current?.previousPage();
ref.current?.goToPage(3);
```

## Image flicker tips

- Use `expo-image` or `react-native-fast-image`
- Set `transition={0}` on `expo-image`
- Provide `prefetchPage` for custom asset types
- The library already prefetches adjacent pages for string URLs

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Items to paginate |
| `renderPage` | `(item: T) => ReactNode` | — | Renderer for each page |
| `prefetchPage` | `(item: T) => void \| Promise<void>` | auto for strings | Warm-up hook for next/prev assets |
| `pageSize` | `{ width, height }` | required | Aspect ratio reference |
| `contentContainerStyle` | `ViewStyle` | — | Outer container style |
| `portrait` | `boolean` | `false` | Single-page portrait mode |
| `singleImageMode` | `boolean` | `true` | One item per page |
| `enabled` | `boolean` | `true` | Drag gestures |
| `pressable` | `boolean` | `true` | Tap edges to flip |
| `renderLastPage` | `() => ReactElement` | — | Custom last page (landscape) |
| `renderContainer` | `ComponentType` | — | Custom wrapper |
| `onFlippedEnd` | `(index) => void` | — | Flip completed |
| `onFlipStart` | `(id) => void` | — | Programmatic flip started |
| `onPageDragStart` | `() => void` | — | User started dragging |
| `onPageDrag` | `() => void` | — | Drag in progress |
| `onPageDragEnd` | `() => void` | — | Drag ended |
| `onInitialized` | `({ pages, index }) => void` | — | Ready callback |
| `onEndReached` | `() => void` | — | Last page reached |

## Scripts (library repo)

```sh
pnpm install
pnpm prepare    # build lib/*
pnpm typescript
pnpm lint
```

## Example app

The legacy `exampleExpo/` app targets an older Expo SDK. Prefer integrating the package directly in your own Expo app.

## License

MIT
