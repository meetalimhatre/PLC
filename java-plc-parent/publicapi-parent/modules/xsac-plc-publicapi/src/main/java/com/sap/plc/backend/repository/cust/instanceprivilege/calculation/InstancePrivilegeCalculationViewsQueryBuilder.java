package com.sap.plc.backend.repository.cust.instanceprivilege.calculation;

import com.sap.plc.backend.model.instanceprivilege.calculation.CalculationInstancePrivilegeView;
import com.sap.plc.backend.service.security.SecurityService;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import jakarta.annotation.Resource;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class InstancePrivilegeCalculationViewsQueryBuilder {

    @PersistenceContext
    EntityManager em;

    @Resource
    private SecurityService securityService;

    private static final String PROJECT_ID_AND_CALCULATION_ID_SELECT =
            "SELECT view FROM %s view WHERE (view.projectId, view.calculationId) IN (";

    public <T extends CalculationInstancePrivilegeView<T>> Query findByProjectIdAndCalculationIdInQuery(
            Set<Pair<String, Integer>> projectIdAndCalculationIdSet, Class<T> viewClazz) {
        if (CollectionUtils.isEmpty(projectIdAndCalculationIdSet) || viewClazz == null) {
            return null;
        }

        StringBuilder query =
                new StringBuilder(String.format(PROJECT_ID_AND_CALCULATION_ID_SELECT,
                        viewClazz.getSimpleName()));

        AtomicInteger ordinalIndex = new AtomicInteger();

        projectIdAndCalculationIdSet.forEach(projIdcalcIdPair -> query.append("(?")
                                                                      .append(ordinalIndex
                                                                              .incrementAndGet())
                                                                      .append(",?")
                                                                      .append(ordinalIndex
                                                                              .incrementAndGet())
                                                                      .append("),"));

        query.replace(query.length() - 1, query.length(), ")");
        query.append(" AND view.userId = ?").append(ordinalIndex.incrementAndGet());

        Query emQuery = em.createQuery(query.toString());

        AtomicInteger parameterIndex = new AtomicInteger();

        projectIdAndCalculationIdSet.forEach(projIdcalcIdPair -> {
            emQuery.setParameter(parameterIndex.incrementAndGet(), projIdcalcIdPair.getFirst());
            emQuery.setParameter(parameterIndex.incrementAndGet(), projIdcalcIdPair.getSecond());
        });
        emQuery.setParameter(parameterIndex.incrementAndGet(), securityService.getAuthenticatedUser());
        return emQuery;
    }
}


