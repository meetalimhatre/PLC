package com.sap.plc.backend.config;

public interface ConfigConstants {

    String HIBERNATE_DIALECT = "hibernate.dialect";
    String HIBERNATE_SHOW_SQL = "hibernate.show_sql";
    String HIBERNATE_CONNECTION_DRIVER_CLASS = "hibernate.connection.driver_class";
    String HIBERNATE_USE_JDBC_METADATA_DEFAULTS = "hibernate.temp.use_jdbc_metadata_defaults";
    String HIBERNATE_HBM2DDL_AUTO = "hibernate.hbm2ddl.auto";
    String HIBERNATE_BATCH_SIZE = "spring.jpa.properties.hibernate.jdbc.batch_size";
    String HIBERNATE_GENERATE_STATISTICS = "spring.jpa.properties.hibernate.generate_statistics";
    String HIBERNATE_ORDER_INSERTS = "spring.jpa.properties.hibernate.order_inserts";
    String HIBERNATE_JDBC_TIMEZONE = "hibernate.jdbc.time_zone";
    String CLOUD_FOUNDRY = "cloud";
    String XSA = "xsa";
    String NO_TENANT = "NO_TENANT";

    String MODEL_PACKAGE = "com.sap.plc.backend.model";

    String METADATA1_CACHE = "metadata.getCustomFieldsMetadata";
    String UOM1_CACHE = "uom.getActiveById";
    String CURRENCY1_CACHE = "currency.getActiveById";
    String PLANT1_CACHE = "plant.getActiveById";
    String COMPANY_CODE1_CACHE = "companyCode.getActiveById";
    String ACCOUNT1_CACHE = "account.getActiveById";

    String APPLICATION_JSON_MIME = "application/json";
}
