if (jasmine.plcTestRunParameters.mode === 'all') {
    describe('xsjs.xslib.hdiClient-tests', function () {

        const testUtil = require("../../utils/testUtil.js")
        const HDIClient = require("../../../lib/xs/xslib/hdiClient").HDIClient;
        const sTestTable = 'sap.plc_test.xs.xslib::hdi_client_test';
        const sMasterdataTable = 'sap.plc_test.xs.xslib::t_masterdata_test';
        const sNestedTable = 'sap.plc_test.xs.xslib.nest::hdi_client_test';
        const sPath = 'src/dynamic/sap/plc_test/xs/xslib/';
        const oNestedTable = {
            PATH: sPath + "nest/" + sNestedTable.split("::")[1] + '.hdbtable',
            CONTENT: `column table "${sNestedTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
        };
        const aUpsertList = [
            {
                PATH: sPath + sTestTable.split("::")[1] + '.hdbtable',
                CONTENT: `column table "${sTestTable}" (item_id integer, calculation_version_id integer, primary key(item_id, calculation_version_id))`
            },
            {
                PATH: sPath + sMasterdataTable.split("::")[1] + '.hdbtable',
                CONTENT: `column table "${sMasterdataTable}" (material_id integer, _valid_from integer, primary key(material_id, _valid_from))`
            }];
        let oHDIClient = null;

        function getContainerSchema() {
            var oConnection = $.hdb.getConnection({ "treatDateAsUTC": true, "enableColumnIndices": false });
            return oConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
         }
 
         function getHDICredentials(){
             if (testUtil.isCloud()) {
                 return {
                     host: $.hdb._options.host,
                     port: $.hdb._options.port,
                     user: $.hdb._options.hdi_user,
                     password: $.hdb._options.hdi_password,
                     ca: $.hdb._options.certificate
                 };
             }else {
                 return {
                     host: $.hdb._options.host,
                     port: $.hdb._options.port,
                     user: $.hdb._options.hdi_user,
                     password: $.hdb._options.hdi_password
                 };
             }
         }

        beforeAll(function () {
            oHDIClient = new HDIClient($, getContainerSchema(), getHDICredentials());
        });

        afterAll(function () {
            oHDIClient.closeConnection();
        });

        describe('connectionOperation', function () {
            it('shouldOpenAndCloseConnection', function () {
                oHDIClient.openConnection();
                let connection = oHDIClient.getConnection();
                expect(connection).not.toBeNull();

                spyOn(connection, 'disconnect');
                oHDIClient.closeConnection();
                expect(connection.disconnect).toHaveBeenCalled();
                connection = oHDIClient.getConnection();
                expect(connection).toBeNull();
            });
        });

        describe('fileChangeOperation', function () {
            beforeAll(function () {
                oHDIClient.openConnection();
            });

            beforeEach(function () {
                // clear the fold in case of unexpected result
                try {
                    let aListedFiles = oHDIClient.listDeployed([sPath], true);
                    oHDIClient.delete(aListedFiles.map(obj => obj.path), false);
                    oHDIClient.make(sPath);
                } catch (e) {
                }
            });

            it('upsert', function () {
                oHDIClient.upsert(aUpsertList);

                let result = oHDIClient.listChanged([sPath]);
                expect(result.length).toBe(2);
                expect(result[0].path).toBe(aUpsertList[0].PATH);
                expect(result[0].status).toBe("A");

                oHDIClient.restore(sPath);
            });

            it('delete', function () {
                oHDIClient.upsert(aUpsertList);
                oHDIClient.make(sPath);
                oHDIClient.delete([aUpsertList[0].PATH], false);

                let result = oHDIClient.listChanged([sPath]);
                expect(result.length).toBe(1);
                expect(result[0].path).toBe(aUpsertList[0].PATH);
                expect(result[0].status).toBe("D");

                oHDIClient.restore(sPath);
            });

            it('delete_recursive_is_true', function () {
                oHDIClient.upsert([...aUpsertList, oNestedTable]);
                oHDIClient.make(sPath);
                oHDIClient.delete([sPath, sPath + 'nest/'], true);

                let result = oHDIClient.listChanged([sPath]);
                expect(result.length).toBe(3);

                oHDIClient.restore(sPath);
            });

            it('make', function () {
                oHDIClient.upsert(aUpsertList);
                oHDIClient.make(sPath);

                let result = oHDIClient.listDeployed([sPath], false);
                expect(result[0].path).toBe(aUpsertList[0].PATH);
                expect(result[1].path).toBe(aUpsertList[1].PATH);
            });

            it('listChanged_upsert', function () {
                oHDIClient.upsert([...aUpsertList, oNestedTable]);
                let result = oHDIClient.listChanged([sPath]);

                expect(result.length).toBe(3);
                oHDIClient.restore(sPath);
            });

            it('listChanged_delete', function () {
                oHDIClient.upsert(aUpsertList);
                oHDIClient.make(sPath);
                oHDIClient.delete([aUpsertList[0].PATH], false);
                let result = oHDIClient.listChanged([sPath]);

                expect(result.length).toBe(1);
                oHDIClient.restore(sPath);
            });

            it('listDeployed', function () {
                oHDIClient.upsert(aUpsertList);
                oHDIClient.make(sPath);
                oHDIClient.delete([aUpsertList[0].PATH], false);
                oHDIClient.make(sPath);
                let result = oHDIClient.listDeployed([sPath], false);

                expect(result.length).toBe(1);
                expect(result[0].path).toBe(aUpsertList[1].PATH);
            });

            it('listDeployed_RecursiveIsTrue', function () {
                oHDIClient.upsert([...aUpsertList, oNestedTable]);
                oHDIClient.make(sPath);
                let result = oHDIClient.listDeployed([sPath], true);

                expect(result.length).toBe(4);
                expect(result.map(item => item.path)).toEqual([aUpsertList[0].PATH, sPath + "nest/", oNestedTable.PATH, aUpsertList[1].PATH]);
            });

            it('restore_upsert', function () {
                oHDIClient.upsert([aUpsertList[0]]);
                oHDIClient.restore(sPath);

                let result = oHDIClient.listChanged([sPath]);
                expect(result.length).toBe(0);
            });

            it('restore_delete', function () {
                oHDIClient.upsert(aUpsertList);
                oHDIClient.make(sPath);
                oHDIClient.delete([aUpsertList[0].PATH], false);
                oHDIClient.restore(sPath);

                let result = oHDIClient.listChanged([sPath]);
                expect(result.length).toBe(0);
            });

        });

    }).addTags(["All_Unit_Tests"]);
}