package com.sap.plc.backend.config.authorize;

import com.sap.plc.backend.api.PublicAPI;

import static com.sap.plc.backend.constants.GeneralConstants.OAUTH_HAS_SCOPE_MATCHING_PREFIX;
import static com.sap.plc.backend.constants.GeneralConstants.OAUTH_HAS_SCOPE_MATCHING_SUFFIX;
import static java.lang.String.join;

public class PlcAuthorization {
    private final String name;
    private final String type;
    private final String flow;
    private final String method;
    private final String path;
    private final String scopes;
    private final boolean plcAuth;

    public PlcAuthorization(String name, String type, String flow, String method, String path, String[] scopes) {
        this.name = name;
        this.type = type;
        this.flow = flow;
        this.method = method;
        this.path = PublicAPI.API_BASE + path;
        this.scopes = OAUTH_HAS_SCOPE_MATCHING_PREFIX +
                join(OAUTH_HAS_SCOPE_MATCHING_SUFFIX + " and " + OAUTH_HAS_SCOPE_MATCHING_PREFIX, scopes) +
                OAUTH_HAS_SCOPE_MATCHING_SUFFIX;
        this.plcAuth = "plc_auth".equals(name);
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public String getFlow() {
        return flow;
    }

    public String getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    public String getScopes() {
        return scopes;
    }

    public boolean isPlcAuth() {
        return plcAuth;
    }
}

