const helpers = require("../util/helpers");
const _ = require("lodash");

const MessageLibrary = require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const constants = require("../util/constants");

const Tables = Object.freeze({
	entity_relation : 'sap.plc.db::basis.t_entity_relation',
	regex: 'sap.plc.db::basis.t_regex'
});
const Views = Object.freeze({
	entity_relation: "sap.plc.db.views::v_entity_relation"
});


/**
 * Creates a new Helper object.
 */

function Helper($, hQuery, dbConnection) {
    /**
     * Check if column name matches the column syntax to avoid SQL injection.
     */
    function checkColumnSyntax(sColumnName){
        if (!sColumnName.match(/^[a-zA-Z0-9_]*$/)) {
            const sLogMessage = `Column name '${sColumnName}' does not match valid syntax for column name.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
    }

	/**
	 * Gets and returns the next ID from a given sequence. *
	 * 
	 * @param {string}
	 *            sSequenceName - name of the sequence
	 * @returns {integer} the next ID taken from the given sequence
	 */
	this.getNextSequenceID = function(sSequenceName) {
		var oNewEntityIdStatement = hQuery.statement('select "' + sSequenceName + '".nextval as newid from dummy');
		var aEntityId = oNewEntityIdStatement.execute();
		if (aEntityId.length === 0 || aEntityId.length > 1) {
			const sLogMessage = `New id could not be retrieved from sequence ${sSequenceName}.`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}

		var iEntityId;
		try {
			iEntityId = helpers.toPositiveInteger(aEntityId[0].NEWID);
		} catch (e) {
			const sLogMessage = `New id from sequence ${sSequenceName} is invalid.`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
		}
		return iEntityId;
	};

	/**
	 * Insert new entity method. It's a helper used in different InsertNew methods (e.g. Item, Calculation). It creates the new entity
	 * object with the generated values in db. Then the entity object with extended properties is returned.
	 * 
	 * @param {object}
	 *            oEntity - the object with the properties of the new entity from request
	 * @param {object}
	 *            oSettings - the object with the settings for the method. It defines which entities to use, where to get the data from etc.
	 *            oSettings.TABLE - name of temporary table where the entity should be written in oSettings.PROPERTIES_TO_EXCLUDE -
	 *            properties of oEntity that should be excluded during writing in db oSettings.GENERATED_PROPERTIES - generated properties
	 *            that should be added to the db object
	 * @returns {object} oResultSet - extended oEntity with new properties for the added entity
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */

	this.insertNewEntity = function(oEntity, oSettings, customHQuery) {
		// check the optional customHQuery parameter; if it is defined it should be used if not use the default hQuery from
		// the object constructor; => custom hQuery instance have be to used if an insert into another schema has to be made
		// for instance
		var hQueryToUse = customHQuery || hQuery;
		var sTableName = oSettings.TABLE;
		var aPropertiesToExclude = oSettings.PROPERTIES_TO_EXCLUDE;
		var oGeneratedValues = oSettings.GENERATED_PROPERTIES;

		var oPlainEntity = _.omit(oEntity, aPropertiesToExclude);

		var oInsertSet = _.extend(oPlainEntity, oGeneratedValues);
		var aInsertColumns = _.keys(oInsertSet);

		// check syntax of column names in order to explicitly counter SQL injection at this point.
		_.each(aInsertColumns, function(column) {
		    checkColumnSyntax(column);
		});

		var aInsertValues = _.values(oInsertSet);

		var aStmtBuilder = [ 'insert into "' + sTableName + '" (' ];
		aStmtBuilder.push(aInsertColumns.join(', '));

		var sValuePlaceholders = _.map(aInsertValues, function(sValue) {
			return "?";
		}).join(",");
		aStmtBuilder.push(') values (' + sValuePlaceholders + ")");

		var oInsertStmt = hQueryToUse.statement(aStmtBuilder.join(" "));
		try {
			oInsertStmt.execute(aInsertValues);
		} catch (e) {
			const sClientMsg = `Cannot insert entity into table ${sTableName}.`;
			const sServerMsg = `${sClientMsg} Entity: ${JSON.stringify(oEntity)}. Error: ${e.message || e.msg}`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
		}

		// TODO: => decide either do a select on t_item_temporary and return the retrieved item (safe, but slow way), or
		// return the item object combined with the generated fields (see the last quick variant was realized in the
		// moment)
		var oResultSet = _.extend(oEntity, oInsertSet);
		return oResultSet;
	};

	/**
	 * Utility function to generate select statements for different tables
	 * 
	 * @param {object}
	 *            oSettings - the object with the settings for the method. It defines which entities to use, where to get the data from etc.
	 *            oSettings.TABLE - name of temporary table where the entity should be written in oSettings.COLUMNS - the columns which
	 *            shall be selected from the table; if this property is not defined, all columns of the table are selected (like select *)
	 *            oSettings.WHERE_PROPERTIES - set of properties and values used for the where clause; the properties are combine by AND; if
	 *            a property has an array as value, these values are combined with OR
	 * @returns {object} oResultSet - extended found entities in the specified table
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
	this.selectEntities = function(oSettings, customHQuery) {
		var hQueryToUse = customHQuery || hQuery;
		var sTableName = oSettings.TABLE;
		var aSelectedColumns = oSettings.COLUMNS || this.getColumnsForTable(sTableName);
		var mWhereProperties = oSettings.WHERE_PROPERTIES || null;

		var aStmtBuilder = [ "select" ];
		_.each(aSelectedColumns, function(sColumnName, iIndex) {
		    checkColumnSyntax(sColumnName);

			aStmtBuilder.push(sColumnName);
			if (iIndex < aSelectedColumns.length - 1) {
				aStmtBuilder.push(",");
			}
		});

		aStmtBuilder.push(`from "${sTableName}"`);
		var aStmtValues = [];
		if (mWhereProperties !== null) {
			aStmtBuilder.push("where");
			var aWhereProperties = _.keys(mWhereProperties);
			_.each(aWhereProperties, function(sWhereProperty, iIndex) {
			    checkColumnSyntax(sWhereProperty);

				var wherePropertyValue = mWhereProperties[sWhereProperty];
				if (_.isArray(wherePropertyValue) === true) {
					var aOrConcatenatedValues = wherePropertyValue;
					aStmtBuilder.push("(");
					_.each(aOrConcatenatedValues, function(value, iIndex) {
						aStmtBuilder.push(sWhereProperty + " = ?");
						aStmtValues.push(value);
						if (iIndex < aOrConcatenatedValues.length - 1) {
							aStmtBuilder.push("or");
						}
					});
					aStmtBuilder.push(")");
				} else {
					aStmtBuilder.push(sWhereProperty + " = ?");
					aStmtValues.push(wherePropertyValue);
				}
				if (iIndex < aWhereProperties.length - 1) {
					aStmtBuilder.push("and");
				}
			});
		}
		aStmtBuilder.push(";");

		var stmt = hQueryToUse.statement(aStmtBuilder.join(" "));
		try {
			var oResult = stmt.execute(aStmtValues);
			return oResult;
		} catch (e) {
			const sClientMsg = "Cannot execute the entity selection statement.";
			const sServerMsg = `${sClientMsg} SQL statement: '${aStmtBuilder.join(" ")}'. Error: '${e.message|| e.msg}.'`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
		}
	};

	/**
	 * Updates an entity. It's a helper used in different updateEntity methods (e.g. Addin). It updates the entity object with the new
	 * entity properties in db. Then the entity object with extended properties is returned.
	 * 
	 * @param {object}
	 *            oEntity - the object with the properties of the entity from request which have to be updated
	 * @param {object}
	 *            oSettings - the object with the settings for the method. It defines which entities to use, where to get the data from etc.
	 *            oSettings.TABLE - name of temporary table where the entity should be written in oSettings.PROPERTIES_TO_EXCLUDE -
	 *            properties of oEntity that should be excluded during writing in db oSettings.GENERATED_PROPERTIES - generated properties
	 *            that should be added to the db object oSettings.WHERE_PROPERTIES - properties used in where-clause of the update statement
	 * @returns {object} oResultSet - extended oEntity with updated properties for the entity
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */

	this.updateEntity = function(oEntity, oSettings, customHQuery) {
		// check the optional customHQuery parameter; if it is defined it should be used if not use the default hQuery from
		// the object construtor; => custom hQuery instance have be to used e.g. if the operation on another schema has to be made
		var hQueryToUse = customHQuery || hQuery;
		var sTableName = oSettings.TABLE;
		var aPropertiesToExclude = oSettings.PROPERTIES_TO_EXCLUDE;
		var oGeneratedValues = oSettings.GENERATED_PROPERTIES;
		var aWhereProperties = oSettings.WHERE_PROPERTIES;

		var oPlainEntity = _.omit(oEntity, aPropertiesToExclude);

		var oUpdateSet = _.extend(oPlainEntity, oGeneratedValues);

		// check syntax of column name (in order to explicitly counter SQL injection at this point)
		_.each(_.keys(oUpdateSet), function(column) {
		    checkColumnSyntax(column);
		});

		// construct and execute update query
		var aStmtBuilder = [ 'update "' + sTableName + '" set ' ];
		var aColumnNames = _.keys(oEntity);
		_.each(aColumnNames, function(sColumnName, iIndex) {
			aStmtBuilder.push(sColumnName + " = ?");
			if (iIndex < aColumnNames.length - 1) {
				aStmtBuilder.push(", ");
			}
		});
		aStmtBuilder.push('where');
		aColumnNames = _.keys(aWhereProperties);
		_.each(aColumnNames, function(sColumnName, iIndex) {
			aStmtBuilder.push(sColumnName + " = ?");
			if (iIndex < aColumnNames.length - 1) {
				aStmtBuilder.push(" and ");
			}
		});
		aStmtBuilder.push(";");

		var aQueryValues = _.values(oUpdateSet).concat(_.values(aWhereProperties));

		var stmt = hQueryToUse.statement(aStmtBuilder.join(" "));

		var iAffectedRows = 0;
		try {
			iAffectedRows = stmt.execute(aQueryValues);
		} catch (e) {
			const sClientMsg = "Cannot update entity.";
			const sServerMsg = `${sClientMsg} SQL statement: '${aStmtBuilder.join(" ")}'. Error: '${e.message || e.msg}.'`;
			$.trace.error(sServerMsg);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
		}
		if (iAffectedRows > 1) {
			const sLogMessage = `Corrupted query or database state: modified ${iAffectedRows} database records in ${sTableName} during the update.`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}

		return _.extend(oEntity, oUpdateSet);
	};

	/**
	 * Gets the columns of a given table
	 * 
	 * @param {string}
	 *            sTableName - table name
	 * @returns {array} aColumns - the columns of the table
	 */
	this.getColumnsForTable = function(sTableName) {
		var sDetermineColumnsStmt = hQuery.statement('select column_name from "SYS"."TABLE_COLUMNS" where schema_name = CURRENT_SCHEMA'
				+ ' and table_name = \'' + sTableName + '\' order by position');
		var aColumns = _.map(sDetermineColumnsStmt.execute(), function(oColumnResult, iIndex) {
			return oColumnResult.COLUMN_NAME;
		});
		return aColumns;
	};
	
	this.getNullableColumnsForTable = function(sTableName) {
		var sStmt = `
			select column_name 
			from "SYS"."TABLE_COLUMNS" 
			where 		schema_name = CURRENT_SCHEMA
					and table_name = ?
					and is_nullable = 'TRUE' 
			order by position; 
		`;
		var oResult = dbConnection.executeQuery(sStmt, sTableName);
		return _.map(oResult, "COLUMN_NAME");
	};

	/**
	 * Takes a set of object and add missing properties which are necessary to correspond to the specified type of the given table name.
	 * This function facilitates the call of procedures based on input data, which often not completely corresponds to a table type. <br />
	 * Note: the value for each added property is <code>null</code> and there is no check if the given base object contains invalid
	 * properties.
	 * 
	 * @param {array}
	 *            aBaseObjects - the set of objects to be expanded
	 * @param {string}
	 *            sTableName - the name of the table which type should be used for the expansion
	 */
	this.expandToTableType = function(aBaseObjects, sTableName) {
		var aTableColumns = this.getColumnsForTable(sTableName);
		var aNullValues = _.map(aTableColumns, function() {
			return null;
		});
		var oNullbasedTableType = _.zipObject(aTableColumns, aNullValues);
		var aTableTypedObjects = [];
		_.each(aBaseObjects, function(oBaseObject) {
			aTableTypedObjects.push(_.extend({}, oNullbasedTableType, oBaseObject));
		});
		return aTableTypedObjects;
	};

	/**
	 * Takes a set of object and add missing properties which are necessary to correspond to the specified type of the given table name.
	 * Also removes the properties that do not correspond to that specific type. This function facilitates the call of procedures based on
	 * input data, which often not completely corresponds to a table type. <br />
	 * Note: the value for each added property is <code>null</code> and there is no check if the given base object contains invalid
	 * properties.
	 * 
	 * @param {array}
	 *            aBaseObjects - the set of objects to be expanded
	 * @param {string}
	 *            sTableName - the name of the table which type should be used for the expansion
	 */
	this.expandToTableTypeAndRemoveNewProperties = function(aBaseObjects, sTableName) {
		var aTableColumns = this.getColumnsForTable(sTableName);
		var aNullValues = _.map(aTableColumns, function() {
			return null;
		});
		var aNewColumns = [];
		if (aBaseObjects.length !== 0)
			aNewColumns = _.difference(_.keys(aBaseObjects[0]), aTableColumns);
		var oNullbasedTableType = _.zipObject(aTableColumns, aNullValues);
		var aTableTypedObjects = [];
		_.each(aBaseObjects, function(oBaseObject) {
			var oObject = _.omit(oBaseObject, aNewColumns);
			aTableTypedObjects.push(_.extend({}, oNullbasedTableType, oObject));
		});
		return aTableTypedObjects;
	};

	/**
	 * Gets the primary keys of a given table
	 * 
	 * @param {string}
	 *            sSchema - schema name
	 * @param {string}
	 *            sTableName - table name, null for the current schema
	 * @returns {array} aKeyTableColumns - the primary keys of the table
	 */
	this.getKeyColumnsForTable = function(sSchema, sTableName) {
		var sSchemaStr = sSchema ? `'${sSchema}'` : 'CURRENT_SCHEMA';
		var sColumnsStmt = hQuery.statement('select column_name from "SYS"."CONSTRAINTS" where schema_name = ' + sSchemaStr
				+ ' and table_name = \'' + sTableName + '\' and IS_PRIMARY_KEY = \'TRUE\' order by POSITION ASC');
		var aKeyTableColumns = _.map(sColumnsStmt.execute(), function(oColumnResult, iIndex) {
			return oColumnResult.COLUMN_NAME;
		});
		return aKeyTableColumns;
	};
	
	/**
	 * Function to check whether some ids exists in a table.
	 * @returns {boolean} - true if all ids exists, otherwise false
	 */
	this.exists = function(aIds, sTableName, sColumnName) {
		
		var aStmtBuilder = [];
		var aValues = [];
		var aCount = [];
		
		if((aIds.length <= 0)||(helpers.isNullOrUndefined(sTableName))||(helpers.isNullOrUndefined(sColumnName))){
			 const sLogMessage = `Error during check for existing id. Please insert: aIds, sTableName, sColumnName.`;
	         $.trace.error(sLogMessage);
	         throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
		
		aStmtBuilder.push('select count(*) as rowcount from "' + sTableName + '" where ');
	
		_.each(aIds,function(iId,iIndex){
			aStmtBuilder.push(' ' + sColumnName + '= ? ');
			aValues.push(iId);
			if (iIndex < aIds.length - 1){
	        	aStmtBuilder.push(" OR");
	        }
		});
		
		var selectStmt = hQuery.statement(aStmtBuilder.join(""));
		try {
			aCount = selectStmt.execute(aValues);
		} catch (e) {
		    const sClientMsg = "Error during check for existing id. Selecting count failed.";
		    const sServerMsg = `${sClientMsg} Error:  ${e.message || e.msg}`;
		    $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
		}
		
		// check if all entries were found
		return parseInt(aCount[0].ROWCOUNT) === aIds.length;
		
	};
	
	/**
	 * Sets the columns that are missing in object explicitly to null except of protected columns
	 * @returns {object} - new object with same properties, but with missing properties set to null
	 */
	this.setMissingPropertiesToNull = function(oEntity, sTableName, aProtectedColumns) {
		var oFilteredCv = _.omit(oEntity, aProtectedColumns);

		// determine missing table columns and explicitly set them null to force eliminate
		// deprecated values (e.g. in case of a change of item category); ensure that no columns listed in
		// aProtectedColumns are updated!
		var aMissingColumns = _.filter(this.getNullableColumnsForTable(sTableName), function(sTableColumn) {
			var bIsTableColumnMissing = !_.has(oEntity, sTableColumn);
			var bIsTableColumnProtected = _.includes(aProtectedColumns, sTableColumn);
			return bIsTableColumnMissing && !bIsTableColumnProtected;
		});
		var aMissingColumnsValues = _.map(aMissingColumns, function(sMissingColumn) {
			return null;
		});
		return _.extend({}, _.zipObject(aMissingColumns, aMissingColumnsValues), oFilteredCv);	
	};

	/**
	 * Given an resultSet of a statement execution and the metaData of the result set this function creates an array of objects that will
	 * contain Columns Names and an array with function to be called in order to get the values This will be used for reading from a
	 * resultset without knowing the column names and column types Ex: [{ columnName: "ExampleColumnName", getValueFunction:
	 * [oResultSet.getInteger] }]
	 * 
	 * @param {object}
	 *            oResultSet - the ResultSet of a common statement execution
	 * @param {object}
	 *            oResultSetMetadata - the metadata of the ResultSet *
	 * @returns {array} aResultSetMetadata - an array of objects containing column name and function to be call for this column
	 */
	this.createResultSetMetadata = function(oResultSet, oResultSetMetadata) {
		var aResultSetMetadata = [];
		var iColumnCount = oResultSetMetadata.getColumnCount();
		for (var columnIndex = 1; columnIndex <= iColumnCount; columnIndex++) {
			var sColumnTypeName = oResultSetMetadata.getColumnTypeName(columnIndex);
			var sColumnName = oResultSetMetadata.getColumnName(columnIndex);
			var oMetadataObject = {
				columnName : "",
				getValueFunction : []
			};
			switch (sColumnTypeName) {
				case "TINYINT":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getInteger);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "SMALLINT":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getInteger);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "INT":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getInteger);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "INTEGER":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getInteger);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "BIGINT":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getBigInt);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "DECIMAL":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getDecimal);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "REAL":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getReal);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "DOUBLE":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getDouble);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "CHAR":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getString);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "VARCHAR":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getString);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "NCHAR":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getNString);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "NVARCHAR":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getNString);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "BINARY":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getBString);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "VARBINARY":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getBString);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "DATE":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getDate);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "TIME":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getTime);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "TIMESTAMP":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getTimestamp);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "CLOB":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getClob);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "NCLOB":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getNClob);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "BLOB":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getBlob);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "SMALLDECIMAL":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getDecimal);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "TEXT":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getText);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "SHORTTEXT":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getNString);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "SECONDDATE":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getSeconddate);
					aResultSetMetadata.push(oMetadataObject);
					break;
				case "FLOAT":
					oMetadataObject.columnName = sColumnName;
					oMetadataObject.getValueFunction.push(oResultSet.getFloat);
					aResultSetMetadata.push(oMetadataObject);
					break;
				default: {
					const sClientMsg = "Invalid data format.";
					const sServerMsg = `${sClientMsg} Column type name: ${sColumnTypeName}.`;
					$.trace.error(sServerMsg);
					throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
				}
			}
		}
		return aResultSetMetadata;
    };
    
    /**
     * Get all existing currencies under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return currencies are valid
     * @return ResultSet object containing the found currencies.
     */
    this.getExistingCurrencies = function (dMasterdataTimestamp){
        return dbConnection.executeQuery(`
            select currency_id
            from "sap.plc.db::basis.t_currency"
                        where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
        `, dMasterdataTimestamp, dMasterdataTimestamp);
    };

    /**
     * Get all existing unit of measures under the consideration of a given master data timestamp. Unit of measures
     * in PLC and replicated tables are considered.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found unit of measures.
     */
    this.getExistingUnitOfMeasures = function (dMasterdataTimestamp) {
        return dbConnection.executeQuery(`
            select uom_id 
            from "sap.plc.db::basis.t_uom"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
            union
            select msehi as uom_id
            from "sap.plc.db::repl.t006";
        `, dMasterdataTimestamp, dMasterdataTimestamp);
    };

    /**
     * Get all existing controlling areas. Controlling areas in PLC and replicated tables are considered.
     *
     * @return ResultSet object containing the found entities.
     */
    this.getExistingControllingAreas = function () {
        // controlling area entities are not versioned => no valid_from/to consideration necessary
        return dbConnection.executeQuery(`
            select controlling_area_id 
            from "sap.plc.db::basis.t_controlling_area"
            union
            select kokrs as controlling_area_id 
            from "sap.plc.db::repl.tka01";
        `);
    };

    /**
     * Get all existing exchange rate types.
     *
     * @return ResultSet object containing the found entities.
     */
    this.getExistingExchangeRateTypes = function () {
        // exchange rate type entities are not versioned => no valid_from/to consideration necessary
        return dbConnection.executeQuery(`
            select exchange_rate_type_id
            from "sap.plc.db::basis.t_exchange_rate_type";
        `);
    };

     /**
     * Get all existing exchange rate types.
     *
     * @return ResultSet object containing the found entities.
     */
    this.getExistingPriceSources = function () {
        // price sources entities are not versioned => no valid_from/to consideration necessary
        return dbConnection.executeQuery(`
            select price_source_id
            from "sap.plc.db::basis.t_price_source";
        `);
    };

     /**
     * Get all existing costing sheets in a specific controlling area and under the consideration of a given master data timestamp.
     *
     * @param sControllingAreaId Controlling area the costing sheets are defined in 
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingCostingSheets = function (sControllingAreaId, dMasterdataTimestamp) {
        return dbConnection.executeQuery(`
            select costing_sheet_id
            from "sap.plc.db::basis.t_costing_sheet"
            where       _valid_from <= ?
                    and(_valid_to > ? or _valid_to is null)
                    and controlling_area_id  = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId);
    };

    /**
     * Get all existing component splits in a specific controlling area and under the consideration of a given master data timestamp.
     *
     * @param sControllingAreaId Controlling area the component splits are defined in 
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingComponentSplits = function (sControllingAreaId, dMasterdataTimestamp) {
        return dbConnection.executeQuery(`
            select component_split_id
            from "sap.plc.db::basis.t_component_split"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
                and controlling_area_id  = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId);
    };
    
    /**
     * Get all existing accounts in a specific controlling area and under the consideration of a given master data timestamp.
     *
     * @param sControllingAreaId Controlling area the accounts are defined in 
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingAccounts = function (sControllingAreaId, dMasterdataTimestamp) {
        return dbConnection.executeQuery(`
            select account_id
            from "sap.plc.db::basis.t_account"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
                and controlling_area_id  = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId);
    };  

    /**
     * Get all existing account groups in a specific controlling area and under the consideration of a given master data timestamp.
     *
     * @param sControllingAreaId Controlling area the accounts are defined in 
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingAccountGroups = (sControllingAreaId, dMasterdataTimestamp, iAccountGroupId) => {
        return dbConnection.executeQuery(`
            select account_group_id
            from "sap.plc.db::basis.t_account_group"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
				and controlling_area_id  = ?
				and account_group_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId, iAccountGroupId);
    };

    /**
     * Get all existing material groups under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingMaterialGroups = (dMasterdataTimestamp, sMaterialGroupId) =>{
        return dbConnection.executeQuery(`
            select material_group_id
            from "sap.plc.db::basis.t_material_group"
            where   _valid_from <= ?
				and (_valid_to > ? or _valid_to is null)
				and material_group_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sMaterialGroupId);
    };
    
    /**
     * Get all existing material types under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingMaterialTypes = (dMasterdataTimestamp, sMaterialTypeId) => {
        return dbConnection.executeQuery(`
            select material_type_id
            from "sap.plc.db::basis.t_material_type"
            where   _valid_from <= ?
				and (_valid_to > ? or _valid_to is null)
				and material_type_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sMaterialTypeId);
    };
    
    /**
     * Get all existing document types under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingDocumentTypes = (dMasterdataTimestamp) => {
        return dbConnection.executeQuery(`
            select document_type_id
            from "sap.plc.db::basis.t_document_type"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
        `, dMasterdataTimestamp, dMasterdataTimestamp);
    };
    
    /**
     * Get all existing document statuses under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingDocumentStatuses = (dMasterdataTimestamp) => {
        return dbConnection.executeQuery(`
            select document_status_id
            from "sap.plc.db::basis.t_document_status"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
        `, dMasterdataTimestamp, dMasterdataTimestamp);
    };
    
    /**
     * Get all existing overhead groups under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingOverheadGroups = (dMasterdataTimestamp) => {
        return dbConnection.executeQuery(`
            select overhead_group_id
            from "sap.plc.db::basis.t_overhead_group"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
        `, dMasterdataTimestamp, dMasterdataTimestamp);
    };
    
    /**
     * Get all existing valuation classes under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingValuationClasses = (dMasterdataTimestamp) => {
        return dbConnection.executeQuery(`
            select valuation_class_id
            from "sap.plc.db::basis.t_valuation_class"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
        `, dMasterdataTimestamp, dMasterdataTimestamp);
    };

     /**
     * Get all existing plants under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingPlants = function (dMasterdataTimestamp, sPlantId) {
        return dbConnection.executeQuery(`
            select plant_id
            from "sap.plc.db::basis.t_plant"
            where   _valid_from <= ?
				and (_valid_to > ? or _valid_to is null)
				and plant_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sPlantId);
    };

     /**
     * Get all cost centers in a specific controlling area and under the consideration of a given master data timestamp.
     *
     * @param sControllingAreaId Controlling area the accounts are defined in
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingCostCenter = function (sControllingAreaId, dMasterdataTimestamp, sCostCenterId) {
        return dbConnection.executeQuery(`
            select cost_center_id
            from "sap.plc.db::basis.t_cost_center"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
				and controlling_area_id  = ?
				and cost_center_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId, sCostCenterId);
    };

     /**
     * Get all activity types in a specific controlling area and under the consideration of a given master data timestamp.
     *
     * @param sControllingAreaId Controlling area the accounts are defined in
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingActivityTypes = function (sControllingAreaId, dMasterdataTimestamp, sActivityTypeId) {
        return dbConnection.executeQuery(`
            select activity_type_id
            from "sap.plc.db::basis.t_activity_type"
            where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null)
				and controlling_area_id  = ?
				and activity_type_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId, sActivityTypeId);
	};

	/**
     * Get all existing materials under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @return ResultSet object containing the found entities.
     */
    this.getExistingMaterials = function (dMasterdataTimestamp, sMaterialId) {
        return dbConnection.executeQuery(`
            select material_id
            from "sap.plc.db::basis.t_material"
            where   _valid_from <= ?
				and (_valid_to > ? or _valid_to is null)
				and material_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sMaterialId);
    };
	
	/**
     * Get all material price determination strategies.
     *
     * @return ResultSet object containing the found entities.
     */
    this.getExistingMaterialPriceStrategies = function () {
		return dbConnection.executeQuery(`
			select PRICE_DETERMINATION_STRATEGY_ID
			from "sap.plc.db::basis.t_price_determination_strategy"
			where PRICE_DETERMINATION_STRATEGY_TYPE_ID = ?
		`, constants.PriceStrategiesTypes.Material);
	};
	
	/**
     * Get all activity price determination strategies.
     *
     * @return ResultSet object containing the found entities.
     */
    this.getExistingActivityPriceStrategies = function () {
		return dbConnection.executeQuery(`
			select PRICE_DETERMINATION_STRATEGY_ID
			from "sap.plc.db::basis.t_price_determination_strategy"
			where  PRICE_DETERMINATION_STRATEGY_TYPE_ID = ?
		`, constants.PriceStrategiesTypes.Activity);
	};
	
	/**
     * Get regex value from table t_regex (based on a regexId).
     *
     * @param sRegexId Timestamp defining the point in time the return unit of measures are valid
     * @return string containing regex value.
     */
	this.getRegexValue = function (sRegexId){
		let sStmt = `SELECT VALIDATION_REGEX_VALUE FROM "${Tables.regex}" WHERE VALIDATION_REGEX_ID = ?`;
		let oQueryResult = dbConnection.executeQuery(sStmt,sRegexId);
		if(oQueryResult.length > 0){
			return oQueryResult[0].VALIDATION_REGEX_VALUE || null;
		}
		return null;
	};

    /**
     * This utility function takes a result set object and puts all values for a specific column in a Set, for further processing.
     * The Set provides efficient look-up performance and should be used if the business logic does intensive checks on the values. 
     * 
     * @param oResultSet 
     * @param sPropertyName
     * @return A Set object containing all (distinct) values of the specified column in the result set object. 
     */
    this.createValueSetFromResult = function (oResultSet, sColumnName) {
        return new Set(Array.from(oResultSet).map(oEntity => oEntity[sColumnName]));
    };

    /**
     * Check if valid currency exists.
     *
     *@param sCurrencyId Currency Id
     * @param dMasterdataTimestamp Timestamp defining the point in time when the existence check is done
     * @return Boolean True if currency exists, false otherwise
     */
    this.currencyExists = function (sCurrencyId, dMasterdataTimestamp){
        let oCurrency = dbConnection.executeQuery(`
            select count(currency_id) as count
            from "sap.plc.db::basis.t_currency"
                        where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null) and currency_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sCurrencyId);
        return parseInt(oCurrency[0].COUNT, 10) > 0;
    };
    
    /**
     * Check if valid unit of measure exists.
     *
     *@param sUomId Currency Id
     * @param dMasterdataTimestamp Timestamp defining the point in time when the existence check is done
     * @return Boolean True if uom exists, false otherwise
     */
    this.uomExists = function (sUomId, dMasterdataTimestamp){
        let oUom = dbConnection.executeQuery(`
            select count(uom_id) as count
            from "sap.plc.db::basis.t_uom"
                        where   _valid_from <= ?
                and (_valid_to > ? or _valid_to is null) and uom_id = ?
        `, dMasterdataTimestamp, dMasterdataTimestamp, sUomId);
        return parseInt(oUom[0].COUNT, 10) > 0; 
    };
    
	this.setHQuery = function(oHQuery) {
		hQuery = oHQuery;
	};

    /**
     * Get all of existing non-temporary master data of a given master data timestamp and controlling area ID.
	 * This function is added to combine multiple DB queries into one for performance enhancement.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
     * @param sControllingAreaId Controlling area the accounts are defined in
     * @return Object containing the found entities.
     */
	this.getExistingNonTemporaryMasterdataCombined = function (dMasterdataTimestamp, sControllingAreaId) {
		let oResultSet = dbConnection.executeQuery(`
			select *
			from (
				select currency_id as col_value, 'CURRENCY_ID' as col_name
					from "sap.plc.db::basis.t_currency"
						where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
				)
			union all (
				select uom_id as col_value, 'UOM_ID' as col_name
					from (select uom_id
							from "sap.plc.db::basis.t_uom"
							where   _valid_from <= ?
								and (_valid_to > ? or _valid_to is null)
							union
							select msehi as uom_id
							from "sap.plc.db::repl.t006")
			)
			union all (
				select account_id as col_value, 'ACCOUNT_ID' as col_name
					from "sap.plc.db::basis.t_account"
					where   _valid_from <= ?
						and (_valid_to > ? or _valid_to is null)
						and controlling_area_id  = ?
			)
			union all (
				select costing_sheet_id as col_value, 'COSTING_SHEET_ID' as col_name
				from "sap.plc.db::basis.t_costing_sheet"
				where _valid_from <= ?
					and(_valid_to > ? or _valid_to is null)
					and controlling_area_id  = ?
			)
			union all (
				select component_split_id as col_value, 'COMPONENT_SPLIT_ID' as col_name
				from "sap.plc.db::basis.t_component_split"
				where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
					and controlling_area_id  = ?
			)
			union all (
				select exchange_rate_type_id as col_value, 'EXCHANGE_RATE_TYPE_ID' as col_name
				from "sap.plc.db::basis.t_exchange_rate_type"
			)
			union all (
				select price_source_id as col_value, 'PRICE_SOURCE_ID' as col_name
				from "sap.plc.db::basis.t_price_source"
			)
			union all (
				select document_type_id as col_value, 'DOCUMENT_TYPE_ID' as col_name
				from "sap.plc.db::basis.t_document_type"
				where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
			)
			union all (
				select document_status_id as col_value, 'DOCUMENT_STATUS_ID' as col_name
				from "sap.plc.db::basis.t_document_status"
				where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
			)
			union all (
				select material_type_id as col_value, 'MATERIAL_TYPE_ID' as col_name
				from "sap.plc.db::basis.t_material_type"
				where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
			)
			union all (
				select material_group_id as col_value, 'MATERIAL_GROUP_ID' as col_name
				from "sap.plc.db::basis.t_material_group"
				where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
			)
			union all (
				select overhead_group_id as col_value, 'OVERHEAD_GROUP_ID' as col_name
				from "sap.plc.db::basis.t_overhead_group"
				where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
			)
			union all (
				select valuation_class_id as col_value, 'VALUATION_CLASS_ID' as col_name
				from "sap.plc.db::basis.t_valuation_class"
				where   _valid_from <= ?
					and (_valid_to > ? or _valid_to is null)
			)
			union all (
				select price_determination_strategy_id as col_value, 'MATERIAL_PRICE_STRATEGY_ID' as col_name
				from "sap.plc.db::basis.t_price_determination_strategy"
				where price_determination_strategy_type_id = 1
			)
			union all (
				select price_determination_strategy_id as col_value, 'ACTIVITY_PRICE_STRATEGY_ID' as col_name
				from "sap.plc.db::basis.t_price_determination_strategy"
				where price_determination_strategy_type_id = 2
			);`,
			dMasterdataTimestamp, dMasterdataTimestamp, // from getExistingCurrencies
			dMasterdataTimestamp, dMasterdataTimestamp, // from getExistingUnitOfMeasures
			dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId, // from getExistingAccounts
			dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId, // from getExistingCostingSheets
			dMasterdataTimestamp, dMasterdataTimestamp, sControllingAreaId, // from getExistingComponentSplits
			dMasterdataTimestamp, dMasterdataTimestamp, // from getExistingDocumentTypes
			dMasterdataTimestamp, dMasterdataTimestamp, // from getExistingDocumentStatuses
			dMasterdataTimestamp, dMasterdataTimestamp, // from getExistingMaterialTypes
			dMasterdataTimestamp, dMasterdataTimestamp, // from getExistingMaterialGroups
			dMasterdataTimestamp, dMasterdataTimestamp, // from getExistingOverheadGroups
			dMasterdataTimestamp, dMasterdataTimestamp  // from getExistingValuationClasses
		);

		let extract = function (col_name) {
			let result = [];
			for (var row of oResultSet) {
				if (row.COL_NAME === col_name) {
					let e = {};
					e[row.COL_NAME] = row.COL_VALUE;
					result.push(e);
				}
			}
			return result;
		};
		let oResult = {
			CURRENCIES: extract('CURRENCY_ID'),
			UNIT_OF_MEASURES: extract('UOM_ID'),
			ACCOUNTS: extract('ACCOUNT_ID'),
			COSTING_SHEETS: extract('COSTING_SHEET_ID'),
			COMPONENT_SPLITS: extract('COMPONENT_SPLIT_ID'),
			EXCHANGE_RATE_TYPES: extract('EXCHANGE_RATE_TYPE_ID'),
			PRICE_SOURCES: extract('PRICE_SOURCE_ID'),
			DOCUMENT_TYPES: extract('DOCUMENT_TYPE_ID'),
			DOCUMENT_STATUSES: extract('DOCUMENT_STATUS_ID'),
			MATERIAL_TYPES: extract('MATERIAL_TYPE_ID'),
			MATERIAL_GROUPS: extract('MATERIAL_GROUP_ID'),
			OVERHEADS: extract('OVERHEAD_GROUP_ID'),
			VALUATION_CLASSES: extract('VALUATION_CLASS_ID'),
			MATERIAL_PRICE_STRATEGIES: extract('MATERIAL_PRICE_STRATEGY_ID'),
			ACTIVITY_PRICE_STRATEGIES: extract('ACTIVITY_PRICE_STRATEGY_ID'),
		};
		return oResult;
	}

	/**
	* Checks whether the entity id exists in the given table.
	* @param {integer} - iEntityId - the id of the folder that should be checked
	* @param {string} - sTable - the table where the entity exists
	* @returns {boolean} - true if the entity id exists, otherwise false
	*/
	this.entityExists = function (iEntityId, sTable) {
		return this.exists([iEntityId], sTable, "ENTITY_ID");
	};

	/**
	* Update the relation between an entity and it's parent
	* @param {integer} iEntityId - the id of the entity
	* @param {integer} iParentEntityId - the id of the new parent entity id
	* @returns {object} - the updated object
	*/
	this.updateEntityRelation = function (iEntityId, iParentEntityId) {
		const oEntityParent = {
			"PARENT_ENTITY_ID": iParentEntityId
		};
		const oSettings = {
			TABLE : Tables.entity_relation,
			WHERE_PROPERTIES : {
				ENTITY_ID: iEntityId
			}
		};
		return this.updateEntity(oEntityParent, oSettings);
	};

	/**
	* Returns the path for a given entity id
	* @param {integer} - iEntityId - the id of the entity
	* @returns {string} - return value is a string that represents the path ex: "11/22/33/42"
	*/
	this.getPath = function (iEntityId) {
		const sPath = this.selectEntities({
			TABLE: Views.entity_relation,
			COLUMNS: ["PATH"],
			WHERE_PROPERTIES: {
				"QUERY_NODE": iEntityId
			}
		})
		return sPath[0] ? sPath[0].PATH : "";
	};
}

Helper.prototype = Object.create(Helper.prototype);
Helper.prototype.constructor = Helper;

module.exports.Helper = Helper;