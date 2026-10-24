package com.splitsmart.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class SettlementRequest {
    @NotNull private Long payerId;
    @NotNull private Long receiverId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull private LocalDate settlementDate;
    public Long getPayerId() { return payerId; }
    public void setPayerId(Long value) { payerId = value; }
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long value) { receiverId = value; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal value) { amount = value; }
    public LocalDate getSettlementDate() { return settlementDate; }
    public void setSettlementDate(LocalDate value) { settlementDate = value; }
}
