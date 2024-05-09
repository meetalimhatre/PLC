package com.sap.plc.backend.config.authorize;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Documented
@Target({ElementType.TYPE})
@Inherited
public @interface PlcAuthorizeSet {
    PlcAuthorize[] value() default {};
}
