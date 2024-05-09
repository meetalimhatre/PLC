package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.PriceDeterminationStrategyCreateGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyDeleteGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyKeyGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyUpdateGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.mapper.PriceDeterminationStrategyMappers;
import com.sap.plc.backend.service.masterdata.PriceDeterminationStrategyService;
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

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.RETURN_TYPE;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createDeleteResult;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = PriceDeterminationStrategyController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class PriceDeterminationStrategyController implements PriceDeterminationStrategyGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.PRICE_DETERMINATION_STRATEGIES;
    public static final String FILTER_PK =
            "priceDeterminationStrategyId,priceDeterminationStrategyTypeId,lastModifiedOn";

    private final PriceDeterminationStrategyService priceDeterminationStrategyService;
    private final PriceDeterminationStrategyMappers.PriceDeterminationStrategyGeneratedDtoMapper
            priceDeterminationStrategyGeneratedDtoMapper;

    public PriceDeterminationStrategyController(
            PriceDeterminationStrategyService priceDeterminationStrategyService,
            PriceDeterminationStrategyMappers.PriceDeterminationStrategyGeneratedDtoMapper priceDeterminationStrategyGeneratedDtoMapper) {
        this.priceDeterminationStrategyService = priceDeterminationStrategyService;
        this.priceDeterminationStrategyGeneratedDtoMapper = priceDeterminationStrategyGeneratedDtoMapper;
    }

    @Override
    @GetMapping
    public ResponseEntity<PlcResponse> get(
            @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false, defaultValue = "100") Integer top,
            @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0") Integer skip,
            @Valid @RequestParam(value = "language", required = false) String language,
            @Valid @RequestParam(value = "filter", required = false) String filter,
            @Valid @RequestParam(value = "fields", required = false) String fields,
            @Valid @RequestParam(value = "expand", required = false) String expand) {

        PlcResponse<PriceDeterminationStrategyGeneratedDto, PriceDeterminationStrategyKeyGeneratedDto> response =
                new PlcResponse();
        response.setEntities(priceDeterminationStrategyService.findAll(top, skip, filter, fields, language, expand));
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Override
    @GetMapping("/{priceDeterminationStrategyId}/{priceDeterminationStrategyTypeId}")
    public ResponseEntity getById(
            @Valid @NotNull @PathVariable("priceDeterminationStrategyId") String priceDeterminationStrategyId,
            @Valid @NotNull @Min(1) @Max(2) @PathVariable("priceDeterminationStrategyTypeId")
                    Integer priceDeterminationStrategyTypeId,
            @Valid @RequestParam(value = "language", required = false) String language,
            @Valid @RequestParam(value = "fields", required = false) String fields,
            @Valid @RequestParam(value = "expand", required = false) String expand) {

        PlcResponse<PriceDeterminationStrategyGeneratedDto, PriceDeterminationStrategyKeyGeneratedDto> response =
                new PlcResponse();
        response.setEntities(Collections.singletonList(priceDeterminationStrategyService
                .findById(priceDeterminationStrategyId, priceDeterminationStrategyTypeId, fields, language, expand)));
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Override
    @PostMapping
    public ResponseEntity post(
            @NotEmpty @Size(min = 1, max = 100) @RequestBody List<PriceDeterminationStrategyCreateGeneratedDto> body,
            @Valid @Pattern(regexp = "^(ids|full)$") @RequestParam(value = RETURN_TYPE, required = false)
                    String returnType) {

        return createResult(priceDeterminationStrategyService.create(body),
                priceDeterminationStrategyGeneratedDtoMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.CREATED,
                FILTER_PK);
    }

    @Override
    @PutMapping
    public ResponseEntity update(
            @NotEmpty @Size(min = 1, max = 100) @RequestBody List<PriceDeterminationStrategyUpdateGeneratedDto> body,
            @Valid @Pattern(regexp = "^(ids|full)$") @RequestParam(value = RETURN_TYPE, required = false)
                    String returnType) {

        return createResult(priceDeterminationStrategyService.upsert(body),
                priceDeterminationStrategyGeneratedDtoMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }

    @Override
    @PatchMapping
    public ResponseEntity patch(
            @NotEmpty @Size(min = 1, max = 100) @RequestBody List<PriceDeterminationStrategyUpdateGeneratedDto> body,
            @Valid @Pattern(regexp = "^(ids|full)$") @RequestParam(value = RETURN_TYPE, required = false)
                    String returnType) {

        return createResult(priceDeterminationStrategyService.patch(body),
                priceDeterminationStrategyGeneratedDtoMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }

    @Override
    @DeleteMapping
    public ResponseEntity deleteAll(
            @NotEmpty @Size(min = 1, max = 100) @RequestBody List<PriceDeterminationStrategyDeleteGeneratedDto> body) {

        return createDeleteResult(priceDeterminationStrategyService.delete(body), PATH, HttpStatus.OK);
    }
}
