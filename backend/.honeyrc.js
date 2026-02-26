export default {
  services: {
    // Relative path Honeycomb should search for application services
    dir: "./src/services",
    // Glob pattern(s) for files containing service definitions relative to `service.dir`
    patterns: ["**/*.hc.js"],
  },
};
