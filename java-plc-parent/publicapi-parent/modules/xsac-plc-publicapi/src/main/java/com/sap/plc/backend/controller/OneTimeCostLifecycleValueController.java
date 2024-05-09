package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.OneTimeCostLifecycleValueDeleteGeneratedDto;
import com.sap.plc.backend.dto.OneTimeCostLifecycleValueGeneratedDto;
import com.sap.plc.backend.mapper.OneTimeCostLifecycleValueMappers;
import com.sap.plc.backend.service.OneTimeCostLifecycleValueService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createDeleteResult;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = OneTimeCostLifecycleValueController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
public class OneTimeCostLifecycleValueController implements OneTimeCostLifecycleValueGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.ONE_TIME_COST_LIFECYCLE_VALUES;
    private static final String FILTER_PK = "oneTimeCostId,calculationId,lifecyclePeriodFrom";

    @Resource
    private OneTimeCostLifecycleValueService oneTimeCostLifecycleValueService;

    @Resource
    private OneTimeCostLifecycleValueMappers.OneTimeCostLifecycleValueGeneratedDtoMapper
            oneTimeCostLifecycleValueGeneratedDtoMapper;

    @Override
    @DeleteMapping
    public ResponseEntity deleteAll(
            @NotEmpty @Size(min = 1, max = 100) List<OneTimeCostLifecycleValueDeleteGeneratedDto> body) {
        return createDeleteResult(
                oneTimeCostLifecycleValueService.delete(body),
                PATH,
                HttpStatus.OK);
    }

    @Override
    @GetMapping
    public ResponseEntity get(@Valid @Min(1) @Max(10000) @RequestParam(value = "top", defaultValue = "1000", required =
            false) Integer top,
                              @Valid @Min(0) @RequestParam(value = "skip", defaultValue = "0", required = false)
                                      Integer skip,
                              @Valid @RequestParam(value = "filter", required = false) String filter,
                              @Valid @RequestParam(value = "fields", required = false) String fields) {
        return new ResponseEntity<>(oneTimeCostLifecycleValueService.get(top, skip, filter, fields),
                HttpStatus.OK);
    }

    @Override
    @PostMapping
    public ResponseEntity post(@NotEmpty @Size(min = 1, max = 100) List<OneTimeCostLifecycleValueGeneratedDto> body,
                               @Valid @RequestParam(value = "returnType", required = false)
                               @Pattern(regexp = "^(ids|full)$") String returnType) {
        return createResult(oneTimeCostLifecycleValueService.create(body),
                oneTimeCostLifecycleValueGeneratedDtoMapper,
                PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.CREATED,
                FILTER_PK);
    }

    @Override
    @PutMapping
    public ResponseEntity update(@NotEmpty @Size(min = 1, max = 100) List<OneTimeCostLifecycleValueGeneratedDto> body,
                                 @Valid @RequestParam(value = "returnType", required = false)
                                 @Pattern(regexp = "^(ids|full)$") String returnType) {
        return createResult(oneTimeCostLifecycleValueService.update(body),
                oneTimeCostLifecycleValueGeneratedDtoMapper,
                PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }
}
