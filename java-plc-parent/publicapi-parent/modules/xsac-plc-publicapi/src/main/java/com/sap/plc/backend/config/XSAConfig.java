package com.sap.plc.backend.config;

import com.sap.xs.env.Credentials;
import com.sap.xs.env.VcapServices;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

import static com.sap.plc.backend.config.ConfigConstants.XSA;
import static java.util.Objects.requireNonNull;

@Profile(XSA)
@Configuration
public class XSAConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(XSAConfig.class);
    private static final int MAXIMUM_POOL_SIZE =
            getIntEnvVariable("PLC_DB_MAX_POOL_SIZE", 100);
    private static final int MINIMUM_IDLE =
            getIntEnvVariable("PLC_DB_MIN_IDLE", 10);
    private static final String POOL_NAME_PATTERN = "hanaConnectionPooledDataSource";
    private static final String NATIVE_SQL_REGEXP = " {0} LIKE_REGEXPR :{1} FLAG ''i'' ";

    private static int getIntEnvVariable(String envVariableName, int defaultValue) {
        int parsedInt = defaultValue;
        final var envValue = System.getenv(envVariableName);
        try {
            parsedInt = Integer.parseInt(envValue);
        } catch (NumberFormatException e) {
            LOGGER.error("cannot parse variable name " + envVariableName + " --> " + envValue);
        }
        return parsedInt;
    }

    @Bean
    public DataSource dataSource(@Value("${VCAP_SERVICES}") String vcapServicesString,
                                 @Value("${HANA_SERVICE_NAME:xsac-plc-db-service}") String hanaServiceName) {
        VcapServices vcapServices = VcapServices.from(vcapServicesString);
        final var hanaService = vcapServices
                .getService(hanaServiceName)
                .orElseThrow(() -> new RuntimeException("No hana service found"));
        return getDataSource(hanaService.getCredentials());
    }

    @Bean
    public String nativeSqlRegexp() {
        return NATIVE_SQL_REGEXP;
    }

    private static DataSource getDataSource(Credentials credentials) {
        HikariConfig config = getHikariConfig(credentials);
        return new HikariDataSource(config);
    }

    private static HikariConfig getHikariConfig(Credentials credentials) {
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setDriverClassName(requireNonNull(credentials.getDriver(),
                "driver field not found in credentials section"));
        hikariConfig.setUsername(requireNonNull(credentials.getUser(),
                "user field not found in credentials section"));
        hikariConfig.setPassword(requireNonNull(credentials.getPassword(),
                "password field not found in credentials section"));
        hikariConfig.setJdbcUrl(requireNonNull(credentials.getUrl(),
                "url field not found in credentials section"));
        hikariConfig.setPoolName(POOL_NAME_PATTERN);
        hikariConfig.setMaximumPoolSize(MAXIMUM_POOL_SIZE);
        hikariConfig.setMinimumIdle(MINIMUM_IDLE);
        return hikariConfig;
    }
}
