package com.splitsmart.dto;

import java.math.BigDecimal;

public class SettlementSuggestionResponse {
    private final Long payerId;
    private final String payerName;
    private final Long receiverId;
    private final String receiverName;
    private final BigDecimal amount;

    public SettlementSuggestionResponse(Long payerId, String payerName, Long receiverId,
                                        String receiverName, BigDecimal amount) {
        this.payerId = payerId;
        this.payerName = payerName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.amount = amount;
    }

    public Long getPayerId() { return payerId; }
    public String getPayerName() { return payerName; }
    public Long getReceiverId() { return receiverId; }
    public String getReceiverName() { return receiverName; }
    public BigDecimal getAmount() { return amount; }
}
