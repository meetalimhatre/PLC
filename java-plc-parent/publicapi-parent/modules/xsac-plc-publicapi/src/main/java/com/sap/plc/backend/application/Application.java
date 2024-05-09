package com.sap.plc.backend.application;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.repository.EntityRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@ComponentScan(basePackages = "com.sap.plc.backend", lazyInit = true)
@EntityScan(basePackageClasses = {Entity.class})
@EnableJpaRepositories(basePackageClasses = {EntityRepository.class})
@EnableCaching
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @PostConstruct
    private void postConstruct() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }
}
