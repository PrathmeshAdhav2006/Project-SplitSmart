package com.splitsmart.controller;

import java.util.List;

import com.splitsmart.dto.BalanceResponse;
import com.splitsmart.dto.SettlementRequest;
import com.splitsmart.dto.SettlementResponse;
import com.splitsmart.model.User;
import com.splitsmart.service.AuthService;
import com.splitsmart.service.SettlementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}")
public class SettlementController {
    private final SettlementService settlementService; private final AuthService authService;
    public SettlementController(SettlementService settlementService, AuthService authService) {
        this.settlementService = settlementService; this.authService = authService;
    }
    @GetMapping("/balances")
    public List<BalanceResponse> balances(@PathVariable Long groupId, Authentication authentication) {
        return settlementService.balances(groupId, currentUser(authentication));
    }
    @GetMapping("/settlements")
    public List<SettlementResponse> list(@PathVariable Long groupId, Authentication authentication) {
        return settlementService.list(groupId, currentUser(authentication));
    }
    @PostMapping("/settlements")
    public org.springframework.http.ResponseEntity<SettlementResponse> create(@PathVariable Long groupId,
            @Valid @RequestBody SettlementRequest request, Authentication authentication) {
        return org.springframework.http.ResponseEntity.status(HttpStatus.CREATED)
                .body(settlementService.create(groupId, request, currentUser(authentication)));
    }
    @DeleteMapping("/settlements/{settlementId}")
    public org.springframework.http.ResponseEntity<Void> voidSettlement(@PathVariable Long groupId,
            @PathVariable Long settlementId, Authentication authentication) {
        settlementService.voidSettlement(groupId, settlementId, currentUser(authentication));
        return org.springframework.http.ResponseEntity.noContent().build();
    }
    private User currentUser(Authentication authentication) { return authService.findByEmail(authentication.getName()); }
}
