export function isAllowedParentOrigin(value) {
  try {
    const url = new URL(value);
    return (
      url.origin === value &&
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
