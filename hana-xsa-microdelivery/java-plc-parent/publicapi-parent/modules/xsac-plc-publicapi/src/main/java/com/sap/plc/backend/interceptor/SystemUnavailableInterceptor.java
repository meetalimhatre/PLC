package com.sap.plc.backend.interceptor;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.exception.SystemUnavailableException;
import com.sap.plc.backend.service.masterdata.LockService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import static com.sap.plc.backend.exception.SystemUnavailableException.MESSAGE;

public class SystemUnavailableInterceptor implements HandlerInterceptor {

    private static final Logger LOGGER = LoggerFactory.getLogger(SystemUnavailableInterceptor.class);

    private LockService lockService;

    public SystemUnavailableInterceptor(LockService lockService) {
        this.lockService = lockService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        if (lockService.existsLockByLockObjectAndNotExpiredSession(PublicAPI.METADATA)) {

            LOGGER.warn(MESSAGE + " The system is locked because the custom fields are in edit mode.");
            throw new SystemUnavailableException();
        }
        lockService.releaseLockTableByLockObject(PublicAPI.METADATA);
        return true;
    }
}
