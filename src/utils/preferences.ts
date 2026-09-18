export function preference(key: string, fallback: string) {
  try {
    return localStorage.getItem(`bbw:${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}
export function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(`bbw:${key}`, value);
  } catch {
    /* Storage is optional. */
  }
}
