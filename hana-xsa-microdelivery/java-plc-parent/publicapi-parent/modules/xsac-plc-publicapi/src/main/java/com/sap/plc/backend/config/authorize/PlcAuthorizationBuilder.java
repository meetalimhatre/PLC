package com.sap.plc.backend.config.authorize;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.lang.annotation.Annotation;
import java.lang.reflect.AnnotatedType;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

@Component
public class PlcAuthorizationBuilder {

    private static final String SCOPED_TARGET = "scopedTarget.";
    private ApplicationContext appContext;

    public PlcAuthorizationBuilder(ApplicationContext appContext) {
        this.appContext = appContext;
    }

    public List<PlcAuthorization> build() {

        String[] authorizedBeans = appContext.getBeanNamesForAnnotation(PlcAuthorize.class);
        List<PlcAuthorization> plcAuthorizationList = new LinkedList<>();

        Arrays.stream(authorizedBeans)
              .filter(authorizedBean -> authorizedBean.startsWith(SCOPED_TARGET))
              .forEach(authorizedBean -> {
                  Class<?> clazz = appContext.getType(authorizedBean);
                  Set<PlcAuthorizeSet> plcAuthorizeSets = getAnnotationFromSuperInterfaces(clazz,
                          PlcAuthorizeSet.class);

                  plcAuthorizeSets.forEach(plcAuthorizeSet -> {
                      for (PlcAuthorize plcAuthorize : plcAuthorizeSet.value()) {
                          plcAuthorizationList.add(new PlcAuthorization(plcAuthorize.name(), plcAuthorize.type(),
                                  plcAuthorize.flow(), plcAuthorize.method(), plcAuthorize.path(),
                                  plcAuthorize.scopes()));
                      }
                  });

              });

        return plcAuthorizationList;
    }

    private <A extends Annotation> Set<A> getAnnotationFromSuperInterfaces(
            Class<?> targetClass, Class<A> annotationClass) {

        AnnotatedType[] annotatedInterfaces = targetClass.getAnnotatedInterfaces();
        Set<A> annotationSet = new HashSet<>();
        for (AnnotatedType annotatedType : annotatedInterfaces) {
            Type type = annotatedType.getType();
            if (Class.class.isAssignableFrom(type.getClass())) {
                Class<?> typeClass = Class.class.cast(type);
                A annotation = typeClass.getAnnotation(annotationClass);
                if (annotation != null) {
                    annotationSet.add(annotation);
                }
            }
        }
        return annotationSet;
    }
}
