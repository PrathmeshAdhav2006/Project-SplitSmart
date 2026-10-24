package com.splitsmart.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateExpenseRequest {
    @NotBlank @Size(max = 255) private String description;
    @NotBlank @Size(max = 40) private String category;
    @NotNull private LocalDate expenseDate;
    @NotNull @DecimalMin(value = "0.01") private BigDecimal amount;
    @NotNull private Long payerId;
    @NotBlank private String splitMethod;
    @NotEmpty @Valid private List<ShareRequest> shares;

    public String getDescription() { return description; }
    public void setDescription(String value) { description = value; }
    public String getCategory() { return category; }
    public void setCategory(String value) { category = value; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate value) { expenseDate = value; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal value) { amount = value; }
    public Long getPayerId() { return payerId; }
    public void setPayerId(Long value) { payerId = value; }
    public String getSplitMethod() { return splitMethod; }
    public void setSplitMethod(String value) { splitMethod = value; }
    public List<ShareRequest> getShares() { return shares; }
    public void setShares(List<ShareRequest> value) { shares = value; }

    public static class ShareRequest {
        @NotNull private Long userId;
        @NotNull @DecimalMin(value = "0.00") private BigDecimal amount;
        public Long getUserId() { return userId; }
        public void setUserId(Long value) { userId = value; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal value) { amount = value; }
    }
}
