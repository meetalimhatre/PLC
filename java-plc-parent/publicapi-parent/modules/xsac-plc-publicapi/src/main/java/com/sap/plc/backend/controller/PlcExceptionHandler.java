package com.sap.plc.backend.controller;

import com.sap.plc.backend.dto.apiResponse.ErrorResponse;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.interceptor.CorrelationIdThreadLocal;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.service.ThrowableProcessingService;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static java.text.MessageFormat.format;

@RestControllerAdvice
public class PlcExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Pattern URI_EXTRACTOR_PATTERN = Pattern.compile("^uri=(.+)");
    private static final String NOT_APPLICABLE = "N/A";
    private final ThrowableProcessingService throwableProcessingService;
    @Value("${log.exception.message.pattern}")
    private String logMessagePattern;
    @Resource
    private Logger logger;
    @Resource
    private CorrelationIdThreadLocal correlationIdThreadLocal;

    @Autowired
    public PlcExceptionHandler(ThrowableProcessingService throwableProcessingService) {
        this.throwableProcessingService = throwableProcessingService;
    }

    @ExceptionHandler(value = {Exception.class})
    protected ResponseEntity<Object> handleException(Exception exception, HttpServletRequest httpRequest) {

        String correlationId = correlationIdThreadLocal.get();

        ErrorResponse<? extends PrimaryKey> errorResponse = throwableProcessingService.process(exception);
        errorResponse.setTarget(httpRequest.getRequestURI());
        errorResponse.setCorrelationId(correlationId);

        logException(httpRequest.getMethod(), httpRequest.getRequestURI(), errorResponse.getHttpStatus(), correlationId,
                exception);

        return new ResponseEntity<>(new PlcResponse<>(errorResponse), new HttpHeaders(),
                errorResponse.getHttpStatus());
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception, Object body, HttpHeaders headers,
                                                             HttpStatusCode status, WebRequest request) {

        String correlationId = correlationIdThreadLocal.get();

        ErrorResponse<? extends PrimaryKey> errorResponse = throwableProcessingService.process(exception);
        String target = getTarget(request);
        errorResponse.setTarget(target);
        errorResponse.setCorrelationId(correlationId);
        errorResponse.setHttpStatus(status);
        logException(getMethod(request), target, errorResponse.getHttpStatus(), correlationId, exception);

        return new ResponseEntity<>(new PlcResponse<>(errorResponse), new HttpHeaders(),
                errorResponse.getHttpStatus());
    }

    private String getMethod(WebRequest request) {
        if (ServletWebRequest.class.isAssignableFrom(request.getClass())) {
            HttpMethod httpMethod = ((ServletWebRequest) request).getHttpMethod();
            if (httpMethod != null) {
                return httpMethod.name();
            }
        }
        return NOT_APPLICABLE;
    }

    private String getTarget(WebRequest request) {
        if (ServletWebRequest.class.isAssignableFrom(request.getClass())) {
            HttpServletRequest httpServletRequest = ((ServletWebRequest) request).getRequest();
            if (httpServletRequest != null) {
                return httpServletRequest.getRequestURI();
            }
        }
        Matcher matcher = URI_EXTRACTOR_PATTERN.matcher(request.getDescription(false));
        if (matcher.matches()) {
            return matcher.group(1);
        }
        return NOT_APPLICABLE;
    }

    private void logException(String httpMethod, String httpRequestUri, HttpStatusCode httpStatus, String correlationId,
                              Throwable cause) {

        logger.error(format(logMessagePattern, cause.getMessage(), httpMethod,
                httpRequestUri, httpStatus, correlationId), cause);
    }
}
