/**
 * Platform Detection Utilities
 */

export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const isAndroidDevice = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const isMobileDevice = (): boolean => {
  return isIOSDevice() || isAndroidDevice();
};
