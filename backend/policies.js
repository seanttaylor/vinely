// Describes access control policies for application services.
export const policies = {
  Database: {
    allowedAPIs: ["Config"],
  },
  HTTPService: {
    allowedAPIs: ["Config", "RouteService"],
  },
  QueryService: {
    allowedAPIs: ["Database", "Events", "MiddlewareProvider"],
  },
  RouteService: {
    allowedAPIs: [
      "Events",
      "MiddlewareProvider",
      "ProducerService",
      "QueryService",
      "TaskService",
      "WineService",
    ],
  },
  NOOPService: {
    allowedAPIs: ["WineService"],
  },
};
