package com.sap.plc.backend.controller.utils;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAccessor;

import static com.sap.plc.backend.controller.utils.DateTimeUtils.PLC_DATE_TIME_STANDARD_FORMAT;

public class JsonTimestampDeserializer extends StdDeserializer<Timestamp> {

    private static final long serialVersionUID = -5885810988458436828L;

    public JsonTimestampDeserializer() {
        this(Timestamp.class);
    }

    protected JsonTimestampDeserializer(Class<Timestamp> clazz) {
        super(clazz);
    }

    @Override
    public Timestamp deserialize(JsonParser jsonParser, DeserializationContext deserializationContext)
            throws IOException {

        String value = jsonParser.readValueAs(String.class);
        return deserialize(value);
    }

    public static Timestamp deserialize(String value) {
        TemporalAccessor temporalAccessor = parseToTemporalAccessor(value);
        Instant instant = Instant.from(temporalAccessor);
        Timestamp timestamp = Timestamp.from(instant);
        return timestamp;
    }

    private static TemporalAccessor parseToTemporalAccessor(String value) {
        try {
            return PLC_DATE_TIME_STANDARD_FORMAT.parse(value);
        } catch (DateTimeParseException e) {
            return parseMissingMillisecondsException(value, e);
        }
    }

    private static TemporalAccessor parseMissingMillisecondsException(String value, DateTimeParseException e) {
        if (!e.getMessage().contains("could not be parsed at index 20")
                || value.charAt(value.length()-1)!='Z') {
            throw e;
        }
        StringBuilder sb = new StringBuilder(value);
        String trailingZeroes = value.length() == 22 ? "00Z" : "0Z";
        sb.replace(sb.length()-1, sb.length(), trailingZeroes);
        String compatibleTimestamp = sb.toString();
        return PLC_DATE_TIME_STANDARD_FORMAT.parse(compatibleTimestamp);
    }
}
