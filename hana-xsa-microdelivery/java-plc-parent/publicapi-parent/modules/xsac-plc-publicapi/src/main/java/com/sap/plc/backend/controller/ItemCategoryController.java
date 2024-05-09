package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.ItemCategoryCreateGeneratedDto;
import com.sap.plc.backend.dto.ItemCategoryKeyTimestampDeleteGeneratedDto;
import com.sap.plc.backend.dto.ItemCategoryUpdateGeneratedDto;
import com.sap.plc.backend.mapper.ItemCategoryMappers;
import com.sap.plc.backend.service.masterdata.ItemCategoryService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.OAUTH_HAS_SCOPE_MATCHING_PREFIX;
import static com.sap.plc.backend.constants.GeneralConstants.OAUTH_HAS_SCOPE_MATCHING_SUFFIX;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createDeleteResult;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = ItemCategoryController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class ItemCategoryController implements ItemCategoryGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.ITEM_CATEGORIES;
    private static final String FILTER_PK = "itemCategoryId,childItemCategoryId,lastModifiedOn";

    private static final String ITEM_CATEGORY_READ_SCOPE =
            OAUTH_HAS_SCOPE_MATCHING_PREFIX + "ItemCatR" + OAUTH_HAS_SCOPE_MATCHING_SUFFIX;
    private static final String ITEM_CATEGORY_EDIT_SCOPE =
            OAUTH_HAS_SCOPE_MATCHING_PREFIX + "ItemCatE" + OAUTH_HAS_SCOPE_MATCHING_SUFFIX;

    @Resource
    private ItemCategoryService itemCategoryService;

    @Resource
    private ItemCategoryMappers.ItemCategoryGeneratedDtoMapper itemCategoryGeneratedDtoMapper;

    @Override
    @GetMapping
    @PreAuthorize(ITEM_CATEGORY_READ_SCOPE)
    public ResponseEntity get(@Valid @Min(1) @Max(10000) @RequestParam(value = "top", defaultValue = "1000", required =
            false) Integer top,
                              @Valid @Min(0) @RequestParam(value = "skip", defaultValue = "0", required = false)
                                      Integer skip,
                              @Valid @RequestParam(value = "language", required = false) String language,
                              @Valid @RequestParam(value = "filter", required = false) String filter,
                              @Valid @RequestParam(value = "fields", required = false) String fields,
                              @Valid @RequestParam(value = "expand", required = false) String expand) {
        return new ResponseEntity<>(
                itemCategoryService.getAllItemCategories(top, skip, filter, fields, language, expand),
                HttpStatus.OK);
    }

    @Override
    @DeleteMapping
    @PreAuthorize(ITEM_CATEGORY_EDIT_SCOPE)
    public ResponseEntity deleteAll(@NotEmpty @RequestBody List<ItemCategoryKeyTimestampDeleteGeneratedDto> body) {
        return createDeleteResult(itemCategoryService.delete(body), PATH, HttpStatus.OK);
    }

    @Override
    @PatchMapping
    @PreAuthorize(ITEM_CATEGORY_EDIT_SCOPE)
    public ResponseEntity patch(@NotEmpty @RequestBody List<ItemCategoryUpdateGeneratedDto> body,
                                @Valid @Pattern(regexp = "^(ids|full)$") @RequestParam(value = "returnType", required
                                        = false) String returnType) {
        return createResult(itemCategoryService.patch(body),
                itemCategoryGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }

    @Override
    @PostMapping
    @PreAuthorize(ITEM_CATEGORY_EDIT_SCOPE)
    public ResponseEntity post(@NotEmpty @RequestBody List<ItemCategoryCreateGeneratedDto> body,
                               @Valid @Pattern(regexp = "^(ids|full)$") @RequestParam(value = "returnType", required
                                       = false) String returnType) {
        return createResult(itemCategoryService.create(body),
                itemCategoryGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.CREATED,
                FILTER_PK);
    }
}
