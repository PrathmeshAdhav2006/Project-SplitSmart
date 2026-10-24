package com.splitsmart.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.splitsmart.dto.CreateExpenseRequest;
import com.splitsmart.dto.ExpenseResponse;
import com.splitsmart.dto.MonthlySummaryResponse;
import com.splitsmart.exception.AuthenticationException;
import com.splitsmart.model.User;
import com.splitsmart.repository.ExpenseRepository;
import com.splitsmart.repository.GroupRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final GroupService groupService;
    private final GroupRepository groupRepository;
    public ExpenseService(ExpenseRepository expenseRepository, GroupService groupService, GroupRepository groupRepository) {
        this.expenseRepository = expenseRepository; this.groupService = groupService; this.groupRepository = groupRepository;
    }

    @Transactional
    public ExpenseResponse create(Long groupId, CreateExpenseRequest request, User user) {
        groupService.requireMember(groupId, user);
        validateShares(groupId, request);
        return expenseRepository.insert(groupId, request);
    }
    public List<ExpenseResponse> list(Long groupId, String category, User user) {
        groupService.requireMember(groupId, user);
        return expenseRepository.findAll(groupId, category);
    }
    public ExpenseResponse get(Long groupId, Long expenseId, User user) {
        groupService.requireMember(groupId, user);
        return expenseRepository.findById(groupId, expenseId);
    }
    @Transactional
    public ExpenseResponse update(Long groupId, Long expenseId, CreateExpenseRequest request, User user) {
        groupService.requireMember(groupId, user);
        requireEditor(groupId, expenseId, user);
        validateShares(groupId, request);
        expenseRepository.update(groupId, expenseId, request);
        return expenseRepository.findById(groupId, expenseId);
    }
    @Transactional
    public void delete(Long groupId, Long expenseId, User user) {
        groupService.requireMember(groupId, user);
        requireEditor(groupId, expenseId, user);
        expenseRepository.delete(groupId, expenseId);
    }
    public List<MonthlySummaryResponse> monthlySummary(Long groupId, User user) {
        groupService.requireMember(groupId, user);
        return expenseRepository.monthlySummary(groupId);
    }
    private void validateShares(Long groupId, CreateExpenseRequest request) {
        if (request.getAmount().scale() > 2) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Amount must have at most two decimal places");
        }
        request.setAmount(request.getAmount().setScale(2, RoundingMode.UNNECESSARY));
        if (!groupRepository.isMember(groupId, request.getPayerId())) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Payer must be a group member");
        }
        if ("EQUAL".equalsIgnoreCase(request.getSplitMethod())) {
            allocateEqualShares(request);
        } else if (!"CUSTOM".equalsIgnoreCase(request.getSplitMethod())) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Split method must be EQUAL or CUSTOM");
        }
        Set<Long> ids = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (CreateExpenseRequest.ShareRequest share : request.getShares()) {
            if (share.getAmount().scale() > 2) {
                throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Share amounts must have at most two decimal places");
            }
            share.setAmount(share.getAmount().setScale(2, RoundingMode.UNNECESSARY));
            if (!ids.add(share.getUserId()) || !groupRepository.isMember(groupId, share.getUserId())) {
                throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Shares must contain unique group members");
            }
            total = total.add(share.getAmount());
        }
        if (total.compareTo(request.getAmount()) != 0) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Share amounts must equal the expense amount");
        }
    }

    private void allocateEqualShares(CreateExpenseRequest request) {
        if (request.getShares().isEmpty()) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "At least one participant is required");
        }
        List<CreateExpenseRequest.ShareRequest> sorted = new ArrayList<>(request.getShares());
        sorted.sort(Comparator.comparing(CreateExpenseRequest.ShareRequest::getUserId));
        long totalPaise = request.getAmount().movePointRight(2).longValueExact();
        long basePaise = totalPaise / sorted.size();
        long remainder = totalPaise % sorted.size();
        for (int index = 0; index < sorted.size(); index++) {
            long paise = basePaise + (index < remainder ? 1 : 0);
            sorted.get(index).setAmount(BigDecimal.valueOf(paise, 2));
        }
    }

    private void requireEditor(Long groupId, Long expenseId, User user) {
        ExpenseResponse expense = expenseRepository.findById(groupId, expenseId);
        if (!expense.getPayerId().equals(user.getId()) && !groupRepository.isOwner(groupId, user.getId())) {
            throw new AuthenticationException(HttpStatus.FORBIDDEN, "Only the payer or group owner can edit this expense");
        }
    }
}
