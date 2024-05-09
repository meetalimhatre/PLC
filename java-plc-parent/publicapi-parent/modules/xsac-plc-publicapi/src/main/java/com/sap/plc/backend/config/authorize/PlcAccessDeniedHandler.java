package com.sap.plc.backend.config.authorize;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.plc.backend.dto.apiResponse.ErrorResponse;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.interceptor.CorrelationIdThreadLocal;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.service.ThrowableProcessingService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

import static com.sap.plc.backend.config.ConfigConstants.APPLICATION_JSON_MIME;
import static java.text.MessageFormat.format;

@Component
public class PlcAccessDeniedHandler implements AccessDeniedHandler {

    protected final Log logger = LogFactory.getLog(this.getClass());
    @Value("${log.exception.message.pattern}")
    private String logMessagePattern;

    @Autowired
    private ThrowableProcessingService throwableProcessingService;
    @Autowired
    private ObjectMapper jacksonObjectMapper;
    @Autowired
    private CorrelationIdThreadLocal correlationIdThreadLocal;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws
            IOException {

        String correlationId = correlationIdThreadLocal.get();

        ErrorResponse<? extends PrimaryKey> errorResponse =
                throwableProcessingService.process(accessDeniedException);
        errorResponse.setTarget(request.getRequestURI());
        errorResponse.setCorrelationId(correlationId);

        logger.error(format(logMessagePattern, accessDeniedException.getMessage(), request.getMethod(),
                request.getRequestURI(), errorResponse.getHttpStatus(), correlationId), accessDeniedException);

        PlcResponse plcResponse = new PlcResponse(errorResponse);
        response.setStatus(errorResponse.getHttpStatus().value());
        response.setContentType(APPLICATION_JSON_MIME);
        PrintWriter httpServletResponseWriter = response.getWriter();
        httpServletResponseWriter.print(jacksonObjectMapper.writeValueAsString(plcResponse));
        httpServletResponseWriter.flush();
        httpServletResponseWriter.close();
    }
}
