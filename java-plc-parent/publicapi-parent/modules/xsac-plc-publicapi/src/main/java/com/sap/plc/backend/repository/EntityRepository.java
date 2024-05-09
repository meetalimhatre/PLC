package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.PrimaryKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.NoRepositoryBean;

import java.sql.Timestamp;
import java.util.Date;
import java.util.List;

@NoRepositoryBean
public interface EntityRepository<TEntity extends Entity<TEntity, TEntityId>, TEntityId extends PrimaryKey>
        extends PLCRepository<TEntity, TEntityId> {

    Page<TEntity> findUsingFilter(String filter, List<String> fields, Pageable page);

    Page<TEntityId> findEntityPKsUsingFilterCFText(String searchFilter, Timestamp validAt, Pageable page);
}
