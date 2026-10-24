package com.splitsmart.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SettlementResponse {
    private final Long id; private final Long payerId; private final Long receiverId;
    private final BigDecimal amount; private final LocalDate settlementDate; private final String status;
    public SettlementResponse(Long id, Long payerId, Long receiverId, BigDecimal amount, LocalDate settlementDate, String status) {
        this.id = id; this.payerId = payerId; this.receiverId = receiverId; this.amount = amount;
        this.settlementDate = settlementDate; this.status = status;
    }
    public Long getId() { return id; }
    public Long getPayerId() { return payerId; }
    public Long getReceiverId() { return receiverId; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getSettlementDate() { return settlementDate; }
    public String getStatus() { return status; }
}
