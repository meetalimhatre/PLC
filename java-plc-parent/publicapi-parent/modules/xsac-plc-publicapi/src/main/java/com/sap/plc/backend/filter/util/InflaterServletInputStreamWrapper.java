package com.sap.plc.backend.filter.util;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import java.io.IOException;
import java.util.zip.InflaterInputStream;

public class InflaterServletInputStreamWrapper extends ServletInputStream {

    private ServletInputStream servletInputStream;
    private InflaterInputStream inflaterInputStream;

    public InflaterServletInputStreamWrapper(ServletInputStream servletInputStream,
                                             InflaterInputStream inflaterInputStream) {
        this.servletInputStream = servletInputStream;
        this.inflaterInputStream = inflaterInputStream;
    }

    @Override
    public boolean isFinished() {
        return servletInputStream.isFinished();
    }

    @Override
    public boolean isReady() {
        return servletInputStream.isReady();
    }

    @Override
    public void setReadListener(ReadListener listener) {
        servletInputStream.setReadListener(listener);
    }

    @Override
    public int read() throws IOException {
        return inflaterInputStream.read();
    }
}
