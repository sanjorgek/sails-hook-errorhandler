module.exports = {
  unauthorized: function (model) {
    return "Unuathorized " + model
  },

  notFound: function (model) {
    return model + " not found"
  },

  invalid: function (model) {
    return "Can't process request due invalid " + model
  },

  conflict: function (model) {
    return "Conflict with " + model
  },

  forbidden: function (model) {
    return "Invalid authorization for " + model
  },

  serverError: function (codeString) {
    switch (codeString) {
      case "dataBaseError":
        return { icode: "01"}
      case "communicationError":
        return { errorString: "Communication error", icode: "02" }
      case "communicationUnexpectedStatus":
        return { errorString: "Communication Unexpected Status", icode: "03" }
      default:
        return { icode: "00" }
    }
  }
};
