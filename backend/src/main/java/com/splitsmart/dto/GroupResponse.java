package com.splitsmart.dto;

import java.time.Instant;

public class GroupResponse {
    private final Long id;
    private final String name;
    private final String description;
    private final String currencyCode;
    private final Long ownerId;
    private final Instant createdAt;

    public GroupResponse(Long id, String name, String description, String currencyCode, Long ownerId, Instant createdAt) {
        this.id = id; this.name = name; this.description = description; this.currencyCode = currencyCode;
        this.ownerId = ownerId; this.createdAt = createdAt;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getCurrencyCode() { return currencyCode; }
    public Long getOwnerId() { return ownerId; }
    public Instant getCreatedAt() { return createdAt; }
}
