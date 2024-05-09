package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.ItemCategory;
import com.sap.plc.backend.model.pks.ItemCategoryPrimaryKey;
import com.sap.plc.backend.repository.cust.itemcategory.ItemCategoryCountDto;
import com.sap.plc.backend.repository.cust.itemcategory.ItemCategoryCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ItemCategoryRepository extends EntityRepository<ItemCategory, ItemCategoryPrimaryKey>,
        ItemCategoryCustomRepository, JpaSpecificationExecutor<ItemCategory> {
    Set<ItemCategory> findAllByIconIn(Collection<String> icons);

    Set<ItemCategory> findAllByItemCategoryCodeIn(Collection<String> items);

    Integer countAllByChildItemCategoryIdGreaterThanEqual(Integer val);

    Optional<ItemCategory> findFirstByChildItemCategoryIdGreaterThanEqualOrderByChildItemCategoryIdDesc(Integer val);

    @Query(value =
            "select CHILD_ITEM_CATEGORY_ID as childItemCategoryId, sum(ITEM_CATEGORY_COUNT) as itemCategoryCount from ( " +
                    "select CHILD_ITEM_CATEGORY_ID, count(CHILD_ITEM_CATEGORY_ID) as ITEM_CATEGORY_COUNT from " +
                    "\"sap.plc.db::basis.t_item_temporary\" group by CHILD_ITEM_CATEGORY_ID  having " +
                    "CHILD_ITEM_CATEGORY_ID in :childItemCategories " +
                    "union all " +
                    "select CHILD_ITEM_CATEGORY_ID, count(CHILD_ITEM_CATEGORY_ID) as ITEM_CATEGORY_COUNT from " +
                    "\"sap.plc.db::basis.t_item\" group by CHILD_ITEM_CATEGORY_ID having " +
                    "CHILD_ITEM_CATEGORY_ID in :childItemCategories " +
                    "union all " +
                    "select CHILD_ITEM_CATEGORY_ID, count(CHILD_ITEM_CATEGORY_ID) as ITEM_CATEGORY_COUNT from " +
                    "\"sap.plc.db::basis.t_costing_sheet_base_row\" group by CHILD_ITEM_CATEGORY_ID having " +
                    "CHILD_ITEM_CATEGORY_ID in :childItemCategories " +
                    ") x group by CHILD_ITEM_CATEGORY_ID having sum(ITEM_CATEGORY_COUNT) > 0 ", nativeQuery = true)
    List<ItemCategoryCountDto> countCustomItemCategoriesFromCalculationsAndCostingSheet(
            @Param("childItemCategories") List<Integer> childItemCategories);

    List<ItemCategory> findByChildItemCategoryIdIn(List<Integer> childItemCategories);

    void deleteAllByChildItemCategoryIdIn(List<Integer> childItemCategories);
}
