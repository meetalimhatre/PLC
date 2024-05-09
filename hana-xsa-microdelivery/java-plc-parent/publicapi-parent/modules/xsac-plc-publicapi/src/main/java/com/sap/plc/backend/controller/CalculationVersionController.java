package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.CalculationVersionGeneratedDto;
import com.sap.plc.backend.mapper.CalculationVersionMappers;
import com.sap.plc.backend.service.CalculationVersionService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.RETURN_TYPE;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = CalculationVersionController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class CalculationVersionController implements CalculationVersionGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.CALCULATION_VERSIONS;
    private static final String FILTER_PK = "calculationVersionId";

    @Resource
    private CalculationVersionService calculationVersionService;

    @Resource
    private CalculationVersionMappers.CalculationVersionGeneratedDtoMapper calculationVersionGeneratedDtoMapper;

    @Override
    @PutMapping
    public ResponseEntity<?> put(
            @NotEmpty @Size(min = 1, max = 10000) @RequestBody List<CalculationVersionGeneratedDto> body,
            @Valid @Pattern(regexp = "^(ids|full)$")
            @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        return createResult(calculationVersionService.update(body),
                calculationVersionGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK, FILTER_PK);
    }
}
