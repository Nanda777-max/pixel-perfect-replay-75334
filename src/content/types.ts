export type ContentStatus = 'ready' | 'placeholder';
export interface ContentSection { status: ContentStatus; text: string }
export interface PlaceholderItem { status: ContentStatus; title: string; author: string; image: string | null }
export const isReady = (item: { title: string }) => item.title.trim().length > 0;