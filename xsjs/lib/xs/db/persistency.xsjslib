var HQuery = $.require('../xslib/hQuery').HQuery;

var ERP_LANGUAGE_FIELD_LENGTH = 1;
var CLIENT_FIELD_LENGTH = 3;

/**
 * Creates a new Persistency object. These object contain all persistence logic of the application and shall be used by
 * clients to separate between business and persistence logic.
 *
 * @constructor
 * @param {$.db.Connection}
 *            dbConnection - a connection instance
 */

function Persistency(dbConnection) {

    var hQueryPlc = new HQuery(dbConnection);
    var hQueryRepl = new HQuery(dbConnection);

    // to avoid unnecessary $.import callings to improve performance, delay loading and creating of below objects
    Object.defineProperties(this, {
        Addin: {
            get: () => {
                if (undefined === this._Addin) {
                    var Addin = $.import('xs.db', 'persistency-addin').Addin;
                    this._Addin = new Addin(this.getConnection(), this.getHQueryPlc());
                }
                return this._Addin;
            }
        },
        ApplicationManagement: {
            get: () => {
                if (undefined === this._ApplicationManagement) {
                    var ApplicationManagement = $.require('./persistency-applicationManagement').ApplicationManagement;
                    this._ApplicationManagement = new ApplicationManagement($, this.getConnection());
                }
                return this._ApplicationManagement;
            }
        },
        Calculation: {
            get: async function () {
            return await (async () => {
                    if (undefined === this._Calculation) {
                        var Calculation = $.import('xs.db', 'persistency-calculation').Calculation;
                        this._Calculation = new Calculation(this.getConnection(), this.getHQueryPlc());
                    }
                    return this._Calculation;
                })();
            }
        },
        CalculationVersion: {
            get: () => {
                if (undefined === this._CalculationVersion) {
                    var CalculationVersion = $.require('./persistency-calculationVersion').CalculationVersion;
                    this._CalculationVersion = new CalculationVersion($, this.getConnection(), this.getHQueryPlc(), $.getPlcUsername());
                }
                return this._CalculationVersion;
            }
        },
        Item: {
            get: () => {
                if (undefined === this._Item) {
                    var Item = $.require('./persistency-item').Item;
                    this._Item = new Item($, this.getConnection(), this.getHQueryPlc(), $.getPlcUsername());
                }
                return this._Item;
            }
        },
        Project: {
            get: () => {
                if (undefined === this._Project) {
                    var Project = $.import('xs.db', 'persistency-project').Project;
                    this._Project = new Project(this.getConnection(), this.getHQueryPlc());
                }
                return this._Project;
            }
        },
        Administration: {
            get: () => {
                if (undefined === this._Administration) {
                    var Administration = $.import('xs.db', 'persistency-administration').Administration;
                    this._Administration = new Administration(this.getConnection(), this.getHQueryPlc(), this.getHQueryRepl());
                }
                return this._Administration;
            }
        },
        Metadata: {
            get: () => {
                if (undefined === this._Metadata) {
                    var Metadata = $.require('./persistency-metadata').Metadata;
                    this._Metadata = new Metadata($, this.getHQueryPlc(), this.getConnection(), $.getPlcUsername());
                }
                return this._Metadata;
            }
        },
        DefaultSettings: {
            get: () => {
                if (undefined === this._DefaultSettings) {
                    var DefaultSettings = $.import('xs.db', 'persistency-defaultSettings').DefaultSettings;
                    this._DefaultSettings = new DefaultSettings(this.getConnection(), this.getHQueryPlc(), this.getHQueryRepl());
                }
                return this._DefaultSettings;
            }
        },
        Session: {
            get: () => {
                if (undefined === this._Session) {
                    var Session = $.require('./persistency-session').Session;
                    this._Session = new Session($, this.getConnection(), this.getHQueryPlc());
                }
                return this._Session;
            }
        },
        DbArtefactController: {
            get: () => {
                if (undefined === this._DbArtefactController) {
                    var DbArtefactController = $.require('./generation/hdi-db-artefact-controller').DbArtefactController;
                    this._DbArtefactController = new DbArtefactController($, this.getConnection());
                }
                return this._DbArtefactController;
            }
        },
        GlobalSearch: {
            get: () => {
                if (undefined === this._GlobalSearch) {
                    var GlobalSearch = $.import('xs.db', 'persistency-globalSearch').GlobalSearch;
                    this._GlobalSearch = new GlobalSearch(this.getConnection(), this.getHQueryPlc());
                }
                return this._GlobalSearch;
            }
        },
        Transportation: {
            get: () => {
                if (undefined === this._Transportation) {
                    var Transportation = $.import('xs.db', 'persistency-transportation').Transportation;
                    this._Transportation = new Transportation(dbConnection, this.DbArtefactController, this.Metadata);
                }
                return this._Transportation;
            }
        },
        Misc: {
            get: () => {
                if (undefined === this._Misc) {
                    var Misc = $.require('./persistency-misc').Misc;
                    this._Misc = new Misc($, this.getHQueryPlc(), $.getPlcUsername(), this.getConnection());
                }
                return this._Misc;
            }
        },
        Helper: {
            get: () => {
                if (undefined === this._Helper) {
                    var Helper = $.require('./persistency-helper').Helper;
                    this._Helper = new Helper($, this.getHQueryPlc(), this.getConnection());
                }
                return this._Helper;
            }
        },
        Layout: {
            get: () => {
                if (undefined === this._Layout) {
                    var Layout = $.import('xs.db', 'persistency-layout').Layout;
                    this._Layout = new Layout(this.getConnection(), this.getHQueryPlc());
                }
                return this._Layout;
            }
        },
        Task: {
            get: () => {
                if (undefined === this._Task) {
                    var Task = $.require('./persistency-task').Task;
                    this._Task = new Task(this.getConnection());
                }
                return this._Task;
            }
        },
        Privilege: {
            get: () => {
                if (undefined === this._Privilege) {
                    var Privilege = $.import('xs.db', 'persistency-privilege').Privilege;
                    this._Privilege = new Privilege(this.getConnection());
                }
                return this._Privilege;
            }
        },
        Group: {
            get: () => {
                if (undefined === this._Group) {
                    var Group = $.import('xs.db', 'persistency-group').Group;
                    this._Group = new Group(this.getConnection());
                }
                return this._Group;
            }
        },
        FrontendSettings: {
            get: () => {
                if (undefined === this._FrontendSettings) {
                    var FrontendSettings = $.import('xs.db', 'persistency-frontendSettings').FrontendSettings;
                    this._FrontendSettings = new FrontendSettings(this.getConnection(), this.getHQueryPlc());
                }
                return this._FrontendSettings;
            }
        },
        DataProtection: {
            get: () => {
                if (undefined === this._DataProtection) {
                    var DataProtection = $.import('xs.db', 'persistency-dataProtection').DataProtection;
                    this._DataProtection = new DataProtection(this.getConnection());
                }
                return this._DataProtection;
            }
        },
        Variant: {
            get: () => {
                if (undefined === this._Variant) {
                    var Variant = $.require('./persistency-variant').Variant;
                    this._Variant = new Variant($, this.getConnection(), this.getHQueryPlc());
                }
                return this._Variant;
            }
        },
        Masterdata: {
            get: () => {
                if (undefined === this._Masterdata) {
                    var Masterdata = $.import('xs.db', 'persistency-masterdata').Masterdata;
                    this._Masterdata = new Masterdata(this.getConnection(), this.getHQueryPlc());
                }
                return this._Masterdata;
            }
        },
        SimilarPartsSearch: {
            get: () => {
                if (undefined === this._SimilarPartsSearch) {
                    var SimilarPartsSearch = $.require('./persistency-similarPartsSearch').SimilarPartsSearch;
                    this._SimilarPartsSearch = new SimilarPartsSearch($, this.getConnection());
                }
                return this._SimilarPartsSearch;
            }
        },
        RetentionPeriods: {
            get: () => {
                if (undefined === this._RetentionPeriods) {
                    var RetentionPeriods = $.require('./persistency-retentionPeriods').RetentionPeriods;
                    this._RetentionPeriods = new RetentionPeriods($, this.getConnection());
                }
                return this._RetentionPeriods;
            }
        }
    });

    /**
     * Function to set the hQuery instance after the initalization of <code>this</code>. Necessary to inject mocks
     * for testing.
     *
     * @param {object}
     *            oHQuery - the hQuery instance that shall be used by this object
     *
     */

    this.getConnection = function () {
        return hQueryPlc.getConnection();
    };

    this.setHQuery = function (oHQuery) {
        hQueryPlc = oHQuery;
    };

    this.getHQueryPlc = function () {
        return hQueryPlc;
    };

    this.getHQueryRepl = function () {
        return hQueryRepl;
    };







}
Persistency.prototype = Object.create(Persistency.prototype);
Persistency.prototype.constructor = Persistency;
export default {HQuery,ERP_LANGUAGE_FIELD_LENGTH,CLIENT_FIELD_LENGTH,Persistency};
