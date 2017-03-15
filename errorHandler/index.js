/**
 * errorHandler hook
 */

var defaults = require('./defaults');

var messages = require('./messages');

module.exports = function (sails) {
  return {
    
    //defaults: {},

    configure: function(){
      if(!sails.config.errorhandler){
        sails.config.errorhandler = {
          messages: messages,

          defaults: defaults
        }
      }
      if(sails.config.errorhandler.modelCodes){
        sails.config.errorhandler.messages = messages;

        sails.config.errorhandler.defaults= defaults;
      }
    },

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
              sails.log.error('services:errorHandler', "SERVER ERROR:: " + detailedInfo);
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
              var message = isDefaultResponse? null : sails.config.errorhandler.messages[response](model);
              var code = isDefaultResponse? '00' : sails.config.errorhandler.modelCodes[model];

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
            var partialError = sails.config.errorhandler.messages.serverError(error.codeString);
            partialError.detailedInfo = error.detailedInfo;
            partialError.codeString = "serverError";

            // Error did not match responses
            if (!matchServer) {
              sails.log.error('services:errorHandler', error.codeString + " not found in ErrorHandler");
            }

            return partialError;
          },

          buildError: function (error) {
            var defaultError = sails.config.errorhandler.defaults[error.codeString];
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
            var responseError = sails.errorhandler.compose(error);
            var response = res[responseError.codeString];

            if (!response) {
              sails.log.error('services:errorHandler', responseError.codeString + " not found. Returning default error");
              return res.serverError("Default option code string");
            }

            sails.log.error('services:errorHandler', "RAISED: " + error.codeString + ". Details: " + JSON.stringify(error.detailedInfo));
            var properError = sails.errorhandler.buildError(responseError);
            return response(properError);
          }
        }
        return next();
      });
    }

  };
};
