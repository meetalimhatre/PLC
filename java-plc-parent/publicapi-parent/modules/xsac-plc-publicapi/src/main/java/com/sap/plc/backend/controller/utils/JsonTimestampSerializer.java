package com.sap.plc.backend.controller.utils;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;

import static com.sap.plc.backend.controller.utils.DateTimeUtils.PLC_DATE_TIME_STANDARD_FORMAT;

public class JsonTimestampSerializer extends StdSerializer<Timestamp> {

    private static final long serialVersionUID = -6518751837031392714L;

    public JsonTimestampSerializer() {
        this(Timestamp.class);
    }

    public JsonTimestampSerializer(Class<Timestamp> t) {
        super(t);
    }

    @Override
    public void serialize(Timestamp timestamp, JsonGenerator jsonGenerator,
                          SerializerProvider serializerProvider) throws IOException {
        if (timestamp != null) {
            String instantString = serialize(timestamp);
            jsonGenerator.writeString(instantString);
        }
    }

    public static String serialize(Timestamp timestamp) {
        Instant instant = timestamp.toInstant();
        String instantString = PLC_DATE_TIME_STANDARD_FORMAT.format(instant);
        return instantString;
    }
}
