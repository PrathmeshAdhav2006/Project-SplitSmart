package com.splitsmart.repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import com.splitsmart.dto.BalanceResponse;
import com.splitsmart.dto.SettlementRequest;
import com.splitsmart.dto.SettlementResponse;
import com.splitsmart.dto.SettlementSuggestionResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SettlementRepository {
    private final JdbcTemplate jdbcTemplate;
    public SettlementRepository(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    public SettlementResponse insert(Long groupId, SettlementRequest request) {
        jdbcTemplate.update("INSERT INTO settlement (group_id, payer_id, receiver_id, amount, settlement_date) VALUES (?, ?, ?, ?, ?)",
                groupId, request.getPayerId(), request.getReceiverId(), request.getAmount(), Date.valueOf(request.getSettlementDate()));
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return findById(groupId, id);
    }
    public List<SettlementResponse> findAll(Long groupId) {
        return jdbcTemplate.query("SELECT id, payer_id, receiver_id, amount, settlement_date, status FROM settlement WHERE group_id = ? ORDER BY settlement_date DESC, id DESC",
                this::mapSettlement, groupId);
    }
    public SettlementResponse findById(Long groupId, Long id) {
        return jdbcTemplate.queryForObject("SELECT id, payer_id, receiver_id, amount, settlement_date, status FROM settlement WHERE group_id = ? AND id = ?",
                this::mapSettlement, groupId, id);
    }
    public void voidSettlement(Long groupId, Long id) {
        jdbcTemplate.update("UPDATE settlement SET status = 'VOID' WHERE group_id = ? AND id = ? AND status = 'COMPLETED'", groupId, id);
    }

    public List<SettlementSuggestionResponse> suggestions(Long groupId) {
        String sql = "SELECT b.user_id, b.full_name, b.net_amount FROM (" +
                "SELECT u.id AS user_id, u.full_name, " +
                "(COALESCE((SELECT SUM(e.amount) FROM expense e WHERE e.group_id = ? AND e.payer_id = u.id), 0) " +
                "- COALESCE((SELECT SUM(s.share_amount) FROM expense_share s JOIN expense e2 ON e2.id = s.expense_id WHERE e2.group_id = ? AND s.user_id = u.id), 0) " +
                "- COALESCE((SELECT SUM(st.amount) FROM settlement st WHERE st.group_id = ? AND st.payer_id = u.id AND st.status = 'COMPLETED'), 0) " +
                "+ COALESCE((SELECT SUM(st2.amount) FROM settlement st2 WHERE st2.group_id = ? AND st2.receiver_id = u.id AND st2.status = 'COMPLETED'), 0)) AS net_amount " +
                "FROM app_user u JOIN group_member gm ON gm.user_id = u.id WHERE gm.group_id = ?) b";
        List<BalanceResponse> balances = jdbcTemplate.query(sql, (resultSet, rowNumber) ->
                new BalanceResponse(resultSet.getLong("user_id"), resultSet.getString("full_name"),
                        resultSet.getBigDecimal("net_amount")), groupId, groupId, groupId, groupId, groupId);
        return SettlementSuggestionCalculator.calculate(balances);
    }
    public List<BalanceResponse> balances(Long groupId) {
        String sql = "SELECT u.id, u.full_name, " +
                "(COALESCE((SELECT SUM(e.amount) FROM expense e WHERE e.group_id = ? AND e.payer_id = u.id), 0) " +
                "- COALESCE((SELECT SUM(s.share_amount) FROM expense_share s JOIN expense e2 ON e2.id = s.expense_id WHERE e2.group_id = ? AND s.user_id = u.id), 0) " +
                "- COALESCE((SELECT SUM(st.amount) FROM settlement st WHERE st.group_id = ? AND st.payer_id = u.id AND st.status = 'COMPLETED'), 0) " +
                "+ COALESCE((SELECT SUM(st2.amount) FROM settlement st2 WHERE st2.group_id = ? AND st2.receiver_id = u.id AND st2.status = 'COMPLETED'), 0)) AS net_amount " +
                "FROM app_user u JOIN group_member gm ON gm.user_id = u.id WHERE gm.group_id = ? ORDER BY u.full_name";
        return jdbcTemplate.query(sql, (resultSet, rowNumber) -> new BalanceResponse(resultSet.getLong("id"),
                resultSet.getString("full_name"), resultSet.getBigDecimal("net_amount")),
                groupId, groupId, groupId, groupId, groupId);
    }
    private SettlementResponse mapSettlement(ResultSet resultSet, int rowNumber) throws SQLException {
        return new SettlementResponse(resultSet.getLong("id"), resultSet.getLong("payer_id"),
                resultSet.getLong("receiver_id"), resultSet.getBigDecimal("amount"),
                resultSet.getDate("settlement_date").toLocalDate(), resultSet.getString("status"));
    }
}
