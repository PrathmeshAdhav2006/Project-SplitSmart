package com.splitsmart.dto;

import java.math.BigDecimal;

public class BalanceResponse {
    private final Long userId; private final String fullName; private final BigDecimal netAmount;
    public BalanceResponse(Long userId, String fullName, BigDecimal netAmount) {
        this.userId = userId; this.fullName = fullName; this.netAmount = netAmount;
    }
    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public BigDecimal getNetAmount() { return netAmount; }
}
