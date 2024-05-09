package com.sap.plc.backend.repository.cust;

import com.sap.plc.backend.controller.utils.JsonTimestampSerializer;
import com.sap.plc.backend.error.ErrorCode;
import com.sap.plc.backend.exception.BadRequestException;
import com.sap.plc.backend.exception.PlcException;
import com.sap.plc.backend.exception.RepositoryException;
import com.sap.plc.backend.filter.specification.builder.GenericSpecificationsBuilder;
import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.model.metadata.Metadata;
import com.sap.plc.backend.service.MetadataService;
import com.sap.plc.backend.util.EntityUtils;
import com.sap.plc.backend.util.GeneralUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.query.QueryUtils;
import org.springframework.util.CollectionUtils;

import jakarta.annotation.Resource;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Selection;
import java.lang.reflect.InvocationTargetException;
import java.sql.Timestamp;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.sap.plc.backend.constants.GeneralConstants.CURRENCY_PROPERTY_TYPE;
import static com.sap.plc.backend.constants.GeneralConstants.MANUAL_SUFFIX;
import static com.sap.plc.backend.constants.GeneralConstants.UOM_PROPERTY_TYPE;
import static com.sap.plc.backend.util.GeneralUtils.COMPILED_SEARCH_FILTER_PATTERN;
import static com.sap.plc.backend.util.GeneralUtils.removeQuote;
import static com.sap.plc.backend.util.GeneralUtils.validateOperation;

public abstract class GenericRepository<TEntity> implements CustomRepository<TEntity> {

    private static final Logger LOGGER = LoggerFactory.getLogger(GenericRepository.class);
    private static final String ENTITY = "entity";
    private static final String CFS = "cfs";
    private static final String TEXTS = "texts";
    private static final String SELECT_FILTER = "SELECT %1$s FROM %2$s " + ENTITY;
    private static final String filterCF = "LEFT OUTER JOIN %1$s " + CFS + " ON %2$s";
    private static final String filterText = "LEFT OUTER JOIN %1$s " + TEXTS + " ON %2$s";
    private static final String SQL_PLACEHOLDER = "_ph";
    private static final String FIELDS_PATTERN = "(\\d+_)(.*)(" + SQL_PLACEHOLDER + ")";
    private static final Pattern FIELDS_COMPILED_PATTERN = Pattern.compile(FIELDS_PATTERN);
    private static final Map<String, Entity> entityInstances = new HashMap<>();

    @PersistenceContext
    protected EntityManager em;

    @Resource
    protected Environment env;

    @Resource
    private MetadataService metadataService;

    @Resource
    private String nativeSqlRegexp;

    private Class<TEntity> entityClass = getEntityClass();
    private Class entityTextClass;

    {
        try {
            entityTextClass = Class.forName(entityClass.getName() + "Text");
        } catch (ClassNotFoundException e) {
            LOGGER.debug("Text class not found for Entity {}", entityClass.getSimpleName());
        }
    }

    private Entity entity = getEntity(entityClass);
    private String entityTableName = entity.getTableName() == null ? null :
            "\"" + entity.getTableName().replaceAll("`", "").replaceAll("\"", "") + "\"";
    private String cfTableName = entity.getExtensionTableName() == null ? null :
            "\"" + entity.getExtensionTableName().replaceAll("`", "").replaceAll("\"", "") + "\"";
    private String textTableName = entity.getTextTableName() == null ? null :
            "\"" + entity.getTextTableName().replaceAll("`", "").replaceAll("\"", "") + "\"";

    private Map<String, String> entityFields = Entity.getFieldsMap(entityClass);
    private Map<String, String> entityTextFields = Entity.getFieldsMap(entityTextClass);
    private Map<String, String> entityIds = Entity.getIdsMap(entityClass);
    private Set<String> cfNames = null;
    private Set<String> cfStringType = null;
    private Set<String> cfDateType = null;
    private Map<String, Class> entityFieldsTypes = new HashMap<String, Class>() {{
        putAll(Entity.getFieldsTypeMap(entityClass));
        putAll(Entity.getFieldsTypeMap(entityTextClass));
    }};

    public Page<TEntity> findUsingFilter(String searchFilter, List<String> fields, Pageable page) {

        Page<TEntity> result;

        CriteriaBuilder cb = em.getCriteriaBuilder();

        if (CollectionUtils.isEmpty(fields)) {
            CriteriaQuery<TEntity> cq = cb.createQuery(entityClass);
            Root<TEntity> root = cq.from(entityClass);
            result = searchCriteriaQueryRoot(getPredicate(searchFilter, cb, cq, root), cq, root, page);
        } else {
            CriteriaQuery<Tuple> cqt = cb.createTupleQuery();
            Root<TEntity> root = cqt.from(entityClass);
            result = searchCriteriaQueryTuple(fields, getPredicate(searchFilter, cb, cqt, root), cqt, root, page);
        }

        return result;
    }

    private Entity getEntity(Class<TEntity> entity) {
        if (!entityInstances.containsKey(entity.getCanonicalName())) {
            try {
                entityInstances.put(entity.getCanonicalName(), (Entity) entity.newInstance());
            } catch (InstantiationException | IllegalAccessException e) {
                LOGGER.error("Error while trying to get entity {}", entity.getCanonicalName());
            }
        }

        return entityInstances.get(entity.getCanonicalName());
    }

    private Map<String, String> getFreshCFNameTypeMap() {
        Map<String, String> result = new HashMap<>();

        List<Metadata> cfMetadata = metadataService
                .findByPathAndBusinessObjectAndIsCustom(entity.getMetadataBusinessObject(), entity.getMetadataPath(),
                        1);

        cfMetadata.forEach(
                cfm -> {
                    String cfColName = cfm.getColumnId();
                    if (!UOM_PROPERTY_TYPE.equals(cfm.getPropertyType()) &&
                            !CURRENCY_PROPERTY_TYPE.equals(cfm.getPropertyType())) {
                        cfColName += MANUAL_SUFFIX;
                    }
                    result.put(cfColName, cfm.getSemanticDataType());
                }
        );

        return result;
    }

    private Set<String> getCFNames() {
        if (this.cfNames == null) {
            this.cfNames = getFreshCFNameTypeMap().keySet();
        }

        return this.cfNames;
    }

    private Set<String> getCFWithStringType() {
        if (this.cfStringType == null) {
            this.cfStringType = getFreshCFNameTypeMap().entrySet().stream()
                                                       .filter(stringStringEntry -> String.class.getSimpleName()
                                                                                                .equals(stringStringEntry
                                                                                                        .getValue()))
                                                       .map(Map.Entry::getKey).collect(Collectors.toSet());
        }

        return this.cfStringType;
    }

    private Set<String> getCFWithDateType() {
        if (this.cfDateType == null) {
            this.cfDateType = getFreshCFNameTypeMap().entrySet().stream()
                                                     .filter(stringDateEntry -> Date.class.getSimpleName()
                                                                                          .equals(stringDateEntry
                                                                                                  .getValue()) ||
                                                             Timestamp.class.getSimpleName()
                                                                            .equals(stringDateEntry
                                                                                    .getValue()))
                                                     .map(Map.Entry::getKey).collect(Collectors.toSet());
        }
        return this.cfDateType;
    }

    /**
     * @return an ON clause by the format of "ON %1.a=%2.b AND %1.c=%2.d"
     */

    private String getOnClause() {
        StringBuffer result = new StringBuffer();

        entity.getIdsMap().values()
              .forEach(val -> result.append("%1$s.").append(val).append("=").append("%2$s.").append(val)
                                    .append(" AND "));

        return result.substring(0, result.length() - 5);
    }

    private boolean hasTextSelection(String searchFilter) {

        Set<String> entityTextFieldsKeys = entityTextFields.keySet();

        String[] stringArray = new String[entityTextFieldsKeys.size()];
        String[] fields = entityTextFieldsKeys.toArray(stringArray);

        return StringUtils.containsAny(searchFilter, fields);
    }

    /**
     * This method takes the user selection, field set and page size and order and constructs a sql select with
     * 2 inner joins (if that entity supports both custom fields and texts - otherwise zero or one join: cfs or texts).
     *
     * @param searchFilter - the search filter coming from the user.
     * @param validAt      - the validity of the fetched entities.
     * @param page         - the result page size and order.
     * @param whereValues  - a map of values for the named sql placeholders determined by this method. They will be used on setParameter.
     * @return - the generated sql with named sql placeholders and the reference parameter whereValues.
     */
    public String getNativeSQLFilterCFText(String searchFilter, Timestamp validAt, Pageable page,
                                           Map<String, String> whereValues) {
        StringBuffer resultingSQL = new StringBuffer();

        if (cfTableName != null) {
            resultingSQL.append(" ")
                        .append(String.format(filterCF, cfTableName, String.format(getOnClause(), "entity", "cfs")));
            LOGGER.debug("Adding join for cfs - ResultingSQL:" + resultingSQL);
        }

        if (textTableName != null && hasTextSelection(searchFilter)) {
            resultingSQL.append(" ")
                        .append(String
                                .format(filterText, textTableName, String.format(getOnClause(), "entity", "texts")));
            LOGGER.debug("Adding join for texts - ResultingSQL:" + resultingSQL);
        }

        addSearchFilter(searchFilter, whereValues, resultingSQL);

        if (validAt != null) {
            if (StringUtils.isBlank(searchFilter)) {
                resultingSQL.append(" WHERE ");
            } else {
                resultingSQL.append(" AND (");
            }

            resultingSQL.append(ENTITY).append(".").append("_VALID_FROM").append(" <= '")
                        .append(JsonTimestampSerializer.serialize(validAt))
                        .append("' AND (")
                        .append(ENTITY).append(".").append("_VALID_TO").append(" > '")
                        .append(JsonTimestampSerializer.serialize(validAt))
                        .append("' OR ").append(ENTITY).append(".").append("_VALID_TO").append(" IS NULL")
                        .append(")");
            if (StringUtils.isNotBlank(searchFilter)) {
                resultingSQL.append(")");
            }

            LOGGER.debug("Adding validity for ResultingSQL:" + resultingSQL);
        }

        StringBuffer selection = new StringBuffer();

        for (String dbEntityField : entityIds.values()) {
            selection.append(ENTITY).append(".").append(dbEntityField).append(",");
        }

        if (page != null && page.getSort() != null && page.getSort().isSorted()) {

            resultingSQL.append(" GROUP BY ");
            resultingSQL.append(selection.toString());
            resultingSQL.append(page.getSort().stream()
                                    .map(order -> ENTITY + "." + entityFields.get(order.getProperty()))
                                    .collect(Collectors.joining(",")));
            resultingSQL.append(" ORDER BY ")
                        .append(page.getSort().stream()
                                    .map(order -> ENTITY + "." + entityFields.get(order.getProperty()) + " " +
                                            order.getDirection().name())
                                    .collect(Collectors.joining(",")));

            LOGGER.debug("Adding order for ResultingSQL:" + resultingSQL);
        }

        selection.delete(selection.length() - 1, selection.length());
        resultingSQL.insert(0, String.format(SELECT_FILTER, selection, entityTableName));

        LOGGER.debug("Adding selection fields for ResultingSQL:" + resultingSQL);

        return resultingSQL.toString();
    }

    private void addSearchFilter(String searchFilter, Map<String, String> whereValues, StringBuffer resultingSQL) {
        if (StringUtils.isNotBlank(searchFilter)) {

            Matcher matcher = COMPILED_SEARCH_FILTER_PATTERN.matcher(searchFilter + " AND");

            for (int placeholderIndex = 0; matcher.find(); placeholderIndex++) {

                String field = matcher.group(1);
                String operator = matcher.group(2);
                validateOperation(operator);
                String value = StringUtils.trim(matcher.group(3));

                String placeholder = placeholderIndex + "_" + field + SQL_PLACEHOLDER;

                String[] specialChars = {"*", "(", ")", "+", "|"};
                String[] specialCharsReplacement = {"\\*", "\\(", "\\)", "\\+", "\\|"};

                if (StringUtils.isNotBlank(value)) {
                    switch (operator.trim().toUpperCase()) {
                        case "!=": {
                            searchFilter = searchFilter.replaceFirst("\\s*" + field + "\\s*" + operator + "\\s*" +
                                            StringUtils.replaceEach(value, specialChars, specialCharsReplacement) + "\\s*",
                                    getRegexReplacementForSearchFilter(field, operator, placeholder) + " OR " + field +
                                            " is null ");
                            value = isStringType(field) ? "^(?!" + removeQuote(StringUtils.replaceEach(value,
                                    specialChars, specialCharsReplacement)) + "$).*" :
                                    removeQuote(value);
                            break;
                        }
                        case "=": {
                            searchFilter = searchFilter.replaceFirst("\\s*" + field + "\\s*" + operator + "\\s*" +
                                            StringUtils.replaceEach(value, specialChars, specialCharsReplacement) + "\\s*",
                                    getRegexReplacementForSearchFilter(field, operator, placeholder));
                            value = isStringType(field) ? "^" + removeQuote(StringUtils.replaceEach(value,
                                    specialChars, specialCharsReplacement)) + "$" :
                                    removeQuote(value);
                            break;
                        }
                        case "~>": {
                            searchFilter = searchFilter.replaceFirst("\\s*" + field + "\\s*" + operator + "\\s*" +
                                            StringUtils.replaceEach(value, specialChars, specialCharsReplacement) + "\\s*",
                                    getRegexReplacementForSearchFilter(field, operator, placeholder));
                            value = "^" + removeQuote(StringUtils.replaceEach(value,
                                    specialChars, specialCharsReplacement));
                            break;
                        }
                        case "<~": {
                            searchFilter = searchFilter.replaceFirst("\\s*" + field + "\\s*" + operator + "\\s*" +
                                            StringUtils.replaceEach(value, specialChars, specialCharsReplacement) + "\\s*",
                                    getRegexReplacementForSearchFilter(field, operator, placeholder));
                            value = removeQuote(StringUtils.replaceEach(value,
                                    specialChars, specialCharsReplacement)) + "$";
                            break;
                        }
                        case "~":
                        case "CONTAINS": {
                            searchFilter = searchFilter.replaceFirst("\\s*" + field + "\\s*" + operator + "\\s*" +
                                            StringUtils.replaceEach(value, specialChars, specialCharsReplacement) + "\\s*",
                                    getRegexReplacementForSearchFilter(field, operator, placeholder));
                            value = "^.*" + removeQuote(StringUtils.replaceEach(value,
                                    specialChars, specialCharsReplacement)) + ".*$";
                            break;
                        }
                        default: {
                            searchFilter = searchFilter.replaceFirst("\\s*" + field + "\\s*" + operator + "\\s*" +
                                            StringUtils.replaceEach(value, specialChars, specialCharsReplacement) + "\\s*",
                                    getUpperReplacementForSearchFilter(field, operator, placeholder));
                            value = isStringType(field) ? removeQuote(StringUtils.replaceEach(value,
                                    specialChars, specialCharsReplacement)).toUpperCase() : removeQuote(value);
                            break;
                        }
                    }
                }

                whereValues.put(placeholder, value);
            }

            Set<String> whereFields = getFieldsFromPlaceholders(whereValues.keySet());

            for (String whereField : whereFields) {

                if (entityFields.containsKey(whereField)) {
                    searchFilter = searchFilter.replaceAll("\\b" + whereField + "\\b",
                            " " + ENTITY + "." + entityFields.get(whereField) + " ");

                } else if (getCFNames().contains(whereField)) {
                    searchFilter = searchFilter.replaceAll("\\b" + whereField + "\\b",
                            " " + CFS + "." + whereField + " ");

                } else if (entityTextFields.containsKey(whereField)) {
                    searchFilter = searchFilter.replaceAll("\\b" + whereField + "\\b",
                            " " + TEXTS + "." + entityTextFields.get(whereField) + " ");

                } else {
                    LOGGER.error("Invalid property: {} for {}", whereField, entity.getMetadataBusinessObject());
                    throw new RepositoryException(
                            "Invalid property: " + whereField + " for " + entity.getMetadataBusinessObject());
                }

            }
            searchFilter = searchFilter.replace("[", "(");
            searchFilter = searchFilter.replace("]", ")");
            resultingSQL.append(" WHERE (").append(searchFilter).append(")");
            LOGGER.debug("Adding WHERE for ResultingSQL:" + resultingSQL);
        }
    }

    private String getUpperReplacementForSearchFilter(String field, String operand, String placeholder) {
        return isStringType(field) ? " UPPER(" + field + ") " + operand + " :" + placeholder + " " :
                " " + field + " " + operand + " :" + placeholder + " ";
    }

    private String getRegexReplacementForSearchFilter(String field, String operand, String placeholder) {
        return isStringType(field) ? MessageFormat.format(nativeSqlRegexp, field, placeholder) :
                " " + field + " " + operand + "  :" + placeholder + " ";
    }

    private boolean isStringType(String field) {
        return String.class.equals(entityFieldsTypes.get(field)) || getCFWithStringType().contains(field);
    }

    private boolean isDateType(String field) {
        return Timestamp.class.equals(entityFieldsTypes.get(field)) ||
                Date.class.equals(entityFieldsTypes.get(field)) || getCFWithDateType().contains(field);
    }

    private boolean areQuotesNeeded(String field) {
        return isStringType(field) || isDateType(field);
    }

    public static Set<String> getFieldsFromPlaceholders(Set<String> placeholders) {
        Set<String> result = new LinkedHashSet<>();

        if (placeholders == null) {
            return result;
        }

        for (String key : placeholders) {

            Matcher matcher = FIELDS_COMPILED_PATTERN.matcher(key);

            while (matcher.find()) {
                result.add(matcher.group(2));

            }
        }

        return result;
    }

    public Page<? extends PrimaryKey> findEntityPKsUsingFilterCFText(String searchFilter, Timestamp validAt, Pageable
            page) {

        Map<String, String> whereValues = new LinkedHashMap<>();

        Query query = em.createNativeQuery(
                getNativeSQLFilterCFText(searchFilter, validAt, page, whereValues), Tuple.class);

        if (!CollectionUtils.isEmpty(whereValues)) {
            for (Map.Entry<String, String> entry : whereValues.entrySet()) {
                if (StringUtils.isNotEmpty(entry.getValue())) {
                    query.setParameter(entry.getKey(), Arrays.asList(entry.getValue().split(",")));
                }
            }
        }

        return executeParentEntityPKsNativeQuery(query, entityIds.keySet(), page);
    }

    public abstract Class<TEntity> getEntityClass();

    protected Page<TEntity> searchCriteriaQueryRoot(Predicate predicate, CriteriaQuery<TEntity> cq, Root<TEntity> root,
                                                    Pageable page) {

        cq.select(root);

        if (predicate != null) {
            cq.where(predicate);
        }

        List<TEntity> result = executeCriteriaQuery(cq, page);

        return new PageImpl<>(result, page, result.size());
    }

    private Predicate getPredicate(String searchFilter, CriteriaBuilder cb, CriteriaQuery cq,
                                   Root<TEntity> root) {
        GenericSpecificationsBuilder builder = getSpecBuilder();

        Predicate predicate = null;

        if (!StringUtils.isBlank(searchFilter)) {
            predicate = builder.build(searchFilter).toPredicate(root, cq, cb);
        }

        return predicate;
    }

    protected Page<TEntity> searchCriteriaQueryTuple(List<String> fields, Predicate predicate, CriteriaQuery<Tuple> cqt,
                                                     Root<TEntity> root, Pageable page) {

        Class<TEntity> entityClass = getEntityClass();

        List<Selection<?>> selection = new LinkedList<>();

        for (String field : fields) {
            try {
                selection.add(root.get(field));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException();
            }
        }

        cqt.multiselect(selection);

        if (predicate != null) {
            cqt.where(predicate);
        }

        List<Tuple> tupleResult = executeCriteriaQuery(cqt, page);

        List<TEntity> result = new LinkedList<>();
        for (Tuple tuple : tupleResult) {
            try {
                result.add(EntityUtils.factory(entityClass, fields, Arrays.asList(tuple.toArray())));
            } catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException
                    | InvocationTargetException | InstantiationException e) {
                LOGGER.error("Could not create {} instance.", entityClass);
                throw new PlcException(ErrorCode.GENERAL_UNEXPECTED_ERROR);
            }
        }

        return new PageImpl<>(result, page, result.size());
    }

    private <T> List<T> executeCriteriaQuery(CriteriaQuery<T> cq, Pageable page) {
        if (page != null && !CollectionUtils.isEmpty(cq.getRoots()) && page.getSort() != null) {
            cq.orderBy(
                    QueryUtils.toOrders(page.getSort(), cq.getRoots().iterator().next(), em.getCriteriaBuilder()));
        }

        Query q = em.createQuery(cq);

        return executeQuery(q, page);
    }

    protected <T> List<T> executeQuery(Query q, Pageable page) {

        if (page != null) {

            q.setFirstResult((int) page.getOffset());
            q.setMaxResults(page.getPageSize());
        }

        List<T> result = q.getResultList();

        if (result == null) {
            result = Collections.emptyList();
        }

        return result;
    }

    private <TPK extends PrimaryKey> Page<TPK> executeParentEntityPKsNativeQuery(Query q,
                                                                                 Set<String> parentEntityIds,
                                                                                 Pageable page) {

        List<Tuple> tupleResult = executeQuery(q, page);

        List<TPK> result = new LinkedList<>();
        for (Tuple tuple : tupleResult) {
            try {
                TEntity e = EntityUtils
                        .factory(entityClass, new ArrayList<>(parentEntityIds), Arrays.asList(tuple.toArray()));
                if (!(((Entity) e).getEntityKey() instanceof PrimaryKey)) {
                    throw new UnsupportedOperationException(
                            "This entity does not have a PrimaryKey, so it is not supported.");
                }
                result.add((TPK) ((Entity) e).getEntityKey());
            } catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException
                    | InvocationTargetException | InstantiationException e) {
                LOGGER.error("Could not create {} instance.", entityClass);
                return new PageImpl(Collections.emptyList(), page, 0);
            }
        }

        return new PageImpl(result, page, result.size());
    }

    public Page<TEntity> findByPKInNative(List<? extends PrimaryKey> pks, List<String> fields, Pageable page) {
        Page<TEntity> result;

        if (CollectionUtils.isEmpty(fields)) {
            fields = new ArrayList(Entity.getFieldsMap(entityClass).keySet());
        }

        Query query = em.createNativeQuery(getFindByPKInNativeSQL(pks, fields, page), Tuple.class);

        result = executeEntityQuery(query, fields, page);

        return result;
    }

    public String getFindByPKInNativeSQL(List<? extends PrimaryKey> pks, List<String> fields, Pageable page) {

        if (CollectionUtils.isEmpty(pks)) {
            return null;
        }

        StringBuffer resultingSQL = new StringBuffer(" WHERE (");

        List<String> pkParts = new LinkedList<>();

        for (Map.Entry<String, String> field : entityIds.entrySet()) {
            pkParts.add(field.getKey());
            resultingSQL.append(ENTITY).append(".").append(field.getValue()).append(",");
        }
        resultingSQL.deleteCharAt(resultingSQL.length() - 1);
        resultingSQL.append(") IN ");

        LOGGER.debug("Adding WHERE IN clause in ResultingSQL:" + resultingSQL);

        resultingSQL.append("(");
        for (PrimaryKey pk : pks) {
            resultingSQL.append("(");
            Map<String, String> pkMap = GeneralUtils.getPKAsMap(pk);

            for (String pkPart : pkParts) {
                if (areQuotesNeeded(pkPart)) {
                    resultingSQL.append("'").append(pkMap.get(pkPart)).append("',");
                } else {
                    resultingSQL.append(pkMap.get(pkPart)).append(",");
                }
            }
            resultingSQL.deleteCharAt(resultingSQL.length() - 1);
            resultingSQL.append("),");
        }
        resultingSQL.deleteCharAt(resultingSQL.length() - 1);
        resultingSQL.append(")");

        LOGGER.debug("Adding WHERE IN clause values in ResultingSQL:" + resultingSQL);

        if (page != null && page.getSort() != null && page.getSort().isSorted()) {
            resultingSQL.append(" ORDER BY ")
                        .append(page.getSort().stream().map(
                                            order -> ENTITY + "." + entityFields.get(order.getProperty()) + " " +
                                                    order.getDirection().name())
                                    .collect(Collectors.joining(",")));

            LOGGER.debug("Adding order for ResultingSQL:" + resultingSQL);
        }

        StringBuffer selection = new StringBuffer();

        for (String field : fields) {
            selection.append(ENTITY).append(".").append(entityFields.get(field)).append(",");
        }

        selection.deleteCharAt(selection.length() - 1);
        resultingSQL.insert(0, String.format(SELECT_FILTER, selection, entityTableName));

        LOGGER.debug("Adding selection fields for ResultingSQL:" + resultingSQL);

        return resultingSQL.toString();

    }

    private Page<TEntity> executeEntityQuery(Query q, List<String> fields, Pageable page) {

        List<Tuple> tupleResult = executeQuery(q, page);

        List<TEntity> result = new LinkedList<>();
        for (Tuple tuple : tupleResult) {
            try {
                TEntity e = EntityUtils.factory(entityClass, new ArrayList<>(fields), Arrays.asList(tuple.toArray()));

                result.add(e);
            } catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException
                    | InvocationTargetException | InstantiationException e) {
                LOGGER.error("Could not create {} instance.", entityClass);
                return new PageImpl(Collections.emptyList());
            }
        }

        return new PageImpl(result);
    }

    public abstract GenericSpecificationsBuilder<TEntity> getSpecBuilder();

    public List<TEntity> persistAll(List<TEntity> entityList) {
        List<TEntity> savedEntityList = new ArrayList<>(entityList.size());
        entityList.forEach(entity -> {
            em.persist(entity);
            savedEntityList.add(entity);
        });
        return savedEntityList;
    }
}