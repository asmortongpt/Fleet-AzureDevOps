// Artillery processor for custom hooks and functions

module.exports = {
  setup(context, ee, next) {
    console.log('Load test starting');
    context.vars.testStartTime = Date.now();
    return next();
  },

  teardown(context, ee, next) {
    console.log('Load test ending');
    return next();
  },

  // Custom function to generate random user ID
  randomUserId(context, ee, next) {
    context.vars.userId = Math.floor(Math.random() * 10000);
    return next();
  },

  // Track response times
  beforeRequest(requestParams, context, ee, next) {
    requestParams.headers['X-Test-ID'] = context.vars.userId || 'anonymous';
    requestParams.headers['X-Request-Time'] = Date.now();
    return next();
  },

  // Log slow requests
  afterResponse(requestParams, response, context, ee, next) {
    if (response.statusCode !== 200) {
      console.log(`[${response.statusCode}] ${requestParams.url}`);
    }

    if (response.responseTime > 1000) {
      console.log(
        `[SLOW] ${requestParams.url} took ${response.responseTime}ms`
      );
    }

    return next();
  },
};
