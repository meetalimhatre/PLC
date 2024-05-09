package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.PriceSourceText;
import com.sap.plc.backend.model.pks.PriceSourceTextKey;
import com.sap.plc.backend.repository.cust.pricesource.PriceSourceTextCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceSourceTextsRepository extends EntityRepository<PriceSourceText, PriceSourceTextKey>,
        PriceSourceTextCustomRepository, JpaRepository<PriceSourceText, PriceSourceTextKey>, JpaSpecificationExecutor<PriceSourceText> {

    List<PriceSourceText> findAllByPriceSourceIdAndPriceSourceTypeId(String priceSourceId, int priceSourceTypeId);
    void deleteAllByPriceSourceIdAndPriceSourceTypeId(String priceSourceId, int priceSourceTypeId);
}
