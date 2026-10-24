package com.splitsmart.controller;

import java.util.List;

import com.splitsmart.dto.MonthlySummaryResponse;
import com.splitsmart.model.User;
import com.splitsmart.service.AuthService;
import com.splitsmart.service.ExpenseService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}/summary")
public class SummaryController {
    private final ExpenseService expenseService;
    private final AuthService authService;
    public SummaryController(ExpenseService expenseService, AuthService authService) {
        this.expenseService = expenseService; this.authService = authService;
    }
    @GetMapping("/monthly")
    public List<MonthlySummaryResponse> monthly(@PathVariable Long groupId, Authentication authentication) {
        User user = authService.findByEmail(authentication.getName());
        return expenseService.monthlySummary(groupId, user);
    }
}
