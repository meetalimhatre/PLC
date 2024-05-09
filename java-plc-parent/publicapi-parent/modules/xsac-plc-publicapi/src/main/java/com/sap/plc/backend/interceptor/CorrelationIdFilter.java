package com.sap.plc.backend.interceptor;

import com.sap.plc.backend.util.GeneralUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    private CorrelationIdThreadLocal correlationIdThreadLocal;

    public CorrelationIdFilter(CorrelationIdThreadLocal correlationIdThreadLocal) {
        this.correlationIdThreadLocal = correlationIdThreadLocal;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException, ServletException {

        correlationIdThreadLocal.set(GeneralUtils.getCorrelationId(request));

        filterChain.doFilter(request, response);
    }
}
