package com.sap.plc.backend.config;

import com.sap.plc.backend.interceptor.FilterParamValidationInterceptor;
import com.sap.plc.backend.interceptor.RequestInterceptor;
import com.sap.plc.backend.interceptor.RequestParamValidationInterceptor;
import com.sap.plc.backend.interceptor.SystemUnavailableInterceptor;
import com.sap.plc.backend.interceptor.UserTrackingInterceptor;
import com.sap.plc.backend.service.masterdata.LockService;
import com.sap.plc.backend.service.security.UserTrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.util.UrlPathHelper;

@Configuration
public class WebAppInitializer implements WebMvcConfigurer {

    private final LockService lockService;
    private final Environment env;
    private final UserTrackingService userTrackingService;
    private final RequestInterceptor tenantInterceptor;

    public WebAppInitializer(LockService lockService, Environment env,
                             UserTrackingService userTrackingService,
                             @Autowired(required = false)
                             RequestInterceptor tenantInterceptor) {
        this.lockService = lockService;
        this.env = env;
        this.userTrackingService = userTrackingService;
        this.tenantInterceptor = tenantInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RequestParamValidationInterceptor());
        registry.addInterceptor(new FilterParamValidationInterceptor());
        if (env.acceptsProfiles(Profiles.of(ConfigConstants.CLOUD_FOUNDRY))) {
            registry.addInterceptor(tenantInterceptor);
        }
        registry.addInterceptor(new SystemUnavailableInterceptor(lockService));
        registry.addInterceptor(new UserTrackingInterceptor(userTrackingService));
    }

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        UrlPathHelper urlPathHelper = new UrlPathHelper();
        urlPathHelper.setUrlDecode(false);
        configurer.setUrlPathHelper(urlPathHelper);
    }

}
