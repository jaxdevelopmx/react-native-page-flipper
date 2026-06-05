import { useEffect } from 'react';
import { Image } from 'react-native';
import type { Page, PrefetchPage } from '../types';

const hasPageValue = <T>(value: T | undefined | null): value is T => {
    if (value === undefined || value === null) {
        return false;
    }

    if (typeof value === 'string') {
        return value.length > 0;
    }

    return true;
};

export const collectPageValues = <T>(pages: (Page<T> | undefined)[]): T[] => {
    const values: T[] = [];

    for (const page of pages) {
        if (!page) {
            continue;
        }

        if (hasPageValue(page.left)) {
            values.push(page.left);
        }

        if (hasPageValue(page.right) && page.right !== page.left) {
            values.push(page.right);
        }
    }

    return values;
};

export const defaultPrefetchPage = (data: unknown): void => {
    if (typeof data !== 'string') {
        return;
    }

    const uri = data.trim();

    if (
        !uri ||
        (!uri.startsWith('http') &&
            !uri.startsWith('file') &&
            !uri.startsWith('data:'))
    ) {
        return;
    }

    void Image.prefetch(uri).catch(() => undefined);
};

type UseAdjacentPagePrefetchOptions<T> = {
    prev?: Page<T>;
    current?: Page<T>;
    next?: Page<T>;
    data: T[];
    pageIndex: number;
    prefetchPage?: PrefetchPage<T>;
};

export const useAdjacentPagePrefetch = <T>({
    prev,
    current,
    next,
    data,
    pageIndex,
    prefetchPage,
}: UseAdjacentPagePrefetchOptions<T>) => {
    useEffect(() => {
        const prefetch = prefetchPage ?? defaultPrefetchPage;
        const visible = collectPageValues([prev, current, next]);
        const nearby = [
            data[pageIndex - 2],
            data[pageIndex - 1],
            data[pageIndex + 1],
            data[pageIndex + 2],
        ].filter((item): item is T => item !== undefined);

        const unique = new Set<T>([...visible, ...nearby]);

        unique.forEach((item) => {
            void Promise.resolve(prefetch(item)).catch(() => undefined);
        });
    }, [prev, current, next, data, pageIndex, prefetchPage]);
};
