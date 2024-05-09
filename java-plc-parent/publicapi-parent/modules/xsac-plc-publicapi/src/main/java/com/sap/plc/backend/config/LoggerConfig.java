package com.sap.plc.backend.config;

import com.sap.xs.audit.api.exception.AuditLogException;
import com.sap.xs.audit.api.v2.AuditLogMessageFactory;
import com.sap.xs.audit.client.impl.v2.AuditLogMessageFactoryImpl;
import com.sap.xs.env.Service;
import com.sap.xs.env.ServiceAttribute;
import com.sap.xs.env.VcapServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InjectionPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

import java.util.List;

@Configuration
public class LoggerConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggerConfig.class);
    private static final String AUDITLOG_LABEL = "auditlog";

    @Bean
    @Scope("prototype")
    public Logger getLogger(InjectionPoint injectionPoint) {
        return LoggerFactory.getLogger(injectionPoint.getMember().getDeclaringClass());
    }

    @Bean
    public AuditLogMessageFactory auditLogMessageFactory() throws AuditLogException {
        List<Service> serviceList = VcapServices.fromEnvironment().findServices(AUDITLOG_LABEL, ServiceAttribute.LABEL);

        switch (serviceList.size()) {
            case 0:
                LOGGER.warn("No auditlog service found. Please bind an auditlog service to " +
                        "this application! Redirecting messages to the console.");
                return new AuditLogMessageFactoryImpl();
            case 1:
                return new AuditLogMessageFactoryImpl(VcapServices.fromEnvironment());
            default:
                LOGGER.warn("Multiple auditlog services found. Please bind a single auditlog service to " +
                        "this application! Redirecting messages to the console.");
                return new AuditLogMessageFactoryImpl();
        }
    }
}
