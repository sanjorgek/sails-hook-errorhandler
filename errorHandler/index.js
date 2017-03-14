/**
 * errorHandler hook
 */

module.exports = function (sails) {
  return {
    
    defaults: {
      messages: {
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
        },
      },

      defaults: {
        badRequest: { message: "Bad Request", code: "400-00"},

        conflict: { message: "Conflict with the data", code: "409"},

        forbidden: { message: "Forbidden action", code: "403"},

        invalid: { message: "Invalid params", code: "422"},

        missingArguments: { message: "Missing Arguments", code: "400-01"},

        notAcceptable: { message: "Invalid Content-Type", code: "406-00"},

        notFound: { message: "Route not found", code: "404"},

        notImplemented: { message: "Can't fulfill the request", code: "501-00"},

        serverError: { message: "Server Error", code: "500"},

        serviceUnavailable: { message: "Service Unavailable", code: "503-00"},

        unauthorized: { message: "Unauthorized", code: "401"},

        unsupportedMediaType: { message: "Invalid Content-Type", code: "415-00"}
      }
    },

    //configure: function(){},

    //routes: {
      //before: {},
      //after: {},
    //}
    
    // Run when sails loads-- be sure and call `next()`.
    initialize: function (next) {
      sails.after(["hook:orm:loaded", "hook:policies:loaded"], function(){
        sails.errorhandler = {
          create: function (codeString, detailedInfo) {
            var errorCreated = new Error();
            errorCreated.codeString = codeString;
            errorCreated.detailedInfo = detailedInfo;

            if(codeString === "serverError"){
              log.error("SERVER ERROR:: " + detailedInfo);
            }

            return errorCreated;
          },

          compose: function (error) {
            var modelErrors = /^(unauthorized|notFound|invalid|conflict|forbidden)(.*)$/;
            var soloErrors = /^(badRequest|missingArguments|notAcceptable|notImplemented|serviceUnavailable|unsupportedMediaType)$/;
            var serverError = /^(dataBaseError|communicationUnexpectedStatus|communicationError|serverError)$/;

            // Error related to model
            var matchModels = modelErrors.exec(error.codeString);
            if (matchModels) {
              var response = matchModels[1];
              var model = matchModels[2];
              var isDefaultResponse = model == '';
              var message = isDefaultResponse? null : internalErrors.messages[response](model);
              var code = isDefaultResponse? '00' : internalErrors.modelCodes[model];

              return {
                codeString: response,
                errorString: message,
                icode: code,
                detailedInfo: error.detailedInfo
              }
            }

            // Error not realated to model
            var matchSolo = soloErrors.exec(error.codeString);
            if (matchSolo) {
              return error;
            }

            // Error realted to server
            var matchServer = serverError.exec(error.codeString);
            var partialError = internalErrors.messages.serverError(error.codeString);
            partialError.detailedInfo = error.detailedInfo;
            partialError.codeString = "serverError";

            // Error did not match responses
            if (!matchServer) {
              log.error(error.codeString + " not found in ErrorHandler");
            }

            return partialError;
          },

          buildError: function (error) {
            var defaultError = internalErrors.defaults[error.codeString];
            var json = { error: {
                code: defaultError.code,
                message: error.errorString? error.errorString : defaultError.message,
                detailedInfo: error.detailedInfo
              }
            }

            if (error.icode) {
              json.error.code += "-" + error.icode;
            }

            return json;
          },

          respond: function (error, res) {
            var responseError = sails.services.errorhandler.compose(error);
            var response = res[responseError.codeString];

            if (!response) {
              log.error(responseError.codeString + " not found. Returning default error");
              return res.serverError("Default option code string");
            }

            log.error("RAISED: " + error.codeString + ". Details: " + JSON.stringify(error.detailedInfo));
            var properError = sails.services.errorhandler.buildError(responseError);
            return response(properError);
          }
        }
        return next();
      });
    }

  };
};
