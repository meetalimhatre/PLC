package com.sap.plc.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface PLCRepository<TEntity, TEntityId> extends JpaRepository<TEntity, TEntityId>{

}
