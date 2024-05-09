package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.ActiveUsersPerMonthGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.service.ActiveUsersService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = ActiveUsersController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class ActiveUsersController implements ActiveUsersGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.ACTIVE_USERS;

    private final ActiveUsersService activeUsersService;

    public ActiveUsersController(ActiveUsersService activeUsersService) {
        this.activeUsersService = activeUsersService;
    }

    @Override
    @GetMapping
    public ResponseEntity<PlcResponse<ActiveUsersPerMonthGeneratedDto, ?>> get(
            @Valid @Pattern(regexp = "^20\\d{2}-(0[1-9]|1[0-2])$")
            @RequestParam(value = "startMonth", required = false)
                    String startMonth,
            @Valid @Pattern(regexp = "^20\\d{2}-(0[1-9]|1[0-2])$")
            @RequestParam(value = "endMonth", required = false)
                    String endMonth) {

        return new ResponseEntity<>(
                PlcResponse.buildResponseWithEntities(activeUsersService.getActiveUsers(startMonth, endMonth)),
                HttpStatus.OK);
    }
}
