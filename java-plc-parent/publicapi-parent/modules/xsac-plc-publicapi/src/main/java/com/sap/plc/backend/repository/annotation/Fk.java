package com.sap.plc.backend.repository.annotation;

import com.sap.plc.backend.model.Entity;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Fk {
    String name() default "";

    Class<? extends Entity> value();

    boolean isWildcard() default false;
}