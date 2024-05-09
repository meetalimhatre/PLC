package com.sap.plc.backend.controller.utils;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;

import static java.text.MessageFormat.format;

public class JsonBooleanDeserializer extends StdDeserializer<Boolean> {
    private static final long serialVersionUID = 6113548895227055849L;

    public JsonBooleanDeserializer() { this(Boolean.class); }

    public JsonBooleanDeserializer(Class<Boolean> bool) { super(bool); }

    private static final String TRUE = "true";
    private static final String FALSE = "false";
    private static final String VALID_VALUES = TRUE + ", " + FALSE;

    @Override
    public Boolean deserialize(JsonParser jsonParser, DeserializationContext deserializationContext)
            throws IOException {
        String value = jsonParser.readValueAs(String.class);
        switch (value) {
            case TRUE:
                return Boolean.TRUE;
            case FALSE:
                return Boolean.FALSE;
            default:
                String message = format("Invalid boolean value: {0} - expected one of: {1}", value, VALID_VALUES);
                throw new IllegalArgumentException(message);
        }
    }
}
