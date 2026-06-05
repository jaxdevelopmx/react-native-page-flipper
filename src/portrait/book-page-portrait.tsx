import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
    WithTimingConfig,
} from 'react-native-reanimated';
import type {
    GetPageStyle,
    OnPageFlip,
    Page,
    RenderPage,
    Size,
} from '../types';
import BackShadow from '../book-page/back-shadow';
import FrontShadow from '../book-page/front-shadow';
import PageShadow from '../book-page/page-shadow';
import { clamp, snapPoint } from '../utils/utils';

export type IBookPageProps<T = string> = {
    current: Page<T>;
    prev: Page<T>;
    onPageFlip: OnPageFlip;
    containerSize: Size;
    setIsAnimating: (val: boolean) => void;
    isAnimating: boolean;
    enabled: boolean;
    isPressable: boolean;
    getPageStyle: GetPageStyle;
    isAnimatingRef: React.MutableRefObject<boolean>;
    next: Page<T>;
    onFlipStart?: (id: number) => void;
    onPageDragStart?: () => void;
    onPageDrag?: () => void;
    onPageDragEnd?: () => void;
    renderPage?: RenderPage<T>;
};

export type PortraitBookInstance = { turnPage: (index: 1 | -1) => void };

const timingConfig: WithTimingConfig = {
    duration: 800,
    easing: Easing.inOut(Easing.cubic),
};

const BookPagePortraitInner = <T,>(
    {
        current,
        prev,
        onPageFlip,
        containerSize,
        enabled,
        isPressable,
        setIsAnimating,
        getPageStyle,
        isAnimating,
        isAnimatingRef,
        next,
        onFlipStart,
        onPageDrag,
        onPageDragEnd,
        onPageDragStart,
        renderPage,
    }: IBookPageProps<T>,
    ref: React.ForwardedRef<PortraitBookInstance>
) => {
    const containerWidth = containerSize.width;

    const pSnapPoints = !prev
        ? [-containerSize.width, 0]
        : [-containerSize.width, 0, containerSize.width];

    const x = useSharedValue(0);
    const startX = useSharedValue(0);

    const isMounted = useRef(false);
    const rotateYAsDeg = useSharedValue(0);

    // might not need this
    // useEffect(() => {
    //   if (!enabled) {
    //     setIsDragging(false);
    //   }
    // }, [enabled]);

    const turnPage = useCallback(
        (id: 1 | -1) => {
            setIsAnimating(true);
            if (onFlipStart && typeof onFlipStart === 'function') {
                onFlipStart(id);
            }
            const targetDegrees = id < 0 ? -180 : 180;
            rotateYAsDeg.value = withTiming(targetDegrees, timingConfig, () => {
                runOnJS(onPageFlip)(id, false);
            });
        },
        [onFlipStart, onPageFlip, rotateYAsDeg, setIsAnimating]
    );

    React.useImperativeHandle(
        ref,
        () => ({
            turnPage,
        }),
        [turnPage]
    );

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        rotateYAsDeg.value = 0;
        x.value = 0;
    }, [current, prev, next, rotateYAsDeg, x]);

    const getDegreesForX = (x: number) => {
        'worklet';

        const val = interpolate(
            x,
            [-containerSize.width, 0, containerSize.width],
            [180, 0, -180],
            Extrapolation.CLAMP
        );
        return val;
    };

    const containerStyle = useAnimatedStyle(() => {
        return {
            flex: 1,
        };
    });

    const gesturesEnabled = enabled && !isAnimating;

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .enabled(gesturesEnabled)
                .onBegin(() => {
                    startX.value = x.value;
                    if (
                        onPageDragStart &&
                        typeof onPageDragStart === 'function'
                    ) {
                        runOnJS(onPageDragStart)();
                    }
                })
                .onUpdate((event) => {
                    const newX = startX.value + event.translationX;
                    const degrees = getDegreesForX(newX);
                    x.value = newX;
                    rotateYAsDeg.value = degrees;
                    if (onPageDrag && typeof onPageDrag === 'function') {
                        runOnJS(onPageDrag)();
                    }
                })
                .onEnd((event) => {
                    if (onPageDragEnd && typeof onPageDragEnd === 'function') {
                        runOnJS(onPageDragEnd)();
                    }

                    const snapTo = snapPoint(
                        x.value,
                        event.velocityX,
                        pSnapPoints
                    );
                    const id = snapTo > 0 ? -1 : snapTo < 0 ? 1 : 0;

                    if (!next && id > 0) {
                        x.value = withTiming(0);
                        rotateYAsDeg.value = withTiming(0);
                        return;
                    }

                    const degrees = getDegreesForX(snapTo);
                    x.value = snapTo;
                    if (rotateYAsDeg.value === degrees) {
                        runOnJS(onPageFlip)(id, false);
                    } else {
                        runOnJS(setIsAnimating)(true);

                        const progress =
                            Math.abs(rotateYAsDeg.value - degrees) / 100;
                        const duration = clamp(
                            800 * progress - Math.abs(0.1 * event.velocityX),
                            350,
                            1000
                        );
                        rotateYAsDeg.value = withTiming(
                            degrees,
                            {
                                ...timingConfig,
                                duration: duration,
                            },
                            () => {
                                runOnJS(onPageFlip)(id, false);
                            }
                        );
                    }
                }),
        // Shared values and worklets are stable refs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            gesturesEnabled,
            containerSize.width,
            pSnapPoints,
            next,
            onPageDragStart,
            onPageDrag,
            onPageDragEnd,
            onPageFlip,
            setIsAnimating,
        ]
    );

    const iPageProps = {
        containerSize,
        containerWidth,
        getPageStyle,
        rotateYAsDeg,
        renderPage,
    };

    return (
        <Animated.View style={containerStyle}>
            <GestureDetector gesture={panGesture}>
                <Animated.View style={containerStyle}>
                    {isPressable && prev && (
                        <Pressable
                            disabled={isAnimating}
                            onPress={() => {
                                if (!isAnimatingRef.current) turnPage(-1);
                            }}
                            style={{
                                position: 'absolute',
                                height: '100%',
                                width: '25%',
                                zIndex: 10000,
                                left: 0,
                                // backgroundColor: 'red',
                                // opacity: 0.2,
                            }}
                        />
                    )}
                    {isPressable && next && (
                        <Pressable
                            disabled={isAnimating}
                            onPress={() => {
                                if (!isAnimatingRef.current) turnPage(1);
                            }}
                            style={{
                                position: 'absolute',
                                height: '100%',
                                width: '30%',
                                zIndex: 10000,
                                right: 0,
                                // backgroundColor: 'blue',
                                // opacity: 0.2,
                            }}
                        />
                    )}
                    {current && next ? (
                        <IPage page={current} right={true} {...iPageProps} />
                    ) : (
                        <View style={{ height: '100%', width: '100%' }}>
                            {renderPage && (
                                <View style={getPageStyle(true, true)}>
                                    {renderPage(current.right)}
                                </View>
                            )}
                        </View>
                    )}
                    {prev && (
                        <IPage page={prev} right={false} {...iPageProps} />
                    )}
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
};

const BookPagePortrait = React.forwardRef(BookPagePortraitInner) as <
    T = string
>(
    props: IBookPageProps<T> & { ref?: React.Ref<PortraitBookInstance> }
) => React.ReactElement | null;

type IPageProps<T = string> = {
    right: boolean;
    page: Page<T>;
    rotateYAsDeg: import('react-native-reanimated').SharedValue<number>;
    containerWidth: number;
    containerSize: Size;
    getPageStyle: GetPageStyle;
    renderPage?: RenderPage<T>;
};

const IPage = <T,>({
    right,
    page,
    rotateYAsDeg,
    containerWidth,
    containerSize,
    getPageStyle,
    renderPage,
}: IPageProps<T>) => {
    const rotationVal = useDerivedValue(() => {
        const val = right
            ? rotateYAsDeg.value
            : interpolate(rotateYAsDeg.value, [-180, 0], [0, 180]);
        return val;
    });

    const portraitBackStyle = useAnimatedStyle(() => {
        const x = interpolate(
            rotationVal.value,
            [0, 180],
            [containerWidth, -containerWidth / 2],
            Extrapolation.CLAMP
        );
        const w = interpolate(
            rotationVal.value,
            [0, 180],
            [0, containerWidth / 2],
            Extrapolation.CLAMP
        );

        return {
            width: Math.max(0, Math.ceil(w)),
            zIndex: 2,
            opacity: 1,
            transform: [{ translateX: x }],
        };
    });

    const portraitFrontStyle = useAnimatedStyle(() => {
        const w = interpolate(
            rotationVal.value,
            [0, 160],
            [containerWidth, -20],
            Extrapolation.CLAMP
        );

        const style: ViewStyle = {
            zIndex: 1,
            width: Math.max(0, Math.floor(w)),
        };

        if (!right) {
            style.left = 0;
        } else {
            // style['right'] = 0;
        }

        return style;
    });

    const frontPageStyle = getPageStyle(right, true);
    const backPageStyle = getPageStyle(right, false);
    const pageKey = page.left;

    const shadowProps = {
        right: true,
        degrees: rotationVal,
        width: containerSize.width,
        viewHeight: containerSize.height,
    };

    return (
        <View
            style={{
                ...StyleSheet.absoluteFillObject,
                zIndex: !right ? 5 : 0,
            }}
        >
            {/* BACK */}
            <Animated.View
                style={[
                    styles.pageContainer,
                    portraitBackStyle,
                    { overflow: 'visible' },
                ]}
            >
                <View style={styles.pageContainer}>
                    {renderPage && (
                        <Animated.View
                            key={`back-${pageKey}`}
                            style={[
                                backPageStyle,
                                {
                                    opacity: 1,
                                    transform: [
                                        { rotateX: '180deg' },
                                        { rotateZ: '180deg' },
                                    ],
                                },
                            ]}
                        >
                            {renderPage(page.left)}
                        </Animated.View>
                    )}
                </View>
                <BackShadow {...{ degrees: rotationVal, right: true }} />
                <FrontShadow {...shadowProps} />
                <PageShadow {...shadowProps} containerSize={containerSize} />
            </Animated.View>
            {/* FRONT */}
            <Animated.View style={[styles.pageContainer, portraitFrontStyle]}>
                {renderPage && (
                    <Animated.View
                        key={`front-${pageKey}`}
                        style={[frontPageStyle]}
                    >
                        {renderPage(page.left)}
                    </Animated.View>
                )}
            </Animated.View>
        </View>
    );
};

export { BookPagePortrait };

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pageContainer: {
        height: '100%',
        width: '100%',
        position: 'absolute',
        backfaceVisibility: 'hidden',
        overflow: 'hidden',
        backgroundColor: 'white',
        ...(Platform.OS === 'web'
            ? { transform: [{ perspective: 1000 }] }
            : null),
    },
});
