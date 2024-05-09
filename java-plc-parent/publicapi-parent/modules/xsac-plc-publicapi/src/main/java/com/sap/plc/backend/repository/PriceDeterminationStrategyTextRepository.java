package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.PriceDeterminationStrategyText;
import com.sap.plc.backend.model.pks.PriceDeterminationStrategyTextPrimaryKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PriceDeterminationStrategyTextRepository extends
        JpaRepository<PriceDeterminationStrategyText, PriceDeterminationStrategyTextPrimaryKey>,
        JpaSpecificationExecutor<PriceDeterminationStrategyText> {

    List<PriceDeterminationStrategyText> findAllByPriceDeterminationStrategyIdAndPriceDeterminationStrategyTypeIdAndLanguageIn(
            String priceDeterminationStrategyId, Integer priceDeterminationStrategyTypeId,
            Collection<String> languageSet);

    void deleteByPriceDeterminationStrategyIdAndPriceDeterminationStrategyTypeId(
            String priceDeterminationStrategyId, Integer priceDeterminationStrategyTypeId);
}
