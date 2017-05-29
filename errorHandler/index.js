/**
 * errorHandler hook
 */
 var defaults = require("./defaults");
 var messages = require("./messages");
/* uses lodash from sails */
/*global _*/

module.exports = function (sails) {
  return {

    //defaults: {},

    configure: function(){
      _.extend(sails.config.errorhandler, {});
      // explore config
      var defaultConfig = {
        messages: messages,
        defaults: defaults,
        modelErrors: /^(unauthorized|notFound|invalid|conflict|forbidden)(.*)$/,
        soloErrors: /^(badRequest|missingArguments|notAcceptable|notImplemented|serviceUnavailable|unsupportedMediaType)$/,
        serverError: /^(dataBaseError|communicationUnexpectedStatus|communicationError|serverError)$/
      };

      _.keys(defaultConfig).forEach(function (k) {
        if (!sails.config.errorhandler[k]) {
          sails.config.errorhandler[k] = defaultConfig[k];
        }
      });
      // overwrite from config
      _.extend(messages, sails.config.errorhandler.messages);
      _.extend(defaults, sails.config.errorhandler.defaults);
      // add config
      _.extend(sails.config.errorhandler.messages, messages);
      _.extend(sails.config.errorhandler.defaults, defaults);
    },

    //routes: {
      //before: {},
      //after: {},
    //}

    // Run when sails loads-- be sure and call `next()`.
    initialize: function (next) {
      sails.after(["hook:policies:loaded"], function(){
        sails.errorhandler = {
          create: function (codeString, detailedInfo) {
            var errorCreated = new Error();
            errorCreated.codeString = codeString;
            errorCreated.detailedInfo = detailedInfo;

            return errorCreated;
          },

          compose: function (error) {
            // Error related to model
            var matchModels = sails.config.errorhandler.modelErrors.exec(error.codeString);
            if (matchModels) {
              var response = matchModels[1];
              var model = matchModels[2];
              var isDefaultResponse = model === "";
              var message = isDefaultResponse? null : sails.config.errorhandler.messages[response](model);
              var code = isDefaultResponse? "00" : sails.config.errorhandler.modelCodes[model];

              return {
                codeString: response,
                errorString: message,
                icode: code,
                detailedInfo: error.detailedInfo
              }
            }

            // Error not realated to model
            var matchSolo = sails.config.errorhandler.soloErrors.exec(error.codeString);
            if (matchSolo) {
              return error;
            }

            // Error realted to server
            var matchServer = sails.config.errorhandler.serverError.exec(error.codeString);
            var partialError = sails.config.errorhandler.messages.serverError(error.codeString);
            partialError.detailedInfo = error.detailedInfo;
            partialError.codeString = "serverError";

            return partialError;
          },

          buildError: function (error) {
            var defaultError = sails.config.errorhandler.defaults[error.codeString];
            if (!defaultError) {
              defaultError = {
                code: "500",
                message: "Default error"
              };
            }

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
              return res.serverError("Default option code string");
            }
            var properError = sails.errorhandler.buildError(responseError);
            return response(properError);
          }
        }
        return next();
      });
    }

  };
};
