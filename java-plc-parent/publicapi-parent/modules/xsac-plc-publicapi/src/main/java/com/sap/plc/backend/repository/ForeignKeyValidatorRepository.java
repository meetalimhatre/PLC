package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.OneTimeCostLifecycleValue;
import com.sap.plc.backend.model.PriceSource;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Repository
public class ForeignKeyValidatorRepository<TEntity extends Entity<TEntity, TEntityId>, TEntityId extends PrimaryKey> {

    private static final String WILDCARD = "*";

    private static final String PRICE_SOURCE_FOREIGN_KEY_CHECK =
            "SELECT DISTINCT 'ACTIVITY PRICE' " +
                    "FROM \"sap.plc.db::basis.t_activity_price\" " +
                    "WHERE \"PRICE_SOURCE_ID\" = :priceSourceId AND 2 = :priceSourceTypeId " +
                    "UNION " +
                    "SELECT DISTINCT 'MATERIAL PRICE' " +
                    "FROM \"sap.plc.db::basis.t_material_price\" " +
                    "WHERE \"PRICE_SOURCE_ID\" = :priceSourceId AND 1 = :priceSourceTypeId " +
                    "UNION " +
                    "SELECT DISTINCT 'PRICE DETERMINATION STRATEGY' " +
                    "FROM \"sap.plc.db::basis.t_price_determination_strategy_price_source\" " +
                    "WHERE \"PRICE_SOURCE_ID\" = :priceSourceId AND \"PRICE_SOURCE_TYPE_ID\" = :priceSourceTypeId";

    private static final String ONETIMECOSTLIFECYCLEVALUE_FOREIGN_KEY_CHECK =
            "SELECT ONE_TIME_COST_ID, CALCULATION_ID FROM \"sap.plc.db::basis.t_one_time_product_cost\" WHERE " +
                    "\"ONE_TIME_COST_ID\"= :oneTimeCostId AND \"CALCULATION_ID\"= :calculationId";
    @PersistenceContext
    private EntityManager em;

    /**
     * @param entity
     * @return a list with the invalid foreign keys (non-existent)
     */
    public List<String> getInvalidForeignKeys(TEntity entity) {
        if (entity == null) {
            return Collections.emptyList();
        }

        List<String> fkSelectList = new ArrayList<>();
        Map<String, String> inputForeignKeys = new HashMap<>();
        Map<String, Fk> entityFKs = entity.geFKsMap(entity.getClass());

        for (String fk : entityFKs.keySet()) {
            String fkValue = entity.getValue(fk);
            if (StringUtils.isNotBlank(fkValue) &&
                    (!entityFKs.get(fk).isWildcard() ||
                            (entityFKs.get(fk).isWildcard() && !WILDCARD.equals(fkValue)))) {
                Class fkEntity = entityFKs.get(fk).value();
                Map<String, String> idsMap = Entity.getIdsMap(fkEntity);

                String field = fk;
                if (StringUtils.isNotBlank(entityFKs.get(fk).name())) {
                    field = entityFKs.get(fk).name();
                }

                inputForeignKeys.put(field, fkValue);

                String q = "SELECT '" + field + "' FROM " +
                        Entity.getTableNameForClass(fkEntity).replaceAll("`", "\"") +
                        " WHERE %n \"" + idsMap.get(field) + "\"= :" + field;

                if (idsMap.containsKey("validFrom")) {
                    q += " AND \"_VALID_TO\" IS NULL";
                }
                q += "%n";

                fkSelectList.add(String.format(q));
            }
        }

        String q;

        if (fkSelectList.isEmpty()) {
            return Collections.emptyList();
        } else if (fkSelectList.size() == 1) {
            q = fkSelectList.get(0);
        } else {
            q = String.join(String.format(" UNION %n"), fkSelectList);
        }

        Query query = em.createNativeQuery(q);

        inputForeignKeys.forEach(query::setParameter);

        List<String> inputData = new ArrayList(inputForeignKeys.keySet());

        Set<String> result = new HashSet<>(query.getResultList());

        inputData.removeAll(result);

        return inputData;
    }

    public List<String> getEntityNameListWithFKViolation(PriceSource priceSource) {

        Query query = em.createNativeQuery(PRICE_SOURCE_FOREIGN_KEY_CHECK);
        query.setParameter("priceSourceId", priceSource.getPriceSourceId());
        query.setParameter("priceSourceTypeId", priceSource.getPriceSourceTypeId());
        return query.getResultList();
    }

    public List<String> getInvalidForeignKeys(OneTimeCostLifecycleValue oneTimeCostLifecycleValue) {

        Query query = em.createNativeQuery(ONETIMECOSTLIFECYCLEVALUE_FOREIGN_KEY_CHECK);
        query.setParameter("oneTimeCostId", oneTimeCostLifecycleValue.getOneTimeCostId());
        query.setParameter("calculationId", oneTimeCostLifecycleValue.getCalculationId());
        return query.getResultList();
    }
}
