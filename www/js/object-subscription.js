/**
 * @typedef {Object} ChangeObject
 * @property {string} path - The JSON Pointer path to the property that was changed.
 * @property {string} property - The name of the property that was changed.
 * @property {number} time - The timestamp (in milliseconds since the epoch) when the change occurred.
 * @property {"add"|"update"|"delete"} type - The type of change that occurred (add, update, or delete).
 * @property {Object} value - The value before and after the change.
 * @property {*} value.new - The new value of the property (can be any type).
 * @property {*} value.old - The old value of the property (can be any type).
 * @property {Object} self - the entire current state of the object
 */

const registry = new WeakMap();

export class ObjectSubscription {
  /**
   * @param {Function} callback
   * @param {Object} target
   * @param {string} [pointerPath]
   */
  constructor(callback, target, pointerPath) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }

    if (typeof target !== 'object' || target === null) {
      throw new Error('target must be an object');
    }

    if (pointerPath && typeof pointerPath !== 'string') {
      throw new Error('pointerPath must be a string');
    }

    // 🔥 Get or create reactive context
    let ctx = registry.get(target);

    if (!ctx) {
      ctx = this.#createContext(target);
      registry.set(target, ctx);
    }

    // Register subscriber
    const sub = { callback, pointerPath };
    ctx.subscribers.add(sub);

    // Expose unsubscribe
    this.unsubscribe = () => {
      ctx.subscribers.delete(sub);
    };

    return ctx.proxy;
  }

  #createContext(root) {
    const subscribers = new Set();

    const notify = (change) => {
      for (const sub of subscribers) {
        if (!sub.pointerPath || change.path.startsWith(sub.pointerPath)) {
          sub.callback(change);
        }
      }
    };

    const toJsonPointer = (pathArray) =>
      '/' +
      pathArray
        .map((s) => s.toString().replace(/~/g, '~0').replace(/\//g, '~1'))
        .join('/');

    const wrap = (target, path = []) => {
      return new Proxy(target, {
        set(obj, prop, value) {
          const operation = prop in obj ? 'update' : 'add';
          const oldValue = obj[prop];
          const pointer = toJsonPointer([...path, prop]);

          if (typeof value === 'object' && value !== null) {
            value = wrap(value, [...path, prop]);
          }

          obj[prop] = value;

          notify({
            path: pointer,
            property: prop,
            time: Date.now(),
            type: operation,
            value: { old: oldValue, new: value },
            self: { ...root },
          });

          return true;
        },

        deleteProperty(obj, prop) {
          if (!(prop in obj)) return false;

          const oldValue = obj[prop];
          const pointer = toJsonPointer([...path, prop]);

          delete obj[prop];

          notify({
            path: pointer,
            property: prop,
            time: Date.now(),
            type: 'delete',
            value: { old: oldValue, new: undefined },
            self: { ...root },
          });

          return true;
        },

        get(obj, prop) {
          const value = obj[prop];
          return typeof value === 'object' && value !== null
            ? wrap(value, [...path, prop])
            : value;
        },
      });
    };

    return {
      proxy: wrap(root),
      subscribers,
    };
  }
}
