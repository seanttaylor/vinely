/**
 * Safely resolves a JSON Pointer against an object.
 * Returns `undefined` if any part of the path is missing.
 *
 * @param {string} pointer - JSON Pointer string (e.g. "/a/b/c")
 * @returns {{ on: (obj: any) => any }}
 */
export function safeFind(pointer) {
  const parts = pointer === '/' || !pointer
    ? []
    : pointer
      .split('/')
      .slice(1)
      .map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));

  return {
    /**
     * @param {object} obj - the object to perform the safe lookup against
     */
    on(obj) {
      let current = obj;

      for (const part of parts) {
        if (current == null) return undefined;
        current = current[part];
      }

      return current;
    }
  };
}
