package com.splitsmart.dto;

import java.math.BigDecimal;

public class MonthlySummaryResponse {
    private final String month;
    private final BigDecimal totalAmount;
    private final int expenseCount;
    public MonthlySummaryResponse(String month, BigDecimal totalAmount, int expenseCount) {
        this.month = month; this.totalAmount = totalAmount; this.expenseCount = expenseCount;
    }
    public String getMonth() { return month; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public int getExpenseCount() { return expenseCount; }
}
