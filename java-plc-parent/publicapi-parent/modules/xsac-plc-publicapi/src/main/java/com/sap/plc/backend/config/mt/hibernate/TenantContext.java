package com.sap.plc.backend.config.mt.hibernate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.sap.plc.backend.config.ConfigConstants.NO_TENANT;

public class TenantContext {

    private static final Logger LOGGER = LoggerFactory.getLogger(TenantContext.class);
    private static final ThreadLocal<String> TENANT_IDENTIFIER = ThreadLocal.withInitial(() -> NO_TENANT);

    public static void setCurrentTenant(String tenant) {
        LOGGER.debug("[Multi tenant info]: Setting tenant to " + tenant);
        TENANT_IDENTIFIER.set(tenant);
    }

    public static String getCurrentTenant() {
        return TENANT_IDENTIFIER.get();
    }

    public static void clear() {
        LOGGER.debug("[Multi tenant info]: Clearing tenant " + TENANT_IDENTIFIER.get());
        TENANT_IDENTIFIER.set(NO_TENANT);
    }
}