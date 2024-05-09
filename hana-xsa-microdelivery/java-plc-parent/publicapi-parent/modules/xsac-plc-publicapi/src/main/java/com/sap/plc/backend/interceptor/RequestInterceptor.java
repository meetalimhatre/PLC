package com.sap.plc.backend.interceptor;

import com.sap.plc.backend.config.mt.hibernate.TenantContext;
import com.sap.plc.backend.exception.BadRequestException;
import com.sap.plc.backend.service.security.SecurityService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import static com.sap.plc.backend.config.ConfigConstants.CLOUD_FOUNDRY;

@Component
@Profile(CLOUD_FOUNDRY)
public class RequestInterceptor implements HandlerInterceptor {

    private final SecurityService securityService;

    public RequestInterceptor(SecurityService securityService) {
        this.securityService = securityService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws BadRequestException {

        final var tenantId = securityService.getTenant();
        TenantContext.setCurrentTenant(tenantId);

        return true;
    }

    @Override
    public void postHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) {
        TenantContext.clear();
    }

}