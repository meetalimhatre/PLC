package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.StatusText;
import com.sap.plc.backend.model.pks.StatusTextPrimaryKey;
import com.sap.plc.backend.repository.cust.status.StatusTextCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface StatusTextRepository extends EntityRepository<StatusText, StatusTextPrimaryKey>,
        StatusTextCustomRepository, JpaRepository<StatusText, StatusTextPrimaryKey>, JpaSpecificationExecutor<StatusText> {

    List<StatusText> findAllByStatusId(String statusId);
    void deleteAllByStatusId(String statusId);
}

