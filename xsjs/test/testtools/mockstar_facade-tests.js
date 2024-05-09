if(jasmine.plcTestRunParameters.mode === 'all'){
    describe('MockstarFacade', function() {
        var realMockstar = require('@sap/xsjs-test/lib/mockstar/apiFacade');
        var sqlExecutorFake    = null,
            SqlExecutorFake    = null,
            tableUtilsFake     = null,
            TableUtilsFake     = null,
            tableDataSetFake   = null;
        
        var MockstarFacade = require("./mockstar_facade").MockstarFacade;
        var mockstar = null;
        var PlcSchema = require("../../lib/xs/db/connection/connection").getContainerSchema($);
        
        // Create fake Procedure function
        var procedureResult = {};
        var procedureFunction = function() {
            return procedureResult;
        };
        
        // Create fake TableUtils object
        tableUtilsFake = {
            copyIntoUserSchema: function(schema, name, newName) {
                return `"${newName||name}"`;
            },
            createTestTableFromView:  function(schema, name) {
                return name;
            },
            clearTableInUserSchema: function() {},
            fillFromCsvFile: function() {}
        };
        beforeEach(function() {
            sqlExecutorFake = jasmine.createSpyObj('SqlExecutor', ['execSingle', 'execSingleIgnoreFailing', 'execQuery']);
            tableDataSetFake = jasmine.createSpyObj('tableDataSet', ['createFromResultSet', 'createFromJSON', 'createFromArray', 'isTableDataSet']);
            
            spyOn(realMockstar, 'createTestModel').and.callFake(function(testmodel, targetPackage, dependencySubstitutions, options) {
                return {runTimePath: `"${PlcSchema}"."${testmodel}`};
            });
            spyOn(jasmine.dbConnection, 'loadProcedure').and.returnValue(procedureFunction);
            spyOn(jasmine.dbConnection, 'executeUpdate');
            spyOn(jasmine.dbConnection, 'executeQuery');
            
            SqlExecutorFake = function() {
                this.execSingle = sqlExecutorFake.execSingle;
                this.execSingleIgnoreFailing = sqlExecutorFake.execSingleIgnoreFailing;
                this.execQuery = sqlExecutorFake.execQuery;
            };
            spyOn(tableUtilsFake, 'copyIntoUserSchema').and.callThrough();
            spyOn(tableUtilsFake, 'createTestTableFromView').and.callThrough();
            spyOn(tableUtilsFake, 'clearTableInUserSchema');
            spyOn(tableUtilsFake, 'fillFromCsvFile');
            
            TableUtilsFake = function() {
                this.copyIntoUserSchema = tableUtilsFake.copyIntoUserSchema;
                this.createTestTableFromView = tableUtilsFake.createTestTableFromView;
                this.clearTableInUserSchema = tableUtilsFake.clearTableInUserSchema;
                this.fillFromCsvFile = tableUtilsFake.fillFromCsvFile;
            };
        });
        
        function initMockstar(definition, oOverrideArguments) {
            var oArguments = {
                // default arguments
                SqlExecutor: SqlExecutorFake,
                TableUtils: TableUtilsFake,
                mockstar: realMockstar,
                tableDataSet: tableDataSetFake
            };
            // override arguments in case tests need a specific setting
            if(oOverrideArguments){
                Object.keys(oOverrideArguments).forEach(arg => oArguments[arg] = oOverrideArguments[arg]);
            }
            return new MockstarFacade(definition, oArguments);
        }
        describe('Constructor function and define', function() {
        
            it('define specifies all substitute tables, views and procedures without data', function() {
                // prepare
                mockstar = new MockstarFacade(null,
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake
                    });
                
                // act
                mockstar.define(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.plc.db::basis.t_item"
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                        substituteProcs:
                            [
                                {
                                    name: "sap.test::my_proc",
                                    schema: "SAP_EPC",
                                    testProc: "sap.test::my_test_proc",
                                    testSchema: "SAP_TEST"
                                }
                            ],
                        csvPackage: "bla.blub",
                        csvProperties: {
                            separator : ';',
                            headers : false,
                            decSeparator : '.'
                        }
                    }
                );
                
                // assert
                expect(mockstar.getTable("item")).toEqual("sap.plc.db::basis.t_item");
                expect(Object.keys(mockstar.getSubstituteTables()).length).toBe(2);
                expect(mockstar.getView("view")).toEqual("sap.db::v_item");
                expect(Object.keys(mockstar.getSubstituteProcs()).length).toBe(1);
                expect(mockstar.testmodel).toEqual("sap.plc.db.calculationmanager.procedures/p_calculation_version_open");
                expect(mockstar.csvPackage).toEqual("bla.blub");
                expect(mockstar.csvProperties).toEqual({ separator : ';', headers : false, decSeparator : '.' });
                
                expect(mockstar.copiedTestModel).toEqual({runTimePath: `"${PlcSchema}"."sap.plc.db.calculationmanager.procedures::p_calculation_version_open"`});
            });
            
            it('define specifies all substitute tables and views with data', function() {
                // prepare
                mockstar = new MockstarFacade(null,
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake
                    });
                spyOn(mockstar, 'insertTableData');
                
                // act
                mockstar.define(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item":
                                {
                                    name: "sap.db::basis.t_item",
                                    data:
                                    {
                                        "Header1": 1,
                                        "Header2": "value"
                                    }
                                }
                            },
                        substituteViews:
                            {
                                "view":
                                {
                                    name: "sap.db::basis.v_item",
                                    testTable:"sap.db::basis.v_item_test",
                                    data:
                                    {
                                        "Header1": [1,2,3],
                                        "Header2": ["value", "value2", "value3"]
                                    }
                                }
                            }
                    }
                );
                
                // assert
                expect(mockstar.getTable("item")).toEqual("sap.db::basis.t_item");
                expect(Object.keys(mockstar.getSubstituteTables()).length).toBe(2);
                expect(mockstar.getView("view")).toEqual("sap.db::basis.v_item");
                expect(mockstar.testmodel).toEqual("sap.plc.db.calculationmanager.procedures/p_calculation_version_open");
                expect(mockstar.copiedTestModel).toEqual({runTimePath: `"${PlcSchema}"."sap.plc.db.calculationmanager.procedures::p_calculation_version_open"`});
                //expect(mockstar.insertTableData.calls.count()).toBe(2);
            });
            
            it('define specifies substitute table and fill data from csv file', function() {
                // prepare
                mockstar = new MockstarFacade(null,
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake
                    });
                
                // act
                mockstar.define(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item":
                                {
                                    name: "sap.db::basis.t_item",
                                    data:"test.csv"
                                }
                            },
                        csvPackage: "bla.blub"
                    }
                );
                mockstar.initializeData();
                // assert
                expect(tableUtilsFake.fillFromCsvFile.calls.count()).toBe(1);
                expect(tableUtilsFake.fillFromCsvFile).toHaveBeenCalledWith(mockstar.getFullTableName("item"), mockstar.csvPackage, "test.csv", mockstar.csvProperties);
            });
            it('define specifies multiple testmodels sharing the same substitute tables and views', function() {
                // prepare
                mockstar = new MockstarFacade(null,
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake
                    });
                
                // act
                mockstar.define(
                    {
                        testmodel: {
                            "open": "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                            "close": "sap.plc.db.calculationmanager.procedures/p_calculation_version_close"
                        },
                        substituteTables:
                            {
                                "item": "sap.plc.db::basis.t_item"
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                        substituteProcs:
                            [
                                {
                                    name: "sap.test::my_proc",
                                    schema: "SAP_EPC",
                                    testProc: "sap.test::my_test_proc",
                                    testSchema: "SAP_TEST"
                                }
                            ]
                    }
                );
                
                // assert
                expect(mockstar.getTable("item")).toEqual("sap.plc.db::basis.t_item");
                expect(Object.keys(mockstar.getSubstituteTables()).length).toBe(2);
                expect(mockstar.getView("view")).toEqual("sap.db::v_item");
                expect(Object.keys(mockstar.getSubstituteProcs()).length).toBe(1);
                expect(mockstar.testmodel["open"]).toEqual("sap.plc.db.calculationmanager.procedures/p_calculation_version_open");
                expect(mockstar.testmodel["close"]).toEqual("sap.plc.db.calculationmanager.procedures/p_calculation_version_close");
                
                expect(mockstar.copiedTestModel["open"]).toEqual({runTimePath: `"${PlcSchema}"."sap.plc.db.calculationmanager.procedures/p_calculation_version_open"`});
                expect(mockstar.copiedTestModel["close"]).toEqual({runTimePath: `"${PlcSchema}"."sap.plc.db.calculationmanager.procedures/p_calculation_version_close"`});
            });
            
            it('Constructor specifies all substitute tables, views and procedures without data', function() {
                // act
                mockstar = new MockstarFacade(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.plc.db::basis.t_item"
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                        substituteProcs:
                            [
                                {
                                    name: "sap.test::my_proc",
                                    testProc: "sap.test::my_test_proc"
                                }
                            ],
                        csvPackage: "bla.blub"
                            
                    },
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake
                    }
                );
                
                // assert
                expect(mockstar.getTable("item")).toEqual("sap.plc.db::basis.t_item");
                expect(Object.keys(mockstar.getSubstituteTables()).length).toBe(2);
                expect(mockstar.getView("view")).toEqual("sap.db::v_item");
                expect(Object.keys(mockstar.getSubstituteProcs()).length).toBe(1);
                expect(mockstar.testmodel).toEqual("sap.plc.db.calculationmanager.procedures/p_calculation_version_open");
                expect(mockstar.csvPackage).toEqual("bla.blub");
                expect(mockstar.copiedTestModel).toEqual({runTimePath: `"${PlcSchema}"."sap.plc.db.calculationmanager.procedures::p_calculation_version_open"`});
            });
            
            it('define specifies only substitute tables, no testmodel', function() {
                // prepare
                mockstar = new MockstarFacade(null,
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake
                    });
                
                // act
                mockstar.define(
                    {
                        substituteTables:
                            {
                                "item": "sap.plc.db::basis.t_item"
                            }
                    }
                );
                
                // assert
                expect(mockstar.getTable("item")).toEqual("sap.plc.db::basis.t_item");
                expect(Object.keys(mockstar.getSubstituteTables()).length).toBe(1);
                expect(mockstar.testmodel).toEqual(null);
                
                expect(realMockstar.createTestModel).not.toHaveBeenCalled();
            });
            it('define specifies substitute tables and views with explicit schema', function() {
                // prepare
                mockstar = new MockstarFacade(null,
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake
                    });
                spyOn(mockstar, 'insertTableData');
                
                // act
                mockstar.define(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item":
                                {
                                    name: "sap.db::basis.t_item",
                                    schema: "sap.test"
                                }
                            },
                        substituteViews:
                            {
                                "view":
                                {
                                    name: "sap.db::basis.v_item",
                                    schema: "sap.test",
                                    testTable:"sap.db::basis.v_item_test"
                                }
                            }
                    }
                );
                
                // assert
                expect(mockstar.getTable("item")).toEqual("sap.db::basis.t_item");
                expect(mockstar.getTableSchema("item")).toEqual("sap.test");
                expect(Object.keys(mockstar.getSubstituteTables()).length).toBe(2);
                expect(mockstar.getView("view")).toEqual("sap.db::basis.v_item");
                expect(mockstar.getViewSchema("view")).toEqual("sap.test");
                expect(mockstar.testmodel).toEqual("sap.plc.db.calculationmanager.procedures/p_calculation_version_open");
                expect(mockstar.copiedTestModel).toEqual({runTimePath: `"${PlcSchema}"."sap.plc.db.calculationmanager.procedures::p_calculation_version_open"`});
            });
        });
        
        describe('ClearTables functions', function() {
            it('clearTables should delete a given set of tables as arguments', function() {
                
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                                "item2": "sap.db::t_item2",
                                "item3": "sap.db::t_item3",
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                    }
                );
            
                // act
                mockstar.clearTables('item', 'item2', 'item3');
                
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalled();
            });
            
            it('clearTables should delete a given set of tables as single array', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                                "item2": "sap.db::t_item2",
                                "item3": "sap.db::t_item3",
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                    }
                );
            
                // act
                mockstar.clearTables(['item', 'item2', 'item3']);
                
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalled();
            });
            it('clearTable should delete a given single table', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                                "item2": "sap.db::t_item2",
                                "item3": "sap.db::t_item3",
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                    }
                );
        
                // act
                mockstar.clearTable('item');
                
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalledWith(`delete from "${PlcSchema}"."sap.db::t_item"`);
            });
            it('clearAllTables should all specified substitute tables', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                                "item2": "sap.db::t_item2",
                                "item3": "sap.db::t_item3",
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                    }
                );
        
                // act
                mockstar.clearAllTables();
                
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalled();
            });
        });
        
        it('execQuery should call sqlExecutor.execQuery and replace table aliases by full table names', function() {
            mockstar = initMockstar(
                {
                    testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                    substituteTables:
                        {
                            "item": "sap.db::t_item",
                            "item2": "sap.db::t_item2",
                        }
                }
            );
            // act
            mockstar.execQuery('select * from {{item}} as it1, {{item2}} as it2 where it1.id=it2.id');
            
            // assert
            expect(jasmine.dbConnection.executeQuery).toHaveBeenCalledWith(`select * from "${PlcSchema}"."sap.db::t_item" as it1, "${PlcSchema}"."sap.db::t_item2" as it2 where it1.id=it2.id`);
        });
        it('execSingle should call sqlExecutor.execSingle', function() {
            mockstar = initMockstar(
                {
                    testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                    substituteTables:
                        {
                            "item": "sap.db::t_item",
                            "item2": "sap.db::t_item2",
                        }
                }
            );
            // act
            mockstar.execSingle('update {{item}} set name=\'test\' where id=5');
            
            // assert
            expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalledWith(`update "${PlcSchema}"."sap.db::t_item" set name='test' where id=5`);
        });
        describe('call function', function() {
            it('should build a SQL procedure call with no arguments and use jasmine.dbConnection.loadProcedure to call the procedure', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open"
                    }
                );
                outParameterTypes = [];
        
                // act
                mockstar.call();
                
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(PlcSchema, "sap.plc.db.calculationmanager.procedures::p_calculation_version_open");
            });
        
            it('should build a SQL procedure call with no arguments and use jasmine.dbConnection.loadProcedure to call the procedure, with multiple testmodels', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: {
                            "open": "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                            "close": "sap.plc.db.calculationmanager.procedures/p_calculation_version_close"
                        }
                    }
                );
                outParameterTypes = [];
        
                // act
                mockstar.call["open"]();
                mockstar.call["close"]();
                
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(PlcSchema, "sap.plc.db.calculationmanager.procedures/p_calculation_version_open");
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(PlcSchema, "sap.plc.db.calculationmanager.procedures/p_calculation_version_close");
            });
            it('should build a SQL procedure call with one IN argument and use jasmine.dbConnection.loadProcedure to call the procedure', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open"
                    }
                );
                outParameterTypes = [];
                // act
                mockstar.call(1);
                
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(PlcSchema, "sap.plc.db.calculationmanager.procedures::p_calculation_version_open");
            });
        
            it('should build a SQL procedure call with 3 IN arguments and use jasmine.dbConnection.loadProcedure to call the procedure', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open"
                    }
                );
                outParameterTypes = [];
                // act
                mockstar.call(1, 'string', 3);
                
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(PlcSchema, "sap.plc.db.calculationmanager.procedures::p_calculation_version_open");
                // (1,\'string\',3)  // TODO: Check call parameters
            });
        
            it('call should build a SQL procedure call with one IN argument and one table OUT argument and use jasmine.dbConnection.loadProcedure to call the procedure', function() {
                // prepare
        
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open"
                    }
                );
                outParameterTypes = [$.db.types.TABLE];
    
                var fakeResultSet = {};
                fakeResultSet.prototype = $.hdb.ResultSet;
                procedureResult = { a: fakeResultSet };
                
                // act
                mockstar.call(1, null);
                
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(PlcSchema, "sap.plc.db.calculationmanager.procedures::p_calculation_version_open");
                // (1,?)   // TODO: Check call parameters
                //expect(tableDataSetFake.createFromResultSet).toHaveBeenCalledWith(resultSet);
            });
            
            it('call should build a SQL procedure call with several OUT arguments of different types and use jasmine.dbConnection.loadProcedure to call the procedure', function() {
                // prepare
        
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open"
                    }
                );
                outParameterTypes = [$.db.types.INT, $.db.types.DATE, $.db.types.TIMESTAMP, $.db.types.DECIMAL, $.db.types.TABLE];
                var fakeResultSet = {};
                fakeResultSet.prototype = $.hdb.ResultSet;
                procedureResult = { a: fakeResultSet, b: fakeResultSet, c: fakeResultSet, d: fakeResultSet, e: fakeResultSet };
    
                // act
                mockstar.call(null, null, null, null, null);
                
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(PlcSchema, "sap.plc.db.calculationmanager.procedures::p_calculation_version_open");
                // (?,?,?,?,?)');   // TODO: Check call parameters
                //expect(tableDataSetFake.createFromResultSet).toHaveBeenCalledWith(resultSet);
            });
            
        });
        
        
        it('fillFromCsvFile should fill a table with csv data, use tableUtils.fillFromCsvFile, and take global csvPackage parameter', function() {
            // prepare
            mockstar = initMockstar(
                {
                    testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                    substituteTables:
                        {
                            "item": "sap.db::t_item"
                        },
                    csvPackage: "bla.blub"
                }
            );
            
            // act
            mockstar.fillFromCsvFile("item", "test.csv");
            
            // assert
            expect(tableUtilsFake.fillFromCsvFile).toHaveBeenCalledWith(`"${PlcSchema}"."sap.db::t_item"`, "bla.blub", "test.csv", mockstar.csvProperties);
        });
        it('fillFromCsvFile should fill a table with csv data, use tableUtils.fillFromCsvFile, and take csv package from given csv name (separated by :)', function() {
            // prepare
            mockstar = initMockstar(
                {
                    testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                    substituteTables:
                        {
                            "item": "sap.db::t_item"
                        },
                    csvPackage: "bla.blub"
                }
            );
            
            // act
            mockstar.fillFromCsvFile("item", "my.defined.path::test.csv");
            
            // assert
            expect(tableUtilsFake.fillFromCsvFile).toHaveBeenCalledWith(`"${PlcSchema}"."sap.db::t_item"`, "my.defined.path", "test.csv", mockstar.csvProperties);
        });
        describe('insertTableData function', function() {

            it('insertTableData should insert data into a table using object with columns as key, row as value (single row)', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                    }
                );
                
                // act
                mockstar.insertTableData("item",
                    {
                        "Header1": 1,
                        "Header2": "value",
                        "Header3": null
                    });
        
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalledWith(`INSERT INTO "${PlcSchema}"."sap.db::t_item" ("Header1","Header2","Header3") VALUES (?,?,?)`,
                        1,'value',null);
            });
            it('insertTableData should insert data into a table using object with columns as key, array of values as value (multiple rows)', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                            },
                        substituteViews:
                            {
                                "view":
                                {
                                    name:"sap.db::v_item",
                                    testTable:"sap.db::basis.v_item_test"
                                }
                            },
                    }
                );
                
                // act
                mockstar.insertTableData("item",
                    {
                        "Header1": [1,2,null],
                        "Header2": ["value", "value2", null]
                    });
        
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalledWith(`INSERT INTO "${PlcSchema}"."sap.db::t_item" ("Header1","Header2") VALUES (?,?)`,
                        [[1,'value'], [2,'value2'], [null,null]]);
            });
            it('insertTableData should insert data into a table using an array of objects with columns as key, row as value', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                            },
                        substituteViews:
                            {
                                "view":
                                {
                                    name:"sap.db::v_item",
                                    testTable:"sap.db::basis.v_item_test"
                                }
                            },
                    }
                );
                
                // act
                mockstar.insertTableData("item",
                    {
                        "Header1": [1,2,null],
                        "Header2": ["value", "value2", null]
                    });
        
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalledWith(`INSERT INTO "${PlcSchema}"."sap.db::t_item" ("Header1","Header2") VALUES (?,?)`,
                        [[1,'value'], [2,'value2'], [null,null]]);
            });
            it('insertTableData should insert data into a table using csv file', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                            },
                        substituteViews:
                            {
                                "view":
                                    {
                                        name:"sap.db::v_item",
                                        testTable:"sap.db::basis.v_item_test"
                                    }
                            },
                        csvPackage: "bla.blub"
                    }
                );
                
                // act
                mockstar.insertTableData("item", "test.csv");
                // assert
                expect(tableUtilsFake.fillFromCsvFile).toHaveBeenCalledWith(`"${PlcSchema}"."sap.db::t_item"`, "bla.blub", "test.csv", mockstar.csvProperties);
            });
        });
        describe('UpsertTableData', function() {
            it('should upsert data in a table using object with columns, single rows with WHERE condition', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                            }
                    }
                );
                
                // act
                mockstar.upsertTableData("item",
                    {
                        "Header1": [1],
                        "Header2": ["value"]
                    },
                    '"Header1" = 1');
        
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalledWith(`UPSERT "${PlcSchema}"."sap.db::t_item" ("Header1","Header2") VALUES (?,?) WHERE "Header1" = 1`,
                        [[1,'value']]);
            });
            it('should upsert data in a table using object with columns, multiple rows, no WHERE condition', function() {
                // prepare
                mockstar = initMockstar(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                        substituteTables:
                            {
                                "item": "sap.db::t_item",
                            }
                    }
                );
                
                // act
                mockstar.upsertTableData("item",
                    {
                        "Header1": [1,2],
                        "Header2": ["value", "value2"]
                    });
                // assert
                expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalledWith(`UPSERT "${PlcSchema}"."sap.db::t_item" ("Header1","Header2") VALUES (?,?)`,
                        [[1,'value'],[2,'value2']]);
            });
        });
        
        it('initializeData should insert data into tables that has been defined with constructor or define', function() {
            mockstar = new MockstarFacade(null,
                {
                    SqlExecutor: SqlExecutorFake,
                    TableUtils: TableUtilsFake,
                    mockstar: realMockstar,
                    tableDataSet: tableDataSetFake
                });
            mockstar.define(
                {
                    testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                    substituteTables:
                        {
                            "item":
                            {
                                name: "sap.db::basis.t_item",
                                data:
                                {
                                    "Header1": 1,
                                    "Header2": "value"
                                }
                            }
                        },
                    substituteViews:
                        {
                            "view":
                            {
                                name: "sap.db::basis.v_item",
                                testTable:"sap.db::basis.v_item_test",
                                data:
                                {
                                    "Header1": [1,2,3],
                                    "Header2": ["value", "value2", "value3"]
                                }
                            }
                        }
                }
            );
            spyOn(mockstar, 'insertTableData');
            
            // act
            mockstar.initializeData();
            
            // assert
            expect(mockstar.insertTableData.calls.count()).toBe(2);
         
        });
        
        describe("Disable mockstar", function() {
            it("should disable mockstar if execution schema is provided in constructor (e.g. 'SAP_PLC')", function() {
                // act
                mockstar = new MockstarFacade({});
                
                // assert
                expect(mockstar.disableMockstar).toBe(true);
                expect(mockstar.userSchema).toBe(PlcSchema);
            });
            
            it('execQuery should call original tables', function() {
                mockstar = new MockstarFacade({
                            testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
                            substituteTables:
                                {
                                    "item": "sap.db::t_item",
                                    "item2": "sap.db::t_item2",
                                }
                        },
                        {
                            SqlExecutor: SqlExecutorFake,
                            TableUtils: TableUtilsFake,
                            mockstar: realMockstar,
                            tableDataSet: tableDataSetFake,
                            disableMockstar: true
                        });
                // act
                mockstar.execQuery('select * from {{item}} as it1, {{item2}} as it2 where it1.id=it2.id');
                
                // assert
                expect(jasmine.dbConnection.executeQuery).toHaveBeenCalledWith(`select * from "${mockstar.schema}"."sap.db::t_item" as it1, "${mockstar.schema}"."sap.db::t_item2" as it2 where it1.id=it2.id`);
            });

            it('should call original SQL procedure', function() {
                // prepare
                mockstar = new MockstarFacade(
                    {
                        testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open"
                    },
                    {
                        SqlExecutor: SqlExecutorFake,
                        TableUtils: TableUtilsFake,
                        mockstar: realMockstar,
                        tableDataSet: tableDataSetFake,
                        disableMockstar: true
                    });
                outParameterTypes = [];
                procedureResult = {};
        
                // act
                mockstar.call();
                
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(mockstar.schema, "sap.plc.db.calculationmanager.procedures::p_calculation_version_open");
            });
         
        });
        
        describe('substituteTemplateProcs', () => {
            var templateEngineFake = null;
            var dbArtefactControllerFake = null;
    
            const oContextObject = {
                context: "fake"
            };
            
            const sTemplateName = "sap.plc_test.testtools::p_fake_template_to_test";
            const sTestProcedureName = "sap.plc_test.testtools::p_fake_template_with_substitutes";
            const aSubstituteTemplateProcs = [{
                name: "sap.plc_testtesttools::proc_to_substitude",
                testProc: "sap.plc_test.testtools::p_substitute_procedure"
            }];
    
            function prepareMockstarForTemplateTests(bCreateTemplateObject) {
                mockstar = initMockstar({
                    testmodel: {
                        isTemplateProc: true,
                        createTemplateEngineContextObject: bCreateTemplateObject,
                        name: sTemplateName,
                        testProc: sTestProcedureName
                    },
                    substituteTemplateProcs: aSubstituteTemplateProcs,
                }, {
                    // override the default arguments given to mockstar_facade
                    templateEngine: templateEngineFake,
                    dbArtefactController: dbArtefactControllerFake,
                    disableMockstar: true
                });
            }
    
            beforeEach(() => {
                templateEngineFake = jasmine.createSpyObj('templateEngineFake', ['compile']);
                // fake functions for templateEngine.compile return the input unprocessed (fake procedure does also not contains
                // any templates); needed that the procedure content can be processed further by the logic of the facade
                templateEngineFake.compile.and.callFake((sInput) => sInput);
                dbArtefactControllerFake = jasmine.createSpyObj('dbArtefactController', ['createContextObject', 'hdiUpsertFiles', 'hdiDeleteFiles']);
                dbArtefactControllerFake.createContextObject.and.returnValue(oContextObject);
    
                // arrange and act for all tests
                prepareMockstarForTemplateTests(false);
            });
    
            it('should change name of the procedure to testProc', () => {
                // assert
                const rMatchingPattern = new RegExp(`procedure\\s+"${sTestProcedureName}"`, "i");
                var bCorrectCreateStmtFound = false;
                // the very last statement to the sql executor should the create stmt for the test (double) procedure; other stmts 
                // create dependent procedure, which must be done before
                var sCreateStmt = dbArtefactControllerFake.hdiUpsertFiles.calls.mostRecent().args[0][0].CONTENT;
                expect(rMatchingPattern.test(sCreateStmt)).toBe(true);
            });
    
            it('should substitute all procedures given in substituteTemplateProcs', () => {
                // assert
                var sCreateStmt =dbArtefactControllerFake.hdiUpsertFiles.calls.mostRecent().args[0][0].CONTENT;
                aSubstituteTemplateProcs.forEach(oSubstituteDefinition => {
                    jasmine.log(`Checking if ${oSubstituteDefinition.name} has been substituted with ${oSubstituteDefinition.testProc}`);
                    const rMatchingPattern = new RegExp(`\\s*call\\s+"${oSubstituteDefinition.testProc}"`, "i");
                    expect(rMatchingPattern.test(sCreateStmt)).toBe(true);
                });
            });
    
            it('should not call createContextObject on dbArtefactController if createTemplateEngineContextObject is false', () => {
                // assert
                expect(dbArtefactControllerFake.createContextObject).not.toHaveBeenCalled();
            });
    
            it('should call createContextObject on dbArtefactController if createTemplateEngineContextObject is true', () => {
                // arrange + act
                prepareMockstarForTemplateTests(true);
    
                // assert
                expect(dbArtefactControllerFake.createContextObject).toHaveBeenCalled();
            });
    
            it('should call templateEngine', () => {
                // assert
                expect(templateEngineFake.compile).toHaveBeenCalled();
            });
    
            it('should load and execute the procedure for test if call() is executed', () => {
                // act
                mockstar.call();
    
                // assert
                expect(jasmine.dbConnection.loadProcedure).toHaveBeenCalledWith(mockstar.userSchema, `${sTestProcedureName}`);
            });
    
            it('should drop test procedure after cleanup is called', () => {
                //act
                mockstar.cleanup();
    
                // assert
                const sRootPath = "src/dynamic/";
                const sFilePath = sRootPath + sTestProcedureName.replace(/\.|\:{2}/g, '/') + '.hdbprocedure';
                var bTestProcedureDropped = false;

                dbArtefactControllerFake.hdiDeleteFiles.calls.all().forEach(oCall => {
                    var sDropFiles = oCall.args[0];
                    sDropFiles.forEach(file => {
                        if (file === sFilePath) {
                            bTestProcedureDropped = true;
                        }
                    })
                });
                expect(bTestProcedureDropped).toBe(true);
            });
            
            it('should drop substitute procedures after cleanup is called', () => {
                //act
                mockstar.cleanup();
    
                // assert
                aSubstituteTemplateProcs.forEach(oSubstitute => {
                    jasmine.log(`Checking if substitute ${oSubstitute.testProc} has been dropped`);
                    const sRootPath = "src/dynamic/";
                    const sFilePath = sRootPath + oSubstitute.testProc.replace(/\.|\:{2}/g, '/') + '.hdbprocedure';
                    var bSubstituteProcedureDropped = false;
                    dbArtefactControllerFake.hdiDeleteFiles.calls.all().forEach(oCall => {
                        var sDropFiles = oCall.args[0];
                        sDropFiles.forEach(file => {
                            if (file === sFilePath) {
                                bSubstituteProcedureDropped = true;
                            }
                        })

                    });
                    expect(bSubstituteProcedureDropped).toBe(true);
                });
                
            });
        });
    
    }).addTags(["All_Unit_Tests"]);
    }