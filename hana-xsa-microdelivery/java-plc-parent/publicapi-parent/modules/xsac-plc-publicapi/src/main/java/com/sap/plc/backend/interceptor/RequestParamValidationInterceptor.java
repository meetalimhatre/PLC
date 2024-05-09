package com.sap.plc.backend.interceptor;

import com.sap.plc.backend.controller.utils.RequestUtils;
import com.sap.plc.backend.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class RequestParamValidationInterceptor implements HandlerInterceptor {

    private static final Logger LOGGER = LoggerFactory.getLogger(RequestParamValidationInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        if (HandlerMethod.class.isAssignableFrom(handler.getClass())) {

            HandlerMethod method = (HandlerMethod) handler;
            List<String> validRequestParameters = Stream.of(method.getMethod().getParameters())
                                                        .filter(parameter ->
                                                                parameter.getAnnotation(RequestParam.class) != null)
                                                        .map(parameter -> parameter.getAnnotation(RequestParam.class)
                                                                                   .value())
                                                        .collect(Collectors.toList());

            StringBuilder unknownParams = new StringBuilder();
            StringBuilder duplicateParams = new StringBuilder();

            request.getParameterMap().forEach((parameter, value) -> {

                if (!validRequestParameters.contains(parameter)) {

                    unknownParams.append("\"")
                                 .append(parameter)
                                 .append("\"  ");
                }

                if (value.length > 1) {

                    duplicateParams.append("\"")
                                   .append(parameter)
                                   .append("\"  ");
                }
            });

            if (!unknownParams.toString().isEmpty()) {

                logAndThrowBadRequest(unknownParams, RequestUtils.getIP(request),
                        "Request contains one or more unknown request parameters: {} IP Address: {}");
            }

            if (!duplicateParams.toString().isEmpty()) {

                logAndThrowBadRequest(duplicateParams, RequestUtils.getIP(request),
                        "Request contains one or more duplicate request parameters: {} IP Address: {}");
            }
        }

        return true;
    }

    private void logAndThrowBadRequest(StringBuilder unknownParams, String ipAddress, String message) {
        LOGGER.warn(message, unknownParams.toString(), ipAddress);
        throw new BadRequestException();
    }
}
