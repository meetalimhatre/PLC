package com.sap.plc.backend.config.mt.hibernate;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ConnectionBuilder;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.ShardingKeyBuilder;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.logging.Logger;

import static java.util.Objects.requireNonNull;

public class PLCRoutingDataSource implements DataSource {

    private final Supplier<String> tenantIdSupplier;
    private final Function<String, DataSource> dataSourceFunction;

    public PLCRoutingDataSource(Supplier<String> tenantIdSupplier,
                                Function<String, DataSource> dataSourceFunction) {
        this.tenantIdSupplier = tenantIdSupplier;
        this.dataSourceFunction = dataSourceFunction;
    }

    @Override
    public Connection getConnection() throws SQLException {
        return getCurrentDataSource().getConnection();
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return getCurrentDataSource().getConnection(username, password);
    }

    @Override
    public PrintWriter getLogWriter() throws SQLException {
        return getCurrentDataSource().getLogWriter();
    }

    @Override
    public void setLogWriter(PrintWriter out) throws SQLException {
        getCurrentDataSource().setLogWriter(out);
    }

    @Override
    public void setLoginTimeout(int seconds) throws SQLException {
        getCurrentDataSource().setLoginTimeout(seconds);
    }

    @Override
    public int getLoginTimeout() throws SQLException {
        return getCurrentDataSource().getLoginTimeout();
    }

    @Override
    public ConnectionBuilder createConnectionBuilder() throws SQLException {
        return getCurrentDataSource().createConnectionBuilder();
    }

    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return getCurrentDataSource().getParentLogger();
    }

    @Override
    public ShardingKeyBuilder createShardingKeyBuilder() throws SQLException {
        return getCurrentDataSource().createShardingKeyBuilder();
    }

    @Override
    public <T> T unwrap(Class<T> iface) {
        return requireNonNull(iface, "argument cannot be null")
                .cast(getCurrentDataSource());
    }

    @Override
    public boolean isWrapperFor(Class<?> iface) {
        return (requireNonNull(iface, "argument cannot be null")
                .isAssignableFrom(getCurrentDataSource().getClass()));
    }

    private synchronized DataSource getCurrentDataSource() {
        return dataSourceFunction.apply(tenantIdSupplier.get());
    }
}
