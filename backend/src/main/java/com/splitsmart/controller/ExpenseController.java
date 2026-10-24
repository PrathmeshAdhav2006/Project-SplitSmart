package com.splitsmart.controller;

import java.util.List;

import com.splitsmart.dto.CreateExpenseRequest;
import com.splitsmart.dto.ExpenseResponse;
import com.splitsmart.model.User;
import com.splitsmart.service.AuthService;
import com.splitsmart.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
public class ExpenseController {
    private final ExpenseService expenseService;
    private final AuthService authService;
    public ExpenseController(ExpenseService expenseService, AuthService authService) {
        this.expenseService = expenseService; this.authService = authService;
    }
    @GetMapping
    public List<ExpenseResponse> list(@PathVariable Long groupId, @RequestParam(required = false) String category,
                                      Authentication authentication) {
        return expenseService.list(groupId, category, currentUser(authentication));
    }
    @GetMapping("/{expenseId}")
    public ExpenseResponse get(@PathVariable Long groupId, @PathVariable Long expenseId, Authentication authentication) {
        return expenseService.get(groupId, expenseId, currentUser(authentication));
    }
    @PostMapping
    public org.springframework.http.ResponseEntity<ExpenseResponse> create(@PathVariable Long groupId,
            @Valid @RequestBody CreateExpenseRequest request, Authentication authentication) {
        return org.springframework.http.ResponseEntity.status(HttpStatus.CREATED)
                .body(expenseService.create(groupId, request, currentUser(authentication)));
    }
    @PutMapping("/{expenseId}")
    public ExpenseResponse update(@PathVariable Long groupId, @PathVariable Long expenseId,
            @Valid @RequestBody CreateExpenseRequest request, Authentication authentication) {
        return expenseService.update(groupId, expenseId, request, currentUser(authentication));
    }
    @DeleteMapping("/{expenseId}")
    public org.springframework.http.ResponseEntity<Void> delete(@PathVariable Long groupId, @PathVariable Long expenseId,
                                                                Authentication authentication) {
        expenseService.delete(groupId, expenseId, currentUser(authentication));
        return org.springframework.http.ResponseEntity.noContent().build();
    }
    private User currentUser(Authentication authentication) { return authService.findByEmail(authentication.getName()); }
}
