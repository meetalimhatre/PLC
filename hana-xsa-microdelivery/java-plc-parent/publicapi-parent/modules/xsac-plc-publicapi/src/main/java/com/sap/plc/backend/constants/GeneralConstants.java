package com.sap.plc.backend.constants;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public interface GeneralConstants {

    String TEXTS = "texts";
    String RETURN_TYPE = "returnType";
    String CUSTOM_FIELDS = "customFields";
    String PRICE_COMPONENTS = "components";
    String CORRELATION_ID_HEADER = "x-correlationid";

    String WILDCARD = "*";

    List EXPAND_VALUES = Arrays.asList(TEXTS, CUSTOM_FIELDS);

    String OAUTH_HAS_SCOPE_MATCHING_PREFIX = "hasAuthority('";
    String OAUTH_HAS_SCOPE_MATCHING_SUFFIX = "')";

    String LANGUAGE = "LANGUAGE";
    String MANUAL_SUFFIX = "_MANUAL";
    Integer UOM_PROPERTY_TYPE = 6;
    Integer CURRENCY_PROPERTY_TYPE = 7;

    Integer CUSTOM_ITEM_CATEGORIES_LIMIT = 20;
    Integer CUSTOM_ITEM_CATEGORIES_SEQ_START = 30;
    Integer TEXTS_MAINTAINABLE = 1;

    Set<Integer> VALID_ITEM_CATEGORY_TEMPLATES = new HashSet<Integer>() {{
        add(1);
        add(2);
        add(3);
        add(4);
        add(6);
        add(7);
        add(8);
        add(9);
    }};

    Integer IS_YEAR_SELECTED = 1;
}
