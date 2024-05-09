package com.sap.plc.backend.config.mt.hibernate;

import org.hibernate.engine.jdbc.connections.spi.AbstractDataSourceBasedMultiTenantConnectionProviderImpl;
import org.hibernate.service.spi.ServiceRegistryAwareService;
import org.hibernate.service.spi.ServiceRegistryImplementor;
import org.hibernate.service.spi.Stoppable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.util.function.Function;

public class PLCMTConnectionProvider
        extends AbstractDataSourceBasedMultiTenantConnectionProviderImpl
        implements ServiceRegistryAwareService, Stoppable {

    private static final Logger LOGGER = LoggerFactory.getLogger(PLCMTConnectionProvider.class);

    private final Function<String, DataSource> dataSourceProviderFunction =
            PLCMTDataSourceProviderFunctionFactory.dataSourceProviderFunction();

    @Override
    protected DataSource selectAnyDataSource() {
        throw new UnsupportedOperationException("No generic data source defined!");
    }

    @Override
    protected DataSource selectDataSource(String tenantIdentifier) {
        return dataSourceProviderFunction.apply(tenantIdentifier);
    }

    @Override
    public void injectServices(ServiceRegistryImplementor serviceRegistry) {
        LOGGER.debug("PLCMTConnectionProvider hibernate service initialised");
    }

    @Override
    public void stop() {
        LOGGER.debug("PLCMTConnectionProvider hibernate service stopped");
    }
}
