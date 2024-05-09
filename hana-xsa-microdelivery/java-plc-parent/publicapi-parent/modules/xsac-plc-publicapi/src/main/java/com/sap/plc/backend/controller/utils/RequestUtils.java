package com.sap.plc.backend.controller.utils;

import org.apache.commons.lang3.StringUtils;

import jakarta.servlet.http.HttpServletRequest;

public class RequestUtils {

    private static final String X_FORWARDED_FOR = "X-FORWARDED-FOR";

    /**
     * Extracts the IP address from the http request.
     * If header "X-FORWARDED-FOR" is not present the IP address will be taken from the remote address that will represent the client IP or the last redirect proxy IP.
     *
     * @param httpServletRequest the http request
     * @return IP of the request
     */
    public static String getIP(HttpServletRequest httpServletRequest) {

        if (httpServletRequest == null) {
            return null;
        }
        String ipAddress = httpServletRequest.getHeader(X_FORWARDED_FOR);

        if (StringUtils.isBlank(ipAddress)) {
            ipAddress = httpServletRequest.getRemoteAddr();
        }

        return ipAddress;
    }
}
