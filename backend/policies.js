
// Describes access control policies for application services.
export const policies =  {
  Database: {
    allowedAPIs: ["Config"]
  },
  HTTPService: {
    allowedAPIs: ["Config", "RouteService"]
  },
  QueryService: {
    allowedAPIs: ["Events"]
  },
  RouteService: {
    allowedAPIs: ["Events", "QueryService"]
  }
};