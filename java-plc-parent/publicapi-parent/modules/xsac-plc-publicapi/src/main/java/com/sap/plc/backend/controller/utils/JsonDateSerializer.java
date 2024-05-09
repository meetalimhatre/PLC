package com.sap.plc.backend.controller.utils;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;
import java.sql.Date;

public class JsonDateSerializer extends StdSerializer<Date> {

    private static final long serialVersionUID = -5089438887603102460L;

    public JsonDateSerializer() {
        this(Date.class);
    }

    public JsonDateSerializer(Class<Date> date) {
        super(date);
    }

    @Override
    public void serialize(Date date, JsonGenerator jsonGenerator,
                          SerializerProvider serializerProvider) throws IOException {
        if (date != null) {

            jsonGenerator.writeString(date.toString());
        }
    }
}
