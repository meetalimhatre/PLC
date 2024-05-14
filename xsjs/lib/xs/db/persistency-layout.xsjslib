const _ = $.require('lodash');
const helpers = $.require('../util/helpers');
const Helper = $.require('./persistency-helper').Helper;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

var Tables = Object.freeze({
    layout: 'sap.plc.db::basis.t_layout',
    layout_personal: 'sap.plc.db::basis.t_layout_personal',
    layout_columns: 'sap.plc.db::basis.t_layout_column',
    layout_hidden_fields: 'sap.plc.db::basis.t_layout_hidden_field'
});

const Sequences = Object.freeze({ layout: 'sap.plc.db.sequence::s_layout' });

/**
 * Provides persistency operations with layouts.
 */

async function Layout(dbConnection, hQuery) {
    this.helper = await new Helper($, hQuery, dbConnection);

    /**
	 * Gets all the corporate layouts and the user defined layouts
	 *
	 * @param {string}
	 *            sUserId - the user id
	 *
	 * @returns {oReturnObject} -  all corporate layouts and the user defined ones, the columns for each layout
	 * 			and the hidden fields for each layout
	 *
	 */
    this.getLayouts = function (sUserId, iLayoutType) {

        var stmtLayout = 'select layout.LAYOUT_ID, layout.LAYOUT_NAME, layout.IS_CORPORATE, layout.LAYOUT_TYPE, layoutPersonal.IS_CURRENT from "' + Tables.layout + '" layout left outer join "' + Tables.layout_personal + '" layoutPersonal on layoutPersonal.LAYOUT_ID = layout.LAYOUT_ID ' + 'where (layoutPersonal.USER_ID in (select USER_ID from "' + Tables.layout_personal + '" where USER_ID = ?) or layout.IS_CORPORATE = 1) and layout_type = ?';
        var stmtLayoutColumn = 'select column.LAYOUT_ID, column.DISPLAY_ORDER, column.PATH, column.BUSINESS_OBJECT, column.COLUMN_ID, column.COSTING_SHEET_ROW_ID, ' + 'column.COST_COMPONENT_ID, column.COLUMN_WIDTH from "' + Tables.layout_columns + '" column inner join "' + Tables.layout + '" layout ON column.layout_id=layout.layout_id ' + 'left outer join "' + Tables.layout_personal + '" personal on column.layout_id=personal.layout_id ' + 'where personal.user_id=? or layout.is_corporate=1';
        var stmtLayoutHiddenFields = 'select hiddenFields.LAYOUT_ID, hiddenFields.PATH, hiddenFields.BUSINESS_OBJECT, hiddenFields.COLUMN_ID from "' + Tables.layout_hidden_fields + '" hiddenFields ' + 'inner join "' + Tables.layout + '" layout ON hiddenFields.layout_id=layout.layout_id ' + 'left outer join "' + Tables.layout_personal + '" personal on hiddenFields.layout_id=personal.layout_id ' + 'where personal.user_id=? or layout.is_corporate=1';

        return {
            LAYOUT: await dbConnection.executeQuery(stmtLayout, sUserId, iLayoutType),
            LAYOUT_COLUMN: await dbConnection.executeQuery(stmtLayoutColumn, sUserId),
            HIDDEN_FIELDS: await dbConnection.executeQuery(stmtLayoutHiddenFields, sUserId)
        };
    };

    /**
	 * Creates new layouts, corporate or personal
	 * @param {object}
	 *            oLayoutData - the layout object that should be created
	 *            it also contains information about the column display and hidden fields
	 * @param {string} 
	 *            sUserId - user id
	 * @param {integer} 
	 *            iIsCorporate - 1 if is corporate layout, 0 if it is not
	 * @returns {object} oResultSet - created layout together layout column display and hidden fields
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.create = async function (oLayoutData, sUserId, iIsCorporate) {

        var iLayoutId = this.helper.getNextSequenceID(Sequences.layout);

        if (helpers.isNullOrUndefined(oLayoutData.LAYOUT_TYPE)) {
            oLayoutData.LAYOUT_TYPE = 1;
        }

        var stmtInsertLayout = 'insert into "' + Tables.layout + '" (LAYOUT_ID, LAYOUT_NAME, IS_CORPORATE, LAYOUT_TYPE) values(?,?,?,?)';
        await dbConnection.executeUpdate(stmtInsertLayout, iLayoutId, oLayoutData.LAYOUT_NAME || null, iIsCorporate, oLayoutData.LAYOUT_TYPE);


        if (iIsCorporate === 0) {
            var stmtInsertLayoutPers = 'insert into "' + Tables.layout_personal + '" (LAYOUT_ID, USER_ID, IS_CURRENT) values(?,?,?)';
            await dbConnection.executeUpdate(stmtInsertLayoutPers, iLayoutId, sUserId, oLayoutData.IS_CURRENT);
        }

        this.createLayoutAdditionalData(oLayoutData, iLayoutId);

        return iLayoutId;
    };

    /**
	 * Creates layout additional data, in tables t_layout_column and t_layout_hidden_field
	 * @param {object}
	 *            oLayoutData - the layout object that should be created with the
	 *            information about the column display and hidden fields
	 * @param {integer} 
	 *            iLayoutId - layout id
	 */
    this.createLayoutAdditionalData = function (oLayoutData, iLayoutId) {
        //the layout_id is not set on the request for the column and 
        //and hidden fields entities, it needs to be added
        var aLayoutColumns = [];
        var aHiddenFields = [];
        _.each(oLayoutData.LAYOUT_COLUMNS, function (oLayoutColumns) {
            var oLayoutColumn = [
                iLayoutId,
                oLayoutColumns.DISPLAY_ORDER,
                oLayoutColumns.PATH || null,
                oLayoutColumns.BUSINESS_OBJECT || null,
                oLayoutColumns.COLUMN_ID || null,
                oLayoutColumns.COSTING_SHEET_ROW_ID || null,
                oLayoutColumns.COST_COMPONENT_ID === undefined ? null : oLayoutColumns.COST_COMPONENT_ID,
                oLayoutColumns.COLUMN_WIDTH || null
            ];
            aLayoutColumns.push(oLayoutColumn);
        });
        _.each(oLayoutData.HIDDEN_FIELDS, function (oLayoutHiddenField) {
            var oHiddenField = [
                iLayoutId,
                oLayoutHiddenField.PATH,
                oLayoutHiddenField.BUSINESS_OBJECT,
                oLayoutHiddenField.COLUMN_ID
            ];
            aHiddenFields.push(oHiddenField);
        });
        if (aLayoutColumns.length > 0) {
            await dbConnection.executeUpdate('INSERT INTO "' + Tables.layout_columns + '" (LAYOUT_ID, DISPLAY_ORDER, PATH, BUSINESS_OBJECT, COLUMN_ID, COSTING_SHEET_ROW_ID, COST_COMPONENT_ID, COLUMN_WIDTH) VALUES (?,?,?,?,?,?,?,?)', aLayoutColumns);
        }
        if (aHiddenFields.length > 0) {
            await dbConnection.executeUpdate('INSERT INTO "' + Tables.layout_hidden_fields + '" (LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID) VALUES (?,?,?,?)', aHiddenFields);
        }
    };

    /**
	 * Updates existing layouts, corporate or personal 
	 * On the update request the current state of the columns and hidden 
	 * fields is sent. So it is necessary to delete all the columns and hidden 
	 * fields and create the ones from the request.
	 * @param {object}
	 *            oLayoutData - the layout object that should be updated
	 *            it also contains information about the column display and hidden fields 
	 *            that exist in the current layout.
	 * @param {string} 
	 *            sUserId - user id
	 * @param {integer} 
	 *            iIsCorporate - 1 if is corporate layout, 0 if it is not
	 * @returns {object} oResultSet - created layout together layout column display and hidden fields
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.update = async function (oLayoutData, sUserId, iIsCorporate) {
        if (!helpers.isNullOrUndefined(oLayoutData.LAYOUT_NAME)) {
            await dbConnection.executeUpdate('update "' + Tables.layout + '" set LAYOUT_NAME = ? where LAYOUT_ID = ?', oLayoutData.LAYOUT_NAME, oLayoutData.LAYOUT_ID);
        }
        if (iIsCorporate === 0 && !helpers.isNullOrUndefined(oLayoutData.IS_CURRENT)) {
            await dbConnection.executeUpdate('update "' + Tables.layout_personal + '" set IS_CURRENT = ? where LAYOUT_ID = ?', oLayoutData.IS_CURRENT, oLayoutData.LAYOUT_ID);
        }

        this.deleteLayoutAdditionalData(oLayoutData.LAYOUT_ID);
        this.createLayoutAdditionalData(oLayoutData, oLayoutData.LAYOUT_ID);

        return oLayoutData.LAYOUT_ID;
    };

    /**
	 * Checks whether the layout id exists in the layout table. 
	 * @param {integer}
	 *            iLayoutId - the id of the layout
	 * @returns {boolean} - true if the layout id exists, otherwise false
	 */
    this.exists = function (iLayoutId) {
        return this.helper.exists([iLayoutId], Tables.layout, 'layout_id');
    };

    /**
	 * Checks whether the name is unique. 
	 * @param {integer}
	 *            iLayoutId - the id of the layout 
	 * @param {string}
	 *            sLayoutName - the name of the layout 
	 * @param {string} 
	 *            sUserId - user id
	 * @returns {boolean} - true if the layout id exists, otherwise false
	 */
    this.isNameUnique = function (iLayoutId, sLayoutName, sUserId) {
        var sSelectStmt = 'select count(*) as rowcount from "' + Tables.layout + '" where (IS_CORPORATE = 1 and upper(LAYOUT_NAME) = upper(?)) and LAYOUT_ID != ?' + 'or (IS_CORPORATE = 0 and upper(LAYOUT_NAME) = upper(?) and layout_id in ' + '(select layout_id from "' + Tables.layout_personal + '" where USER_ID = ?) and LAYOUT_ID != ?)';
        var aCount = await dbConnection.executeQuery(sSelectStmt, sLayoutName, iLayoutId, sLayoutName, sUserId, iLayoutId);

        return parseInt(aCount[0].ROWCOUNT) === 0;
    };

    /**
	 * Deletes layout.
	 *
	 * @param {integer}
	 *            iLayoutId - the layout id
	 * @param {sUserId}
	 *            iLayoutId - the layout id
	 * @throws {PlcException} -
	 *             personal layout does not exist for layout id for the current user
	 * @returns {integer} - number of deleted records from the t_layout table (0 or 1)
	 */
    this.deleteLayout = async function (iLayoutId, sUserId, iIsCorporate) {
        if (iIsCorporate === 0) {
            var iPersonalLayoutDeleteResult = await dbConnection.executeUpdate('delete  from  "' + Tables.layout_personal + '" where LAYOUT_ID = ? AND USER_ID = ?', iLayoutId, sUserId);
            if (iPersonalLayoutDeleteResult === 0) {
                const sClientMsg = 'Personal layout id does not exist for user.';
                const sServerMsg = `${ sClientMsg } Layout id: ${ iLayoutId }, user id: ${ sUserId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
            }
        }

        this.deleteLayoutAdditionalData(iLayoutId);

        var iLayoutDeleteResult = await dbConnection.executeUpdate('delete  from  "' + Tables.layout + '" where LAYOUT_ID = ?', iLayoutId);

        return iLayoutDeleteResult;
    };

    /**
	 * Deletes layout additional data, from t_layout_column and t_layout_hidden_field.
	 *
	 * @param {integer}
	 *            iLayoutId - the layout id
	 */
    this.deleteLayoutAdditionalData = function (iLayoutId) {
        await dbConnection.executeUpdate('delete  from  "' + Tables.layout_columns + '" where LAYOUT_ID = ?', iLayoutId);
        await dbConnection.executeUpdate('delete  from  "' + Tables.layout_hidden_fields + '" where LAYOUT_ID = ?', iLayoutId);
    };
}

Layout.prototype = Object.create(Layout.prototype);
Layout.prototype.constructor = Layout;
export default {_,helpers,Helper,MessageLibrary,PlcException,Code,Tables,Sequences,Layout};
