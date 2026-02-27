/**
 * @typedef {object} IEventHeader
 * @property {object} meta - metadata associated with the event
 * @property {object} meta._open - unstructured data that can arbitrarily be packaged with event;
 * this field should be considered **VOLATILE** and may or **MAY NOT** be present on any or all events
 * @property {string} id - unique identifier for the event
 * @property {string} name - name of the event
 * @property {string} timestamp - timestamp when the event was generated
 */

/**
 * @template T
 * @typedef {object} IEvent
 * @property {IEventHeader} header - header information of the event
 * @property {T} payload - payload of the event
 */

/**
 * @type {IEvent}
 */
export const IEvent = Object.freeze({});

/**
 * @typedef {object} Core
 * @property {function(): string} generateUUID - A method to generate a UUID string
 */


/**
 * @typedef {Object} IServices
 * @property {EventTarget} Events
 * @property {Object} HTTPService
 * @property {Object} Config
 * @property {Object} NOOPService
 */

/**
 * @typedef {object} ISandbox
 * @property {IServices} my - A namespace for custom user-defined functionalities
 * @property {Core} core - The core functionalities of the sandbox environment
 * @property {function(EventType, EventListener): void} addEventListener - Method to add an event listener, bound to the context of the original object
 * @property {function(EventType, EventListener): void} removeEventListener - Method to remove an event listener, bound to the context of the original object
 * @property {function(Event): boolean} dispatchEvent - Method to dispatch an event, bound to the context of the original object
 */

/**
 * @type {ISandbox}
 * @description A sandbox environment object which encapsulates the core functionalities along with event handling methods
 */
export const ISandbox = Object.freeze({
  my: {},
  core: {},
});

/**
 * @typedef {object} DataAccessLayer
 * @property {function(): object} getDbClient - fetches a client for data access
 */

/**
 * @type {DataAccessLayer}
 * @description - API for all data access regardless of implementation
 */
export const IDataAccessLayer = Object.freeze({});

/**
 * Represents an RFC 7807 Problem Details object.
 *
 * Used to convey machine-readable error details in HTTP APIs.
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 *
 * @typedef {Object} ProblemDetails
 *
 * @property {string} [type="about:blank"]
 * A URI reference that identifies the problem type.
 * When dereferenced, it should provide human-readable documentation.
 *
 * @property {string} title
 * A short, human-readable summary of the problem type.
 * Should remain stable across occurrences (except localization).
 *
 * @property {number} [status]
 * The HTTP status code for this occurrence of the problem.
 *
 * @property {string} [detail]
 * A human-readable explanation specific to this occurrence.
 *
 * @property {string} [instance]
 * A URI reference identifying the specific occurrence of the problem.
 */

/**
 * @type {ProblemDetails}
 * @description - interface for documenting error details in HTTP APIs
 */
export const IProblemDetails = Object.freeze({});
