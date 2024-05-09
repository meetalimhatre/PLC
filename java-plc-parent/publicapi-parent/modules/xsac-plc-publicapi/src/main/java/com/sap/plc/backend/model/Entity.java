package com.sap.plc.backend.model;

import com.sap.plc.backend.repository.annotation.Fk;
import com.sap.plc.backend.util.GeneralUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;

import jakarta.annotation.Resource;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.Serializable;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static java.text.MessageFormat.format;

public class Entity<TEntity, TEntityId> implements Serializable {

    private static final long serialVersionUID = 1863784864323752971L;

    @Transient
    private static Map<String, Map<String, String>> idsMap = new HashMap<>();
    @Transient
    private static Map<String, Map<String, String>> fieldsMap = new HashMap<>();
    @Transient
    private static Map<String, Map<String, Class>> fieldsTypeMap = new HashMap<>();
    @Transient
    private static Map<String, Map<String, Fk>> fksMap = new HashMap<>();

    @Transient
    private static Map<Class, String> tableNames = new HashMap<>();

    @Transient
    private static Map<Class, String> metadataPath = new HashMap<>();

    @Transient
    @Resource
    protected Logger logger;

    public static String getTableNameForClass(Class clazz) {
        Table tableAnnotation = (Table) clazz.getAnnotation(Table.class);

        return tableAnnotation.name();
    }

    protected static void initializeFieldMaps(Class clazz) {
        Map<String, String> fieldsMapLocal = new LinkedHashMap<>();
        Map<String, Class> fieldsTypeMapLocal = new LinkedHashMap<>();
        Map<String, String> idsMapLocal = new LinkedHashMap<>();
        List<Field> declaredFields = GeneralUtils.getAllFields(new ArrayList<>(), clazz);

        for (Field field : declaredFields) {
            if (field.isAnnotationPresent(Column.class)) {
                Column columnAnnotation = field.getAnnotation(Column.class);

                fieldsMapLocal.put(field.getName(), columnAnnotation.name());
                if (field.isAnnotationPresent(Id.class)) {
                    idsMapLocal.put(field.getName(), columnAnnotation.name());
                }
                fieldsTypeMapLocal.put(field.getName(), field.getType());
            }
        }

        fieldsMap.putIfAbsent(clazz.getName(), fieldsMapLocal);
        fieldsTypeMap.putIfAbsent(clazz.getName(), fieldsTypeMapLocal);
        idsMap.putIfAbsent(clazz.getName(), idsMapLocal);
    }

    /**
     * @return Returns a Map storing key=ORM key Column, value=Table Key Column
     */
    public static Map<String, String> getIdsMap(Class clazz) {

        if (clazz != null) {

            Map<String, String> ids = idsMap.get(clazz.getName());
            if (ids != null) {
                return ids;
            }

            initializeFieldMaps(clazz);

            return idsMap.get(clazz.getName());
        }
        return Collections.emptyMap();
    }

    /**
     * @return Returns a Map storing key=ORM key Column, value=Table Key Column
     */
    public static Map<String, String> getFieldsMap(Class clazz) {

        if (clazz != null) {
            Map<String, String> fields = fieldsMap.get(clazz.getName());
            if (fields != null) {
                return fields;
            }

            initializeFieldMaps(clazz);

            return fieldsMap.get(clazz.getName());
        }
        return Collections.emptyMap();
    }

    /**
     * Returns a Map storing key=ORM key Column, value=Field Type
     *
     * @param clazz Entity class
     */
    public static Map<String, Class> getFieldsTypeMap(Class clazz) {

        if (clazz != null) {

            Map<String, Class> fieldsType = fieldsTypeMap.get(clazz.getName());
            if (fieldsType != null) {
                return fieldsType;
            }

            initializeFieldMaps(clazz);

            return fieldsTypeMap.get(clazz.getName());
        }
        return Collections.emptyMap();
    }

    public String getTableName() {
        Class clazz = this.getClass();
        if (!tableNames.containsKey(clazz)) {
            tableNames.put(clazz, Entity.getTableNameForClass(this.getClass()));
        }
        return tableNames.get(clazz);
    }

    public String getMetadataPath() {
        if (!metadataPath.containsKey(this.getClass())) {

            String[] tokens =
                    getTableName().replace("`", "").replace("\"", "").replace("sap.plc.db::basis.t_", "").split("_");

            StringBuilder sb = new StringBuilder();

            for (String s : tokens) {
                sb.append(StringUtils.capitalize(s)).append("_");
            }

            metadataPath.put(this.getClass(), sb.substring(0, sb.length() - 1));
        }

        return metadataPath.get(this.getClass());
    }

    public String getMetadataBusinessObject() {
        return getMetadataPath();
    }

    public Map<String, Fk> geFKsMap(Class clazz) {
        if (fksMap.get(clazz.getName()) != null) {
            return fksMap.get(clazz.getName());
        }

        Map<String, Fk> fksMapLocal = new LinkedHashMap<>();
        List<Field> declaredFields = new ArrayList<>(Arrays.asList(clazz.getDeclaredFields()));
        declaredFields.addAll(Arrays.asList(clazz.getSuperclass().getDeclaredFields()));
        for (Field field : declaredFields) {
            Fk fkAnnotation = field.getAnnotation(Fk.class);
            if (fkAnnotation != null) {
                String fName = field.getName();

                fksMapLocal.put(fName, fkAnnotation);
            }
        }

        fksMap.putIfAbsent(clazz.getName(), fksMapLocal);

        return fksMapLocal;
    }

    public String getValue(String field) {
        BeanInfo beanInfo;
        try {
            beanInfo = Introspector.getBeanInfo(this.getClass());

            for (PropertyDescriptor pd : beanInfo.getPropertyDescriptors()) {
                if (pd.getName().equals(field)) {
                    Object result = pd.getReadMethod().invoke(this);
                    return result == null ? null : result.toString();
                }
            }

        } catch (IntrospectionException | InvocationTargetException | IllegalAccessException e) {
            logger.error("Exception thrown during com.sap.plc.backend.model.Entity.getValue", e);
        }

        return null;
    }

    public TEntityId getEntityKey() {
        TEntityId result;
        Class entityClass = this.getClass();

        IdClass idClass = (IdClass) entityClass.getAnnotation(IdClass.class);
        try {
            result = (TEntityId) idClass.value().getDeclaredConstructor().newInstance();
        } catch (InstantiationException | IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            String message = format("Could not create entity key type of {0}",
                    idClass.value().getName());
            logger.error(message);
            throw new AbstractMethodError(message);
        }

        try {
            BeanInfo beanInfo = Introspector.getBeanInfo(this.getClass());
            Map<String, PropertyDescriptor> pdMap = new HashMap<>();
            Arrays.asList(beanInfo.getPropertyDescriptors()).forEach(pd -> pdMap.put(pd.getName(), pd));
            this.getIdsMap().keySet().forEach(key -> pdMap.get(key).getWriteMethod());

            for (String key : this.getIdsMap().keySet()) {
                Method setter = pdMap.get(key).getWriteMethod();
                Method getter = pdMap.get(key).getReadMethod();
                if (getter == null || setter == null) {
                    continue;
                }

                Object val = getter.invoke(this);
                if (val != null) {
                    Method toWriter = result.getClass().getMethod(setter.getName(), setter.getParameterTypes());
                    toWriter.invoke(result, val);
                }
            }
        } catch (InvocationTargetException | IllegalAccessException | IntrospectionException | NoSuchMethodException e) {
            String message = format("Could not copy key values from entity {0} to key {1}",
                    entityClass, result.getClass());
            logger.error(message);
            throw new AbstractMethodError(message);
        }

        return result;
    }

    /**
     * @return Returns a Map storing key=ORM key Column, value=Table Key Column
     */
    public Map<String, String> getIdsMap() {
        return getIdsMap(this.getClass());
    }

    public String getExtensionTableName() {
        return null;
    }

    public String getTextTableName() {
        return null;
    }

}
