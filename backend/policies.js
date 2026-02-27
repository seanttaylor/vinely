
// Describes access control policies for application services.
export const policies =  {
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