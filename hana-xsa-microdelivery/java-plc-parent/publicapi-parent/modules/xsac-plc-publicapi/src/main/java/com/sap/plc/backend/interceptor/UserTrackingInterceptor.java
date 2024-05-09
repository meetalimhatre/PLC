package com.sap.plc.backend.interceptor;

import com.sap.plc.backend.service.security.UserTrackingService;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class UserTrackingInterceptor implements HandlerInterceptor {

    private UserTrackingService userTrackingService;

    public UserTrackingInterceptor(UserTrackingService userTrackingService) {
        this.userTrackingService = userTrackingService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        userTrackingService.updateAuthenticatedUserSession();
        return true;
    }
}
