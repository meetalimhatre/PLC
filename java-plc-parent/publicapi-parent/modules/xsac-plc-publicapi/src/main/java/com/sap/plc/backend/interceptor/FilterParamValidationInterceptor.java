package com.sap.plc.backend.interceptor;

import com.sap.plc.backend.controller.utils.RequestUtils;
import com.sap.plc.backend.exception.BadRequestException;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Stack;

import static com.sap.plc.backend.util.GeneralUtils.COMPILED_SEARCH_FILTER_PATTERN;
import static org.springframework.http.HttpMethod.GET;

public class FilterParamValidationInterceptor implements HandlerInterceptor {

    private static final Logger LOGGER = LoggerFactory.getLogger(FilterParamValidationInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        String filterValue = request.getParameter("filter");
        if (GET.matches(request.getMethod()) &&
                StringUtils.isNotBlank(filterValue) &&
                !areParenthesesBalanced(filterValue)) {

            LOGGER.error("'filter' parameter is invalid. Value: '{}' IP Address: '{}'", filterValue,
                    RequestUtils.getIP(request));
            throw new BadRequestException();
        }
        return true;
    }

    private static boolean areParenthesesBalanced(String filter) {
        Stack<Character> stack = new Stack<>();
        for (char c : filter.toCharArray()) {
            if ('[' == c) {
                stack.push(c);
            } else if (!stack.empty() && ']' == c) {
                stack.pop();
            } else if(stack.empty() && ']' == c) {
                return false;
            }
        }
        return stack.empty();
    }
}
