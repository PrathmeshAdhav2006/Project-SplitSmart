package com.splitsmart.repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.splitsmart.dto.BalanceResponse;
import com.splitsmart.dto.SettlementSuggestionResponse;

public final class SettlementSuggestionCalculator {
    private SettlementSuggestionCalculator() { }

    public static List<SettlementSuggestionResponse> calculate(List<BalanceResponse> balances) {
        List<BalanceResponse> debtors = new ArrayList<>();
        List<BalanceResponse> creditors = new ArrayList<>();
        for (BalanceResponse balance : balances) {
            if (balance.getNetAmount().compareTo(BigDecimal.ZERO) < 0) debtors.add(balance);
            if (balance.getNetAmount().compareTo(BigDecimal.ZERO) > 0) creditors.add(balance);
        }
        List<SettlementSuggestionResponse> suggestions = new ArrayList<>();
        List<WorkBalance> debtorWork = toWorkBalances(debtors, false);
        List<WorkBalance> creditorWork = toWorkBalances(creditors, true);
        while (!debtorWork.isEmpty() && !creditorWork.isEmpty()) {
            debtorWork.sort(WorkBalance.ORDER);
            creditorWork.sort(WorkBalance.ORDER);
            WorkBalance debtor = debtorWork.get(0);
            WorkBalance creditor = creditorWork.get(0);
            BigDecimal debtorRemaining = debtor.remaining;
            BigDecimal creditorRemaining = creditor.remaining;
            BigDecimal transfer = debtorRemaining.min(creditorRemaining).setScale(2);
            suggestions.add(new SettlementSuggestionResponse(debtor.userId, debtor.name,
                    creditor.userId, creditor.name, transfer));
            debtor.remaining = debtorRemaining.subtract(transfer);
            creditor.remaining = creditorRemaining.subtract(transfer);
            if (debtor.remaining.signum() == 0) debtorWork.remove(debtor);
            if (creditor.remaining.signum() == 0) creditorWork.remove(creditor);
        }
        return suggestions;
    }

    private static List<WorkBalance> toWorkBalances(List<BalanceResponse> balances, boolean creditor) {
        List<WorkBalance> result = new ArrayList<>();
        for (BalanceResponse balance : balances) {
            result.add(new WorkBalance(balance.getUserId(), balance.getFullName(),
                    creditor ? balance.getNetAmount() : balance.getNetAmount().abs()));
        }
        return result;
    }

    private static class WorkBalance {
        private static final Comparator<WorkBalance> ORDER = Comparator
                .comparing((WorkBalance balance) -> balance.remaining).reversed()
                .thenComparing(balance -> balance.userId);
        private final Long userId;
        private final String name;
        private BigDecimal remaining;
        private WorkBalance(Long userId, String name, BigDecimal remaining) {
            this.userId = userId;
            this.name = name;
            this.remaining = remaining;
        }
    }
}
