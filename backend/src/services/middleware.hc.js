import Ajv from "ajv";
import { ISandbox } from "../interfaces.js";
import { SystemEvent, Events } from "../types/system-event.js";
import { Problem } from "../types/problem.js";

/******** SCHEMAS ********/
import searchQueryParamSchema from "../schemas/search-query-params.json" with { type: "json" };
import producerSchema from "../schemas/producer.json" with { type: "json" };
import wineSchema from "../schemas/wine.json" with { type: "json" };

/**
 * @description Maps API endpoints names to their corresponding JSON Schema documents
 */
const RESOURCE_SCHEMA_MAP = Object.freeze({
  "/wines": wineSchema,
  "/producers": producerSchema
});

const ajv = new Ajv({allErrors: true});

/**
 * Validates a JSON object against a specified JSON Schema
 * @param {object} schema - a JSON Schema document to use for validation
 */
const validateWithSchema = ((schema) => {
  const validate = ajv.compile(schema);
  /**
   * @param params - a JSON object to validate against the `schema` argument
   */
  return (params) => {
    if (validate(params)) {
      return {
        isValid: true,
        errors: null
      };
    }
    return {
      isValid: false,
      errors: validate.errors
    }
  } 
});

export default class MiddlewareProvider {
  #cache;
  #dbClient;
  #logger;
  #resourceSchemaMap;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    this.#sandbox = sandbox;
    //this.#cache = sandbox.my.Cache;
    //this.#dbClient = sandbox.my.Database.getClient();
    this.#logger = sandbox.core.logger.getLoggerInstance();
  }

  Auth = {
    /**
     * Middleware validating an API key accompanying a client request
     * @param {Object} dbClient - an instance of the database client
     * @param {Object} logger - an instance of the logger client
     * @returns {function(res, req, next): void} - an ExpresJS middleware function
     */
    verify: async(req, res, next) => {
      try {
        const apiKey = req.headers["x-authorization"];

        if (!apiKey) {
          res.status(401);
          res.json([]);
          return;
        }

        const CURRENT_DATETIME_MILLIS = new Date().getTime();
        const { data, error } = await this.#dbClient
          .from("api_keys")
          .select()
          .eq("key", apiKey);

        const [record] = data;

        if (!record) {
          throw new Error("Missing or invalid authorization credential");
        }
        const CREDENTIAL_EXPIRY_DATETIME_MILLS = new Date(
          record.expiryDate
        ).getTime();

        if (CURRENT_DATETIME_MILLIS > CREDENTIAL_EXPIRY_DATETIME_MILLS) {
          res.status(401);
          res.json([]);
          return;
        }

        if (error || !Object.keys(record).includes("key")) {
          throw new Error(error.message);
        }

        next();
      } catch (ex) {
        this.#logger.error(
          `INTERNAL_ERROR (MiddlewareProvider.Auth): **EXCEPTION ENCOUNTERED while authenticating request on (${req.path}). See details -> ${ex.message}`
        );
        next(ex);
      }
    },
  };

  QueryService = {
    /**
     * Express middleware method for validating query parameters on a search request
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    validateSearchQueryParams: (req, res, next) => {
      try {
        const validateQuery = validateWithSchema(searchQueryParamSchema);
        const validationResult = validateQuery(req.query);
        if (validationResult.isValid) {
          next();
        } else {
          res.set("X-Total-Count", 1);
          res.status(400);
          res.json([
            Problem.of({
              title: "Could not validate query parameters. See problem detail.",
              detail: validationResult.errors,
            }),
          ]);
          return;
        }

      } catch(ex) {
        this.#logger.error(
          `INTERNAL_ERROR (MiddlewareProvider.QueryService): **EXCEPTION ENCOUNTERED** while validating query params on (${req.path}). See details -> ${ex.message}`
        );
        next(ex);
      }
    }
  };

  Telemetry = {
    /**
     * Application middleware that prepares runtime exceptions for storage in the database
     * @param {object} options
     * @param {string} options.service - name of the service that captured the exception
     * @param {Error} options.ex - the exception instance
     * @returns {object}
     */
    createExceptionEvent({ service, ex }) {
      return (new SystemEvent(Events.RUNTIME_EXCEPTION, {
        service,
        message: ex.message,
        stack: ex.stack,
      }));
    }
  };

  Validation = {
    validateRequestBody: (req, res, next) => {
      try {
        const validatePayload = validateWithSchema(RESOURCE_SCHEMA_MAP[req.path]);
        const validationResult = validatePayload(req.body);

        if (validationResult.isValid) {
          next();
        } else {
          res.set("X-Total-Count", 1);
          res.status(400);
          res.json([
            Problem.of({
              title: "Could not validate query parameters. See problem detail.",
              detail: validationResult.errors,
            }),
          ]);
          return;
        }

      } catch(ex) {
        this.#logger.error(
          `INTERNAL_ERROR (MiddlewareProvider.Validation): **EXCEPTION ENCOUNTERED** while validating request body on (${req.path}). See details -> ${ex.message}`
        );
        next(ex);
      }
    }
  }
}
