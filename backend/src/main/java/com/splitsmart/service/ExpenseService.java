package com.splitsmart.service;

import java.math.BigDecimal;
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
        validateShares(groupId, request);
        expenseRepository.update(groupId, expenseId, request);
        return expenseRepository.findById(groupId, expenseId);
    }
    @Transactional
    public void delete(Long groupId, Long expenseId, User user) {
        groupService.requireMember(groupId, user);
        expenseRepository.delete(groupId, expenseId);
    }
    public List<MonthlySummaryResponse> monthlySummary(Long groupId, User user) {
        groupService.requireMember(groupId, user);
        return expenseRepository.monthlySummary(groupId);
    }
    private void validateShares(Long groupId, CreateExpenseRequest request) {
        if (!groupRepository.isMember(groupId, request.getPayerId())) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Payer must be a group member");
        }
        Set<Long> ids = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;
        for (CreateExpenseRequest.ShareRequest share : request.getShares()) {
            if (!ids.add(share.getUserId()) || !groupRepository.isMember(groupId, share.getUserId())) {
                throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Shares must contain unique group members");
            }
            total = total.add(share.getAmount());
        }
        if (total.compareTo(request.getAmount()) != 0) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Share amounts must equal the expense amount");
        }
    }
}
