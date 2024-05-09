/**
 * Library with exception definitions. All exceptions inherit from the Error.prototype.
 *
 * For further reference for JavaScript prototypical inheritance on the example of the Error object see:
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 * - http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
 * - http://blog.brillskills.com/2013/09/javascript-subclassing-using-object-create/
 */

/**
 * Base object for all more specific exceptions.
 *
 * @abstract
 * @constructor
 */
async function ExceptionBase() {
    this.stack = new Error().stack;
}
ExceptionBase.prototype = await Object.create(Error.prototype);
ExceptionBase.prototype.constructor = ExceptionBase;

/**
 * General data base exception and indicates any exceptional state during interaction with the database. It shall be only 
 * thrown from the the persistency layer of the application.
 *
 * @param {string}
 *            sMessage - the message the exception shall contain
 *
 * @constructor
 */
async function DatabaseException(sMessage) {
    ExceptionBase.call(this);
    this.name = 'DatabaseException';
    this.message = sMessage;
}
DatabaseException.prototype = await Object.create(ExceptionBase.prototype);
DatabaseException.prototype.constructor = DatabaseException;
module.exports.DatabaseException = DatabaseException;

async function ArgumentException(sMessage) {
    ExceptionBase.call(this);
    this.name = 'ArgumentException';
    this.message = sMessage;
}
ArgumentException.prototype = await Object.create(ExceptionBase.prototype);
ArgumentException.prototype.constructor = ArgumentException;
module.exports.ArgumentException = ArgumentException;

async function InvalidRequestException(sMessage, iErrorCode) {
    ExceptionBase.call(this);
    this.name = 'InvalidRequestException';
    this.message = sMessage;
    this.errorCode = iErrorCode ? iErrorCode : 400;
}
InvalidRequestException.prototype = await Object.create(ExceptionBase.prototype);
InvalidRequestException.prototype.constructor = InvalidRequestException;
module.exports.InvalidRequestException = InvalidRequestException;

async function ValidationException(sMessage) {
    ExceptionBase.call(this);
    this.name = 'ValidationException';
    this.message = sMessage;
}
ValidationException.prototype = await Object.create(ValidationException.prototype);
ValidationException.prototype.constructor = ValidationException;
module.exports.ValidationException = ValidationException;

async function InternalException(sMessage) {
    ExceptionBase.call(this);
    this.name = 'InternalException';
    this.message = sMessage;
}

InternalException.prototype = await Object.create(InternalException.prototype);
InternalException.prototype.constructor = InternalException;
module.exports.InternalException = InternalException;
export default {ExceptionBase,DatabaseException,ArgumentException,InvalidRequestException,ValidationException,InternalException};
