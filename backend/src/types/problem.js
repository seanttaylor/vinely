/**
 * Represents an RFC 7807 Problem Details object.
 * Used to convey machine-readable error details in HTTP APIs.
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export class Problem {
  /**
   * @param {object} props
   * @param {string} [props.type="about:blank"] A URI reference that identifies the problem type.
   * When dereferenced, it should provide human-readable documentation.
   * @param {string} props.title A short, human-readable summary of the problem type.
   * Should remain stable across occurrences (except localization).
   * @param {number} [props.status]
   * The HTTP status code for this occurrence of the problem.
   * @param {string} [props.detail] A human-readable explanation specific to this occurrence.
   * @param {string} [instance] A URI reference identifying the specific occurrence of the problem.
   */
  constructor(props) {
    if (!props?.title) {
      throw new Error("Problem requires a title.");
    }

    this.type = props.type ?? "about:blank";
    this.title = props.title;
    this.status = props.status;
    this.detail = props.detail;
    this.instance = props.instance;

    Object.freeze(this);
  }

  /**
   * @param {ConstructorParameters<typeof Problem>[0]} props
   * @returns {Problem}
   */
  static of(props) {
    return new Problem(props);
  }
}
