package com.sap.plc.backend.config.mt.hibernate;

import com.sap.plc.xsa.sm.api.ReadFilter;
import com.sap.plc.xsa.sm.api.ServiceManagerClient;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import static java.text.MessageFormat.format;
import static java.util.Objects.requireNonNull;

public class PLCMTDataSourceProviderFunctionFactory {

    private static final Logger LOGGER = LoggerFactory.getLogger(PLCMTDataSourceProviderFunctionFactory.class);
    private static final Map<String, DataSource> cachedDataSourceMap = Collections.synchronizedMap(new HashMap<>());
    private static final ServiceManagerClient serviceManagerClient = ServiceManagerClient
            .fromEnvironment(System.getenv("SM_SERVICE_NAME"));
    private static final ReadFilter PLC_READ_FILTER = ReadFilter.byLabel("managing_client_lib", "instance-manager-client-lib");

    private static final Function<String, DataSource> INSTANCE = (tenantId) ->
            cachedDataSourceMap.computeIfAbsent(tenantId, PLCMTDataSourceProviderFunctionFactory::provide);
    private static final int MAXIMUM_POOL_SIZE =
            getIntEnvVariable("PLC_DB_MAX_POOL_SIZE", 100);
    private static final int MINIMUM_IDLE =
            getIntEnvVariable("PLC_DB_MIN_IDLE", 10);
    private static final String POOL_NAME_PATTERN = "tenant{0}PooledDataSource";

    private static int getIntEnvVariable(String envVariableName, int defaultValue) {
        int parsedInt = defaultValue;
        final var envValue = System.getenv(envVariableName);
        try {
            parsedInt = Integer.parseInt(envValue);
        } catch (NumberFormatException e) {
            LOGGER.error("cannot parse int variable " + envVariableName + " --> " + envValue);
        }
        return parsedInt;
    }


    public static Function<String, DataSource> dataSourceProviderFunction() {
        return INSTANCE;
    }

    private static DataSource provide(String tenantId) {

        final var serviceBindingCollection =
                serviceManagerClient
                        .getServiceBindingsService()
                        .read(PLC_READ_FILTER.andLabel("tenant_id", tenantId));

        if (serviceBindingCollection.size() == 1) {
            return getDataSource(serviceBindingCollection.iterator().next().getCredentials(), tenantId);
        }
        if (serviceBindingCollection.isEmpty()) {
            throw new RuntimeException(format("No service binding for tenant {0} found", tenantId));
        }
        throw new RuntimeException(format("Multiple service bindings for tenant {0} found", tenantId));
    }

    private static DataSource getDataSource(Map<String, Object> credentials, String tenantId) {
        HikariConfig config = getHikariConfig(credentials, tenantId);
        return new HikariDataSource(config);
    }

    private static HikariConfig getHikariConfig(Map<String, Object> credentials, String tenantId) {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName(requireNonNull(credentials.get("driver"),
                "driver field not found in credentials section").toString());
        config.setUsername(requireNonNull(credentials.get("user"),
                "user field not found in credentials section").toString());
        config.setPassword(requireNonNull(credentials.get("password"),
                "password field not found in credentials section").toString());
        config.setJdbcUrl(requireNonNull(credentials.get("url"),
                "url field not found in credentials section").toString());
        config.setPoolName(format(POOL_NAME_PATTERN, tenantId));
        config.setMaximumPoolSize(MAXIMUM_POOL_SIZE);
        config.setMinimumIdle(MINIMUM_IDLE);
        return config;
    }
}
