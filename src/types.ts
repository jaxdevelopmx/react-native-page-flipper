import type React from 'react';
import type { ViewStyle } from 'react-native';

/** Width and height used to calculate the viewer aspect ratio. */
export type Size = {
    height: number;
    width: number;
};

/** A spread page with left and right page content. */
export type Page<T = string> = {
    left: T;
    right: T;
};

/** Direction passed to flip callbacks: previous (-1), none (0), or next (1). */
export type PageFlipDirection = -1 | 0 | 1;

/** Called when a page flip animation completes or is cancelled. */
export type OnPageFlip = (
    direction: PageFlipDirection,
    animated: boolean
) => void;

/** Resolves layout styles for a page face. */
export type GetPageStyle = (right: boolean, front: boolean) => ViewStyle;

/** Renders a single page item from `data`. */
export type RenderPage<T = string> = (data: T) => React.ReactNode;

/** Props accepted by a custom container wrapper. */
export type PageFlipperContainerProps = React.PropsWithChildren;

/** Payload emitted once pages are initialized. */
export type PageFlipperInitializedPayload<T = string> = {
    pages: Page<T>[];
    index: number;
};

/** Optional hook to warm up upcoming page assets. */
export type PrefetchPage<T = string> = (data: T) => void | Promise<void>;
