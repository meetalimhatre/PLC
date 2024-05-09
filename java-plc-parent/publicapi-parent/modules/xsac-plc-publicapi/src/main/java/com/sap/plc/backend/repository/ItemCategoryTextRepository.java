package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.ItemCategoryText;
import com.sap.plc.backend.model.pks.ItemCategoryTextPrimaryKey;
import com.sap.plc.backend.repository.cust.itemcategory.ItemCategoryTextCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ItemCategoryTextRepository extends EntityRepository<ItemCategoryText, ItemCategoryTextPrimaryKey>,
        ItemCategoryTextCustomRepository, JpaSpecificationExecutor<ItemCategoryText> {

    List<ItemCategoryText> findAllByChildItemCategoryId(Integer childItemCategory);

    void deleteAllByChildItemCategoryIdIn(List<Integer> childItemCategories);

}
