module.exports = {
  badRequest: { message: "Bad Request", code: "400"},

  conflict: { message: "Conflict with the data", code: "409"},

  forbidden: { message: "Forbidden action", code: "403"},

  invalid: { message: "Invalid params", code: "422"},

  missingArguments: { message: "Missing Arguments", code: "400", icode:"01"},

  notAcceptable: { message: "Invalid Content-Type", code: "406"},

  notFound: { message: "Route not found", code: "404"},

  notImplemented: { message: "Can't fulfill the request", code: "501"},

  serverError: { message: "Server Error", code: "500"},

  serviceUnavailable: { message: "Service Unavailable", code: "503"},

  unauthorized: { message: "Unauthorized", code: "401"},

  unsupportedMediaType: { message: "Invalid Content-Type", code: "415"}
};
