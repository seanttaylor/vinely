import { ApplicationService } from "../../system.js";
import { SystemEvent, Events } from "../types/system-event.js";
import { Result } from "../types/result.js";
import { Problem } from "../types/problem.js";
import { resolveRef } from "ajv/dist/compile/index.js";

/**
 * Manages the vinely search pipeline end-to-end
 */
export default class QueryService extends ApplicationService {
  static service = "QueryService";
  static bootstrap = true;

  #isReady = false;
  #currentStrategy;
  #dbClient;
  #logger;
  #sandbox;
  #vocabularyMap;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();

    try {
      this.#sandbox = sandbox;
      this.#logger = sandbox.core.logger.getLoggerInstance();
      this.#dbClient = sandbox.my.Database.getClient();

      this.#loadVocabulary()
        .then(this.#buildLocalVocabularyMap)
        .then((vocabMap) => {
          this.#vocabularyMap = vocabMap;
          this.#isReady = true;
          console.log("Its ready!");
        })
        .catch((ex) => {
          // For exceptions that occur during the async vocabulary loading process
          this.#logger.log(
            `INTERNAL_ERROR (${QueryService.service}): **EXCEPTION ENCOUNTERED** while bootstrapping the search vocabulary. See details -> ${ex.message}`
          );
        });
    } catch (ex) {
      // For exceptions that occur while calling the constructor 
      this.#logger.log(
        `INTERNAL_ERROR (${QueryService.service}): **EXCEPTION ENCOUNTERED** while starting the service. See details -> ${ex.message}`
      );
    }
  }

  /**
   * Pulls the keywords and search phrases from the database for use in query processing
   * @returns {object}
   */
  async #loadVocabulary() {
    const { data: queryTerms, error: queryTermsLookupError } =
      await this.#dbClient.schema("vocabulary").from("terms").select();
    const { data: queryPhrases, error: queryPhrasesLookupError } =
      await this.#dbClient.schema("vocabulary").from("phrases").select();

    if (queryTermsLookupError || queryPhrasesLookupError) {
      throw new Error(
        `${
          queryTermsLookupError
            ? queryTermsLookupError.message
            : queryPhrasesLookupError.message
        }`
      );
    }

    return { queryTerms, queryPhrases };
  }

  /**
   * Creates a local map of search keywords and phrases for realtime translation to SQL queries
   * @param {object} vocabulary 
   * @returns {object}
   */
  #buildLocalVocabularyMap(vocabulary) {
    throw new Error("Could not build vocabulary map");
  }

  get ready() {
    return this.#isReady;
  }

  /**
   * Sets the search strategy to be used by the service (e.g. product_discovery or product_lookup)
   * @param {SearhStrategy} strategy
   */
  setStrategy(strategy) {
    this.#currentStrategy = strategy;
  }

  /**
   *
   * @param {String} queryString - the raw search query from the client
   * @returns {Result<Object | Problem>}
   */
  async search(queryString) {
    try {
      if (!this.#isReady) {
        return Result.error(Problem.of({
          title: "SERVICE UNAVAILABLE",
          detail: "There was an error executing the search query; the service is not ready."
        }));
      }
      return this.#currentStrategy.search(queryString);
    } catch (ex) {
      const exceptionEvent = new SystemEvent(Events.RUNTIME_EXCEPTION, {
        service: QueryService.service,
        message: ex.message,
        stack: ex.stack,
      });
      const exceptionId = exceptionEvent.detail.header.id;
      const logMessage = `INTERNAL_ERROR (${QueryService.service}): **EXCEPTION ENCOUNTERED** while executing a search query. This exception instance will be pushed to the 'telemetry.runtime_exceptions' table in the database with id (${exceptionId}). See details -> ${ex.message}`;
      const displayMessage =
        "There was an error while executing the search query.";

      console.error(logMessage);
      this.#sandbox.my.Events.dispatchEvent(exceptionEvent);
      return Result.error(
        Problem.of({
          title: "INTERNAL ERROR",
          detail: displayMessage,
          instance: `runtime_exceptions/query_serice/${exceptionId}`,
        })
      );
    }
  }
}
