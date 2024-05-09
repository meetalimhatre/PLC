package com.sap.plc.backend.controller.utils;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoUnit;

public class DateTimeUtils {

    /**
     * yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
     */
    public static final DateTimeFormatter PLC_DATE_TIME_STANDARD_FORMAT = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendInstant(3)
            .parseStrict()
            .toFormatter();

    public static Timestamp getCurrentTimestamp() {
        return Timestamp.from(Instant.now().truncatedTo(ChronoUnit.MILLIS));
    }
}
