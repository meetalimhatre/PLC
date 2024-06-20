const _ = require('lodash');
const helpers = require('../../util/helpers');
const templateHelpers = require('./template-engine-helpers');
const templateMasterdataHelpers = require('../../db/administration/templates/masterDataTemplateHelpers');
const Handlebars = require('handlebars');

const MessageLibrary = require('../../../xs/util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

function logError(msg) {
    helpers.logError(msg);
}

/**
 * Wrapper for Handlebar.js to be used in generating dynamic DB artefacts.
 * The compile() function takes a template string and a context object to produce a result string.
 * See http://handlebarsjs.com for more details. 
 */
function TemplateEngine() {

    var options = { noEscape: true };

    templateHelpers.registerHelpers(Handlebars);
    templateMasterdataHelpers.registerHelpers(Handlebars);

    this.compile = function (sTemplate, oContext) {

        if (!_.isString(sTemplate)) {
            const sLogMessage = 'Template must be a string.';
            logError(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        if (helpers.isNullOrUndefined(oContext)) {
            const sLogMessage = 'Context must an object.';
            logError(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        try {

            var compiledTemplate = Handlebars.compile(sTemplate, options);
            var sOutput = compiledTemplate(oContext);
            return sOutput;

        } catch (e) {
            const sClientMsg = 'Error happened in TemplateEngine. Refer to server log.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message }`;
            logError(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

    };

}

TemplateEngine.prototype = Object.create(TemplateEngine.prototype);
TemplateEngine.prototype.constructor = TemplateEngine;

module.exports.TemplateEngine = TemplateEngine;
export default {_,helpers,templateHelpers,templateMasterdataHelpers,Handlebars,MessageLibrary,PlcException,Code,logError,TemplateEngine};
