package com.splitsmart.service;

import java.util.List;

import com.splitsmart.dto.BalanceResponse;
import com.splitsmart.dto.SettlementRequest;
import com.splitsmart.dto.SettlementResponse;
import com.splitsmart.dto.SettlementSuggestionResponse;
import com.splitsmart.exception.AuthenticationException;
import com.splitsmart.model.User;
import com.splitsmart.repository.GroupRepository;
import com.splitsmart.repository.SettlementRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettlementService {
    private final SettlementRepository settlementRepository;
    private final GroupRepository groupRepository;
    private final GroupService groupService;
    public SettlementService(SettlementRepository settlementRepository, GroupRepository groupRepository, GroupService groupService) {
        this.settlementRepository = settlementRepository; this.groupRepository = groupRepository; this.groupService = groupService;
    }
    public List<SettlementResponse> list(Long groupId, User user) {
        groupService.requireMember(groupId, user); return settlementRepository.findAll(groupId);
    }
    public List<BalanceResponse> balances(Long groupId, User user) {
        groupService.requireMember(groupId, user); return settlementRepository.balances(groupId);
    }
    public List<SettlementSuggestionResponse> suggestions(Long groupId, User user) {
        groupService.requireMember(groupId, user);
        return settlementRepository.suggestions(groupId);
    }
    @Transactional
    public SettlementResponse create(Long groupId, SettlementRequest request, User user) {
        groupService.requireMember(groupId, user);
        if (!groupRepository.isMember(groupId, request.getPayerId()) || !groupRepository.isMember(groupId, request.getReceiverId())
                || request.getPayerId().equals(request.getReceiverId())) {
            throw new AuthenticationException(HttpStatus.BAD_REQUEST, "Settlement users must be different group members");
        }
        return settlementRepository.insert(groupId, request);
    }
    @Transactional
    public void voidSettlement(Long groupId, Long id, User user) {
        groupService.requireMember(groupId, user);
        if (!groupRepository.isOwner(groupId, user.getId())) {
            throw new AuthenticationException(HttpStatus.FORBIDDEN, "Only the group owner can void a settlement");
        }
        settlementRepository.voidSettlement(groupId, id);
    }
}
