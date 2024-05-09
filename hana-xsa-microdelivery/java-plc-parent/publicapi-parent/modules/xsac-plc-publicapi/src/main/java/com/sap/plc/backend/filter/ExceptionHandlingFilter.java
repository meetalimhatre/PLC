package com.sap.plc.backend.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.plc.backend.dto.apiResponse.ErrorResponse;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.interceptor.CorrelationIdThreadLocal;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.service.ThrowableProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

import static com.sap.plc.backend.config.ConfigConstants.APPLICATION_JSON_MIME;
import static java.text.MessageFormat.format;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ExceptionHandlingFilter extends OncePerRequestFilter {

    private ThrowableProcessingService throwableProcessingService;
    private ObjectMapper jacksonObjectMapper;
    private CorrelationIdThreadLocal correlationIdThreadLocal;

    @Value("${log.exception.message.pattern}")
    private String logMessagePattern;

    @Autowired
    public ExceptionHandlingFilter(ThrowableProcessingService throwableProcessingService,
                                   ObjectMapper jacksonObjectMapper,
                                   CorrelationIdThreadLocal correlationIdThreadLocal) {
        this.throwableProcessingService = throwableProcessingService;
        this.jacksonObjectMapper = jacksonObjectMapper;
        this.correlationIdThreadLocal = correlationIdThreadLocal;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (Exception exception) {
            handleException(exception, request, response);
        }
    }

    private void handleException(Exception exception, HttpServletRequest httpServletRequest,
                                 HttpServletResponse httpServletResponse) throws IOException {

        String correlationId = correlationIdThreadLocal.get();

        ErrorResponse<? extends PrimaryKey> errorResponse =
                throwableProcessingService.process(exception);
        errorResponse.setTarget(httpServletRequest.getRequestURI());
        errorResponse.setCorrelationId(correlationId);

        logger.error(format(logMessagePattern, exception.getMessage(), httpServletRequest.getMethod(),
                httpServletRequest.getRequestURI(), errorResponse.getHttpStatus(), correlationId), exception);

        PlcResponse plcResponse = new PlcResponse(errorResponse);
        httpServletResponse.setStatus(errorResponse.getHttpStatus().value());
        httpServletResponse.setContentType(APPLICATION_JSON_MIME);
        PrintWriter httpServletResponseWriter = httpServletResponse.getWriter();
        httpServletResponseWriter.print(jacksonObjectMapper.writeValueAsString(plcResponse));
        httpServletResponseWriter.flush();
        httpServletResponseWriter.close();
    }
}
