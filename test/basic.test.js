var Sails = require("sails").Sails;
var request = require("supertest");
var should = require("should");

 describe("Basic tests ::", function() {

     // Var to hold a running sails app instance
     var sails;

     // Before running any tests, attempt to lift Sails
     before(function (done) {

         // Hook will timeout in 10 seconds
         this.timeout(11000);

         // Attempt to lift sails
         Sails().lift({
           hooks: {
             // Load the hook
             "errorhandler": require("../"),
             // Skip grunt (unless your hook uses it)
             "grunt": false
           },
           log: {level: "error"},
           errorhandler: {
                modelCodes: {
                    Cat: "11"
                },

                defaults: {
                  gone: { message: "Service Gone", code: "410"},
                  badRequest: {message: "my bad requeste message", code: "400"}
                },

                soloErrors: /^(badRequest|missingArguments|notAcceptable|notImplemented|serviceUnavailable|unsupportedMediaType|gone)$/
            }
         },function (err, _sails) {
           if (err) return done(err);
           sails = _sails;
           return done();
         });
     });

     // After tests are complete, lower Sails
     after(function (done) {

         // Lower Sails (if it successfully lifted)
         if (sails) {
             return sails.lower(done);
         }
         // Otherwise just return
         return done();
     });

     // Test that Sails can lift with the hook in place
     it ("sails does not crash", function() {
         return true;
     });

    describe("Validations on creation", function (){
        it("creates an error with specific fields", function (done){
            var errorCreated = sails.errorhandler.create("missingArguments","detailedInfo");
            errorCreated.should.have.property("codeString","missingArguments");
            errorCreated.should.have.property("detailedInfo","detailedInfo");
            done();
        });
    });

    describe("Validations on build", function (){
        it("should create default non-specific error", function (done) {
            var error = {
                codeString: "badRequest",
                detailedInfo: "detailedInfo"
            };
            var properError = sails.errorhandler.buildError(error);
            properError.should.have.property("error");
            properError.error.should.have.property("detailedInfo", "detailedInfo");
            properError.error.should.have.property("code", "400-00");
            properError.error.should.have.property("message", "my bad requeste message");
            done();
        });

        it("should create non-specific error from config", function (done) {
            var error = {
                codeString: "gone",
                detailedInfo: "detailedInfo"
            };
            var properError = sails.errorhandler.buildError(error);
            properError.should.have.property("error");
            properError.error.should.have.property("detailedInfo", "detailedInfo");
            properError.error.should.have.property("code", "410-00");
            properError.error.should.have.property("message", "Service Gone");
            done();
        });

        it("should create default specific error", function (done) {
            var error = {
                codeString: "unauthorized",
                icode: "00",
                errorString: null,
                detailedInfo: "detailedInfo"
            };
            var properError = sails.errorhandler.buildError(error);
            properError.should.have.property("error");
            properError.error.should.have.property("detailedInfo", "detailedInfo");
            properError.error.should.have.property("code", "401-00");
            properError.error.should.have.property("message", "Unauthorized");
            done();
        });

        it("should create model specific error", function (done) {
            var error = {
                codeString: "unauthorized",
                icode: "13",
                errorString: "Unauthorized model",
                detailedInfo: "detailedInfo"
            };
            var properError = sails.errorhandler.buildError(error);
            properError.should.have.property("error");
            properError.error.should.have.property("detailedInfo", "detailedInfo");
            properError.error.should.have.property("code", "401-13");
            properError.error.should.have.property("message", "Unauthorized model");
            done();
        });

        it("should create model specific error", function (done) {
            var error = {
                codeString: "unauthorized",
                errorString: "Unauthorized model",
                detailedInfo: "detailedInfo"
            };
            var properError = sails.errorhandler.buildError(error);
            properError.should.have.property("error");
            properError.error.should.have.property("detailedInfo", "detailedInfo");
            properError.error.should.have.property("code", "401-00");
            properError.error.should.have.property("message", "Unauthorized model");
            done();
        });

        it("should create serverError class", function (done) {
            var error = {
                codeString: "serverError",
                icode: "01",
                errorString: "db error",
                detailedInfo: "detailedInfo"
            };
            var properError = sails.errorhandler.buildError(error);
            properError.should.have.property("error");
            properError.error.should.have.property("detailedInfo", "detailedInfo");
            properError.error.should.have.property("code", "500-01");
            properError.error.should.have.property("message", "db error");
            done();
        });
    });

    describe("Validations on composition", function (){
        it("creates an error with default intern code", function (done){
            var errorCreated = sails.errorhandler.create("unauthorized","detailedInfo");
            var toResponse = sails.errorhandler.compose(errorCreated);
            should.not.exist(toResponse.icode);
            toResponse.should.have.property("detailedInfo", "detailedInfo");
            toResponse.should.have.property("errorString", null);
            toResponse.should.have.property("codeString", "unauthorized");
            done();
        });

        it("creates an error with specified intern code", function (done){
            var errorCreated = sails.errorhandler.create("unauthorized","detailedInfo","XX");
            var toResponse = sails.errorhandler.compose(errorCreated);
            toResponse.should.have.property("icode", "XX");
            toResponse.should.have.property("detailedInfo", "detailedInfo");
            toResponse.should.have.property("errorString", null);
            toResponse.should.have.property("codeString", "unauthorized");
            done();
        });

        it("creates an error with model intern code", function (done){
            var errorCreated = sails.errorhandler.create("unauthorizedCat","detailedInfo");
            var toResponse = sails.errorhandler.compose(errorCreated);
            toResponse.should.have.property("icode", "11");
            toResponse.should.have.property("detailedInfo", "detailedInfo");
            toResponse.should.have.property("errorString", "Unuathorized Cat");
            toResponse.should.have.property("codeString", "unauthorized");
            done();
        });

        it("creates an error without model intern code", function (done){
            var errorCreated = sails.errorhandler.create("unauthorizedDog","detailedInfo");
            var toResponse = sails.errorhandler.compose(errorCreated);
            toResponse.should.have.property("icode");
            should.not.exist(toResponse.icode);
            toResponse.should.have.property("detailedInfo", "detailedInfo");
            toResponse.should.have.property("errorString", "Unuathorized Dog");
            toResponse.should.have.property("codeString", "unauthorized");
            done();
        });

        it("creates an error with default response codeString", function (done){
            var errorCreated = sails.errorhandler.create("notAcceptable","detailedInfo");
            var toResponse = sails.errorhandler.compose(errorCreated);
            toResponse.should.have.property("codeString", "notAcceptable");
            toResponse.should.have.property("detailedInfo","detailedInfo");
            should.not.exist(toResponse.code);
            should.not.exist(toResponse.errorString);
            done();
        });

        it("creates a serverError type from other error", function (done){
            var errorCreated = sails.errorhandler.create("dataBaseError","detailedInfo");
            var toResponse = sails.errorhandler.compose(errorCreated);
            toResponse.should.have.property("codeString","serverError");
            toResponse.should.have.property("detailedInfo","detailedInfo");
            toResponse.should.have.property("icode", "01");
            should.not.exist(toResponse.errorString);
            done();
        });

        it("creates a serverError type", function (done){
            var errorCreated = sails.errorhandler.create("serverError","detailedInfo");
            var toResponse = sails.errorhandler.compose(errorCreated);
            toResponse.should.have.property("codeString","serverError");
            toResponse.should.have.property("detailedInfo","detailedInfo");
            toResponse.should.have.property("icode", "00");
            should.not.exist(toResponse.errorString);
            done();
        });

        it("creates a serverError type from non-existent response", function (done){
            var errorCreated = sails.errorhandler.create("notExistent","detailedInfo");
            var toResponse = sails.errorhandler.compose(errorCreated);
            toResponse.should.have.property("codeString","serverError");
            toResponse.should.have.property("detailedInfo","detailedInfo");
            toResponse.should.have.property("icode", "00");
            should.not.exist(toResponse.errorString);
            done();
        });
    });
});
