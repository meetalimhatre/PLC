package com.sap.plc.backend.config;

import com.sap.cloud.security.xsuaa.XsuaaServiceConfiguration;
import com.sap.cloud.security.xsuaa.token.TokenAuthenticationConverter;
import com.sap.plc.backend.config.authorize.PlcAccessDeniedHandler;
import com.sap.plc.backend.config.authorize.PlcAuthorization;
import com.sap.plc.backend.config.authorize.PlcAuthorizationBuilder;
import com.sap.plc.backend.interceptor.CorrelationIdFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.client.RestOperations;

import java.util.List;

import static com.sap.plc.xsa.sm.xsuaa.XsuaaFunctionalJwtDecoder.getFunctionalDecoder;

@Configuration
@EnableWebSecurity
public class WebAppConfigSecured {

    private final PlcAccessDeniedHandler plcAccessDeniedHandler;
    private final PlcAuthorizationBuilder plcAuthorizationBuilder;
    private final XsuaaServiceConfiguration xsuaaServiceConfiguration;
    private final CorrelationIdFilter correlationIdFilter;
    private final RestOperations xsuaaRestOperations;

    public WebAppConfigSecured(PlcAccessDeniedHandler plcAccessDeniedHandler,
                               PlcAuthorizationBuilder plcAuthorizationBuilder,
                               XsuaaServiceConfiguration xsuaaServiceConfiguration,
                               CorrelationIdFilter correlationIdFilter,
                               RestOperations xsuaaRestOperations) {
        this.plcAccessDeniedHandler = plcAccessDeniedHandler;
        this.plcAuthorizationBuilder = plcAuthorizationBuilder;
        this.xsuaaServiceConfiguration = xsuaaServiceConfiguration;
        this.correlationIdFilter = correlationIdFilter;
        this.xsuaaRestOperations = xsuaaRestOperations;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http.oauth2ResourceServer()
            .jwt()
            .decoder(getFunctionalDecoder(xsuaaServiceConfiguration, xsuaaRestOperations))
            .jwtAuthenticationConverter(getJwtAuthenticationConverter());

        List<PlcAuthorization> plcAuthorizationList = plcAuthorizationBuilder.build();
        var httpRequestBuilder = http.authorizeHttpRequests();

        plcAuthorizationList
                .stream()
                .filter(PlcAuthorization::isPlcAuth)
                .forEach(plcAuthorization -> httpRequestBuilder
                        .requestMatchers(HttpMethod.valueOf(plcAuthorization.getMethod()), plcAuthorization.getPath())
                        .access(new WebExpressionAuthorizationManager(plcAuthorization.getScopes())));
        httpRequestBuilder.anyRequest().denyAll();

        http.sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.NEVER)
            .and()
            .csrf().disable()
            .exceptionHandling().accessDeniedHandler(plcAccessDeniedHandler)
            .and()
            .addFilterAfter(correlationIdFilter, BasicAuthenticationFilter.class);

        return http.build();
    }

    private Converter<Jwt, AbstractAuthenticationToken> getJwtAuthenticationConverter() {
        TokenAuthenticationConverter converter = new TokenAuthenticationConverter(xsuaaServiceConfiguration);
        converter.setLocalScopeAsAuthorities(true);
        return converter;
    }
}
