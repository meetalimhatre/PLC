const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

var Tables = Object.freeze({ retention_periods: 'sap.plc.db::basis.t_personal_data_validity' });

function RetentionPeriods($, dbConnection) {
    /**
	 * Creates retention periods.
	 *
	 * @param {aRetentionPeriods} -
	 *            aRetentionPeriods - the array of objects with the properties of retention periods
	 * @throws {PlcException} - 
	 * 			  If there already exist a record with the same key
	 * @returns {array} -
	 * 			  An array cointainig the result values for each object from the input array
	 *
	 */
    this.create = async function (aRetentionPeriods) {
        let aRetentionPeriodsValues = [];
        aRetentionPeriods.forEach(oRetentionPeriod => aRetentionPeriodsValues.push([
            oRetentionPeriod.ENTITY.toUpperCase(),
            oRetentionPeriod.SUBJECT.toUpperCase(),
            oRetentionPeriod.VALID_TO,
            oRetentionPeriod.VALID_FOR
        ]));
        let aInsertResult;
        try {
            aInsertResult = await dbConnection.executeUpdate(`INSERT INTO "${ Tables.retention_periods }" (ENTITY, SUBJECT, VALID_TO, VALID_FOR) VALUES (?,?,?,?)`, aRetentionPeriodsValues);
        } catch (e) {
            if (e.code === 301) {
                let sClientMsg = 'The record already exists in personal data validity table.';
                let sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sClientMsg, undefined, undefined, e);
            }
            let sClientMsg = 'Error during inserting of retention periods into table.';
            let sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }
        return aInsertResult;
    };

    /**
	 * Get all retention periods.
	 *
	 * @returns {array} -
	 *            Array of objects with the properties of retention periods
	 *
	 */
    this.getAllRetentionData = function () {
        return dbConnection.executeQuery(`select ENTITY, SUBJECT, VALID_TO, VALID_FOR from "${ Tables.retention_periods }"`);
    };

    /**
	 * Deletes retention periods.
	 *
	 * @param {aRetentionPeriods}
	 *            aRetentionPeriods - the array of objects with the key properties of retention periods
	 * @throws {PlcException} - 
	 * 			  If an unexpected error occurs
	 * @returns {array} -
	 * 			  An array cointainig the result values for each object from the input array
	 *
	 */
    this.deletePeriods = async function (aRetentionPeriods) {
        let aRetentionPeriodsValues = [];
        aRetentionPeriods.forEach(oRetentionPeriod => aRetentionPeriodsValues.push([
            oRetentionPeriod.ENTITY.toUpperCase(),
            oRetentionPeriod.SUBJECT.toUpperCase()
        ]));
        let aDeleteResult;
        try {
            aDeleteResult = await dbConnection.executeUpdate(`DELETE FROM "${ Tables.retention_periods }" where (ENTITY, SUBJECT) = (?,?)`, aRetentionPeriodsValues);
        } catch (e) {
            let sClientMsg = 'Error during deletion of retention periods from table.';
            let sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }
        return aDeleteResult;
    };

    /**
	 * Updates retention periods.
	 *
	 * @param {aRetentionPeriods} -
	 *            aRetentionPeriods - the array of objects with the properties of retention periods
	 * @throws {PlcException} - 
	 * 			  If an unexpected error occurs
	 * @returns {array} -
	 * 			  An array cointainig the result values for each object from the input array
	 *
	 */
    this.update = async function (aRetentionPeriods) {
        let aRetentionPeriodsValues = [];
        aRetentionPeriods.forEach(oRetentionPeriod => aRetentionPeriodsValues.push([
            oRetentionPeriod.VALID_TO,
            oRetentionPeriod.VALID_FOR,
            oRetentionPeriod.ENTITY.toUpperCase(),
            oRetentionPeriod.SUBJECT.toUpperCase()
        ]));
        let aUpdateResult;
        try {
            aUpdateResult = await dbConnection.executeUpdate(`UPDATE "${ Tables.retention_periods }" set VALID_TO = ?, VALID_FOR =? where (ENTITY, SUBJECT) = (?,?)`, aRetentionPeriodsValues);
        } catch (e) {
            let sClientMsg = 'Error during the update of retention periods.';
            let sServerMsg = `${ sClientMsg } Error: ${ e.msg || e.message }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }
        return aUpdateResult;
    };

}
RetentionPeriods.prototype = Object.create(RetentionPeriods.prototype);
RetentionPeriods.prototype.constructor = RetentionPeriods;

module.exports.RetentionPeriods = RetentionPeriods;
export default {MessageLibrary,PlcException,Code,MessageDetails,Tables,RetentionPeriods};
