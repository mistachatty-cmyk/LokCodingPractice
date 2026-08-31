type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

export type LiveStudioAccuracyBucket = '0_79' | '80_94' | '95_100';

export function accuracyBucket(accuracy: number): LiveStudioAccuracyBucket {
  if (accuracy >= 95) return '95_100';
  if (accuracy >= 80) return '80_94';
  return '0_79';
}

export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === 'undefined') return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never break the app.
  }
}