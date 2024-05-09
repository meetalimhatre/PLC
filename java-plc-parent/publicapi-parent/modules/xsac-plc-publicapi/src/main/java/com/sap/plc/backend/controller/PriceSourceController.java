package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.PriceSourceCreateGeneratedDto;
import com.sap.plc.backend.dto.PriceSourceKeyAndTimestampGeneratedDto;
import com.sap.plc.backend.dto.PriceSourceUpdateGeneratedDto;
import com.sap.plc.backend.dto.PriceSourceUpsertGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.mapper.PriceSourceMappers;
import com.sap.plc.backend.service.masterdata.PriceSourceServiceImpl;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.RETURN_TYPE;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createDeleteResult;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = PriceSourceController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class PriceSourceController implements PriceSourceGeneratedController {
    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.PRICE_SOURCES;
    private static final String FILTER_PK = "priceSourceId,priceSourceTypeId,lastModifiedOn";

    @Resource
    private PriceSourceServiceImpl priceSourceService;

    @Resource
    private PriceSourceMappers.PriceSourceGeneratedDtoMapper priceSourceGeneratedDtoMapper;

    @Override
    @GetMapping
    public ResponseEntity<PlcResponse> get(
            @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false, defaultValue = "100") Integer top,
            @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0") Integer skip,
            @Valid @RequestParam(value = "language", required = false) String language,
            @Valid @RequestParam(value = "filter", required = false) String filter,
            @Valid @RequestParam(value = "fields", required = false) String fields,
            @Valid @RequestParam(value = "expand", required = false) String expand) {
        return new ResponseEntity<>(
                priceSourceService.getAllPriceSources(top, skip, filter, fields, language, expand),
                HttpStatus.OK);
    }

    @Override
    @GetMapping(value = "/{priceSourceId}/{priceSourceTypeId}")
    public ResponseEntity<PlcResponse> getById(@Valid @NotNull @PathVariable("priceSourceId") String priceSourceId,
                                               @Valid @NotNull @PathVariable("priceSourceTypeId")
                                                       Integer priceSourceTypeId,
                                               @Valid @RequestParam(value = "language", required = false)
                                                       String language,
                                               @Valid @RequestParam(value = "fields", required = false) String fields,
                                               @Valid @RequestParam(value = "expand", required = false) String expand) {
        return new ResponseEntity<>(
                priceSourceService.getPriceSourceById(priceSourceId, priceSourceTypeId, fields, language, expand),
                HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity<?> patch(@NotEmpty @RequestBody List<PriceSourceUpdateGeneratedDto> body,
                                   @Valid @Pattern(regexp = "^(ids|full)$")
                                   @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        return createResult(priceSourceService.patch(body),
                priceSourceGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }

    @Override
    @PostMapping
    public ResponseEntity<?> post(@NotEmpty @RequestBody List<PriceSourceCreateGeneratedDto> body,
                                  @Valid @Pattern(regexp = "^(ids|full)$")
                                  @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        return createResult(priceSourceService.create(body),
                priceSourceGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.CREATED,
                FILTER_PK);
    }

    @Override
    @PutMapping
    public ResponseEntity<?> update(@NotEmpty @RequestBody List<PriceSourceUpsertGeneratedDto> body,
                                    @Valid @Pattern(regexp = "^(ids|full)$")
                                    @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        return createResult(priceSourceService.update(body),
                priceSourceGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }

    @Override
    @DeleteMapping
    public ResponseEntity<?> deleteAll(@NotEmpty @RequestBody List<PriceSourceKeyAndTimestampGeneratedDto> body) {

        return createDeleteResult(
                priceSourceService.delete(body),
                PATH,
                HttpStatus.OK);
    }
}
