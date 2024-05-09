package com.sap.plc.backend.filter.specification;

import com.sap.plc.backend.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.sql.Timestamp;
import java.util.Locale;

import static com.sap.plc.backend.error.ErrorCode.GENERAL_VALIDATION_ERROR;
import static com.sap.plc.backend.util.GeneralUtils.objectToTimestamp;

public class GenericSpecification<TEntity> implements Specification<TEntity> {

    private static final Logger LOGGER = LoggerFactory.getLogger(GenericSpecification.class);

    private SearchCriteria criteria;

    public GenericSpecification(SearchCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    public Predicate toPredicate
            (Root<TEntity> root, CriteriaQuery<?> query, CriteriaBuilder builder) {

        Predicate predicate;

        try {
            Class type = root.get(criteria.getKey()).getModel().getBindableJavaType();

            switch (criteria.getOperation().toUpperCase(Locale.ENGLISH)) {

                case ">":

                    if (type.isAssignableFrom(Timestamp.class) || type.isAssignableFrom(java.sql.Date.class)) {
                        predicate = builder.greaterThan(root.get(criteria.getKey()),
                                objectToTimestamp(criteria.getValue()));
                    } else {
                        predicate = builder.greaterThan(root.get(criteria.getKey()), criteria.getValue().toString());
                    }

                    break;

                case ">=":

                    if (type.isAssignableFrom(Timestamp.class) || type.isAssignableFrom(java.sql.Date.class)) {
                        predicate = builder.greaterThanOrEqualTo(root.get(criteria.getKey()),
                                objectToTimestamp(criteria.getValue()));
                    } else {
                        predicate = builder.greaterThanOrEqualTo(root.get(criteria.getKey()),
                                criteria.getValue().toString());
                    }

                    break;

                case "<":

                    if (type.isAssignableFrom(Timestamp.class) || type.isAssignableFrom(java.sql.Date.class)) {
                        predicate =
                                builder.lessThan(root.get(criteria.getKey()), objectToTimestamp(criteria.getValue()));
                    } else {
                        predicate = builder.lessThan(root.get(criteria.getKey()), criteria.getValue().toString());
                    }

                    break;

                case "<=":

                    if (type.isAssignableFrom(Timestamp.class) || type.isAssignableFrom(java.sql.Date.class)) {
                        predicate = builder.lessThanOrEqualTo(root.get(criteria.getKey()),
                                objectToTimestamp(criteria.getValue()));
                    } else {
                        predicate =
                                builder.lessThanOrEqualTo(root.get(criteria.getKey()), criteria.getValue().toString());
                    }

                    break;

                //startsWith
                case "~>":

                    if (type.isAssignableFrom(String.class)) {
                        predicate = builder.like(builder.lower(root.get(criteria.getKey())),
                                criteria.getValue().toString().toLowerCase() +
                                        "%");
                    } else {
                        LOGGER.error(
                                "Invalid type '{}' set for operator '{}'. Application Code: {}",
                                type.toString(), criteria.getOperation(),
                                GENERAL_VALIDATION_ERROR.getCode());
                        throw new BadRequestException();
                    }
                    break;

                //endsWith
                case "<~":

                    if (type.isAssignableFrom(String.class)) {
                        predicate = builder.like(builder.lower(root.get(criteria.getKey())),
                                "%" + criteria.getValue().toString().toLowerCase());
                    } else {
                        LOGGER.error(
                                "Invalid type '{}' set for operator '{}'. Application Code: {}",
                                type.toString(), criteria.getOperation(),
                                GENERAL_VALIDATION_ERROR.getCode());
                        throw new BadRequestException();
                    }
                    break;

                case "~":
                case "CONTAINS":

                    if (type.isAssignableFrom(String.class)) {
                        predicate = builder.like(builder.lower(root.get(criteria.getKey())),
                                "%" + criteria.getValue().toString().toLowerCase() + "%");
                    } else {
                        LOGGER.error(
                                "Invalid type '{}' set for operator '{}'. Application Code: {}",
                                type.toString(), criteria.getOperation(),
                                GENERAL_VALIDATION_ERROR.getCode());
                        throw new BadRequestException();
                    }
                    break;

                case "=":
                    if (isBooleanType(criteria.getValue())) {
                        predicate = builder.equal(root.get(criteria.getKey()),
                                Boolean.valueOf(criteria.getValue().toString()));
                    } else {
                        if (type.isAssignableFrom(Timestamp.class) || type.isAssignableFrom(java.sql.Date.class)) {
                            predicate =
                                    builder.equal(root.get(criteria.getKey()), objectToTimestamp(criteria.getValue()));
                        } else {
                            predicate = builder.equal(root.get(criteria.getKey()), criteria.getValue());
                        }

                    }

                    break;

                case "IN":
                    predicate = root.get(criteria.getKey()).in(("" + criteria.getValue()).split(","));
                    break;

                case "IS NULL":
                    predicate = builder.isNull(root.get(criteria.getKey()));
                    break;

                case "IS NOT NULL":
                    predicate = builder.isNotNull(root.get(criteria.getKey()));
                    break;

                case "!=":
                    predicate = builder.notEqual(root.get(criteria.getKey()), criteria.getValue());
                    break;

                default:
                    LOGGER.error(
                            "Invalid operator '{}'. Application Code: {}",
                            criteria.getOperation(), GENERAL_VALIDATION_ERROR.getCode());
                    throw new BadRequestException();

            }

            return predicate;

        } catch (IllegalArgumentException e) {
            LOGGER.error(
                    "Invalid filter value. Application Code: {}",
                    GENERAL_VALIDATION_ERROR.getCode());
            throw new BadRequestException();
        }
    }

    private boolean isBooleanType(Object value) {
        return (value != null &&
                (Boolean.TRUE.toString().equalsIgnoreCase(value.toString()) ||
                        Boolean.FALSE.toString().equalsIgnoreCase(value.toString())));
    }
}