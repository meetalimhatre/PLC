package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.LifecycleQuantity;
import com.sap.plc.backend.model.pks.LifecycleQuantityPrimaryKey;
import com.sap.plc.backend.repository.cust.lifecyclequantity.LifecycleQuantityCustomRepository;

import java.util.List;
import java.util.Set;

public interface LifecycleQuantityRepository extends EntityRepository<LifecycleQuantity, LifecycleQuantityPrimaryKey>,
        LifecycleQuantityCustomRepository {

    List<LifecycleQuantity> findAllByProjectIdIn(Set<String> projectId);

    List<LifecycleQuantity> findAllByCalculationIdIn(List<Integer> calculationId);
}
