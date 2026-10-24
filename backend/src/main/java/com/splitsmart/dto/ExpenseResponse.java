package com.splitsmart.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseResponse {
    private final Long id;
    private final String description;
    private final String category;
    private final LocalDate expenseDate;
    private final BigDecimal amount;
    private final Long payerId;
    private final String splitMethod;

    public ExpenseResponse(Long id, String description, String category, LocalDate expenseDate,
                           BigDecimal amount, Long payerId, String splitMethod) {
        this.id = id; this.description = description; this.category = category;
        this.expenseDate = expenseDate; this.amount = amount; this.payerId = payerId; this.splitMethod = splitMethod;
    }
    public Long getId() { return id; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public BigDecimal getAmount() { return amount; }
    public Long getPayerId() { return payerId; }
    public String getSplitMethod() { return splitMethod; }
}
