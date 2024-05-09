package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.Status;
import com.sap.plc.backend.model.pks.StatusPrimaryKey;
import com.sap.plc.backend.repository.cust.status.StatusCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface StatusRepository extends EntityRepository<Status, StatusPrimaryKey>, StatusCustomRepository,
        JpaSpecificationExecutor<Status> {

    Status findByIsDefault(Integer isDefault);

    List<Status> findByStatusIdIn(List<String> statusId);

    List<Status> findByStatusIdInAndIsActive(List<String> statusId, Integer isActive);

    void deleteByStatusIdIn(List<String> statusId);

    List<Status> findAllByDisplayOrderIn(Set<Integer> displayOrders);

}
