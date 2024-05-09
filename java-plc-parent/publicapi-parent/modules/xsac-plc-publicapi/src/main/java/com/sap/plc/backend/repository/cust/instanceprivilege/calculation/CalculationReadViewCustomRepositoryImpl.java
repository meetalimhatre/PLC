package com.sap.plc.backend.repository.cust.instanceprivilege.calculation;

import com.sap.plc.backend.filter.specification.builder.GenericSpecificationsBuilder;
import com.sap.plc.backend.model.instanceprivilege.calculation.CalculationReadView;
import com.sap.plc.backend.repository.cust.GenericRepository;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Repository;

import jakarta.annotation.Resource;
import jakarta.persistence.Query;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Repository
public class CalculationReadViewCustomRepositoryImpl extends GenericRepository<CalculationReadView>
        implements CalculationReadViewCustomRepository {

    @Resource
    InstancePrivilegeCalculationViewsQueryBuilder instancePrivilegeCalculationViewsQueryBuilder;

    @Override
    public Class<CalculationReadView> getEntityClass() {
        return CalculationReadView.class;
    }

    @Override
    public GenericSpecificationsBuilder<CalculationReadView> getSpecBuilder() {
        return new GenericSpecificationsBuilder<>();
    }

    @Override
    public List<CalculationReadView> findByProjectIdAndCalculationIdIn(
            Set<Pair<String, Integer>> projectIdAndCalculationIdSet) {
        Query emQuery = instancePrivilegeCalculationViewsQueryBuilder
                .findByProjectIdAndCalculationIdInQuery(projectIdAndCalculationIdSet, getEntityClass());

        if (emQuery != null) {
            return emQuery.getResultList();
        } else {
            return Collections.EMPTY_LIST;
        }
    }
}
