package com.sap.plc.backend.controller.utils;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.sql.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static java.text.MessageFormat.format;

public class JsonDateDeserializer extends StdDeserializer<Date> {

    private static final long serialVersionUID = 7986825715665218401L;

    private static final String DATE_PATERN_REGEX = "^(\\d{4}-\\d{1,2}-\\d{1,2})(T[0-9:.Z+-]{0,20})?$";
    private static final Pattern DATE_PATTERN = Pattern.compile(DATE_PATERN_REGEX);

    public JsonDateDeserializer() {
        this(Date.class);
    }

    public JsonDateDeserializer(Class<Date> date) {
        super(date);
    }

    @Override
    public Date deserialize(JsonParser jsonParser, DeserializationContext deserializationContext)
            throws IOException {
        String value = jsonParser.readValueAs(String.class);
        Matcher matcher = DATE_PATTERN.matcher(value);
        if (matcher.matches()) {
            String dateValue = matcher.group(1);
            return Date.valueOf(dateValue);
        }
        String message = format("Invalid date format: {0} - expected {1}", value, DATE_PATERN_REGEX);
        throw new IllegalArgumentException(message);
    }
}
