export class ApplicationService {
  constructor() {}

  get status() {
    return {
      name: this.constructor.name,
      timestamp: new Date().toISOString(),
    };
  }
}

export const getTime = (unit, amount) => {
  return {
    from(ts) {
      if (typeof ts !== "number") {
        throw new Error("from() expects a UNIX timestamp (ms)");
      }

      const fixed = {
        seconds: 1000,
        minutes: 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000
      };

      // Fixed-duration units
      if (unit in fixed) {
        return ts + fixed[unit] * amount;
      }

      // Calendar units
      const d = new Date(ts);

      switch (unit) {
        case "months":
          d.setUTCMonth(d.getUTCMonth() + amount);
          break;

        case "years":
          d.setUTCFullYear(d.getUTCFullYear() + amount);
          break;

        default:
          throw new Error(`Unsupported unit: ${unit}`);
      }

      return d.getTime();
    },

    fromNow() {
      return this.from(Date.now());
    }
  };
}

