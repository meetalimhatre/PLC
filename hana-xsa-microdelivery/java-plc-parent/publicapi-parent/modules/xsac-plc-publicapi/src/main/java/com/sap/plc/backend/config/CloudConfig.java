package com.sap.plc.backend.config;

import com.sap.plc.backend.config.mt.hibernate.PLCMTDataSourceProviderFunctionFactory;
import com.sap.plc.backend.config.mt.hibernate.PLCRoutingDataSource;
import com.sap.plc.backend.config.mt.hibernate.TenantContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.util.function.Function;

import static com.sap.plc.backend.config.ConfigConstants.CLOUD_FOUNDRY;

@Profile(CLOUD_FOUNDRY)
@Configuration
public class CloudConfig {

    private static final String NATIVE_SQL_REGEXP = " {0} LIKE_REGEXPR :{1} FLAG ''i'' ";

    @Bean
    public Function<String, DataSource> dataSourceProviderFunction() {
        return PLCMTDataSourceProviderFunctionFactory.dataSourceProviderFunction();
    }

    @Bean
    public DataSource dataSource(Function<String, DataSource> dataSourceProviderFunction) {
        return new PLCRoutingDataSource(TenantContext::getCurrentTenant, dataSourceProviderFunction);
    }

    @Bean
    public String nativeSqlRegexp() {
        return NATIVE_SQL_REGEXP;
    }
}
