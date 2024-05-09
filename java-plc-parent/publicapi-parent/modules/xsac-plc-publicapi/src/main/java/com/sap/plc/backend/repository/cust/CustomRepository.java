package com.sap.plc.backend.repository.cust;

import com.sap.plc.backend.model.PrimaryKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.sql.Timestamp;
import java.util.List;

public interface CustomRepository<TEntity> {

    Page<TEntity> findUsingFilter(String searchString, List<String> filter,
                                  Pageable page);

    Page<? extends PrimaryKey> findEntityPKsUsingFilterCFText(String searchFilter, Timestamp validAt, Pageable page);

    Page<TEntity> findByPKInNative(List<? extends PrimaryKey> pks, List<String> fields,
                                   Pageable page);
}
