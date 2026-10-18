export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8) + Date.now().toString(36).slice(-4)
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
