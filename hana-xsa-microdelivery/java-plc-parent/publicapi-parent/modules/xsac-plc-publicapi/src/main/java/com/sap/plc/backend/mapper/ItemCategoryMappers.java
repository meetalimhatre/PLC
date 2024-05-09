package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.ItemCategoryGeneratedDto;
import com.sap.plc.backend.dto.ItemCategoryKeyTimestampDeleteGeneratedDto;
import com.sap.plc.backend.dto.ItemCategoryTextGeneratedDto;
import com.sap.plc.backend.dto.ItemCategoryCreateGeneratedDto;
import com.sap.plc.backend.dto.ItemCategoryKeyAndTimestampGeneratedDto;
import com.sap.plc.backend.dto.ItemCategoryUpdateGeneratedDto;
import com.sap.plc.backend.model.ItemCategory;
import com.sap.plc.backend.model.ItemCategoryText;
import com.sap.plc.backend.model.pks.ItemCategoryPKAndTimestamp;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class ItemCategoryMappers {
    
    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ItemCategoryGeneratedDtoMapper extends EntityMapper<ItemCategory,
            ItemCategoryGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ItemCategoryTextGeneratedDtoMapper extends EntityMapper<ItemCategoryText,
            ItemCategoryTextGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ItemCategoryCreateGeneratedDtoMapper extends EntityMapper<ItemCategory,
            ItemCategoryCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ItemCategoryUpdateGeneratedDtoMapper extends EntityMapper<ItemCategory,
            ItemCategoryUpdateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ItemCategoryKeyAndTimestampGeneratedDtoMapper extends EntityMapper<ItemCategoryPKAndTimestamp,
            ItemCategoryKeyAndTimestampGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ItemCategoryKeyAndTimestampToItemCategoryMapper extends EntityMapper<ItemCategory,
            ItemCategoryKeyAndTimestampGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ItemCategoryKeyAndTimestampDeleteToItemCategoryMapper extends EntityMapper<ItemCategory,
            ItemCategoryKeyTimestampDeleteGeneratedDto> {
    }
    
}
