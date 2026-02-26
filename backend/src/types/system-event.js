import { randomUUID } from "node:crypto";

/******** EVENT IDENTIFIERS ********/

/**
 * @readonly
 * @enum {string}
 */
export const Events = Object.freeze({
  APP_INITIALIZED: "evt.system.app_initialized",
  // Indicates an application exception event has been captured
  RUNTIME_EXCEPTION: "evt.system.runtime_exception",
});

/**
 *
 */
class CustomEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type);
    this.detail = eventInitDict.detail || null;
  }
}

/**
 *
 */
export class SystemEvent {
  header = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    meta: { _open: { rel: null, type: null } },
    name: null,
  };
  payload;

  /**
   * @param {String} name
   * @param {Object} payload
   * @param {Object} metadata
   */
  constructor(name, payload = {}, metadata = {}) {
    this.header.meta = { ...metadata };
    this.header.name = name;
    this.payload = payload;

    return new CustomEvent(name, {
      detail: this,
    });
  }
}
