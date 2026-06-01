import type { BannerItem, BannerType } from '../types';

export const bannerState = $state({
  items: [] as BannerItem[],
});

export function showBanner(type: BannerType, message: string, duration = 4500): string {
  const id = crypto.randomUUID();
  bannerState.items.push({ id, type, message });

  if (duration > 0) {
    setTimeout(() => dismissBanner(id), duration);
  }
  return id;
}

export function dismissBanner(id: string): void {
  const idx = bannerState.items.findIndex((b) => b.id === id);
  if (idx !== -1) bannerState.items.splice(idx, 1);
}
