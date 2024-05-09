package com.sap.plc.backend.interceptor;

import org.springframework.stereotype.Component;

@Component
public class CorrelationIdThreadLocal {

    private static final ThreadLocal<String> correlationIdTL = new ThreadLocal<>();

    public String get() {
        return correlationIdTL.get();
    }

    public void set(String correlationId) {
        correlationIdTL.set(correlationId);
    }

    public void remove() {
        correlationIdTL.remove();
    }
}
