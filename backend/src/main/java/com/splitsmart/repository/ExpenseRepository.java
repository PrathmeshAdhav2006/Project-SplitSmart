package com.splitsmart.repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import com.splitsmart.dto.CreateExpenseRequest;
import com.splitsmart.dto.ExpenseResponse;
import com.splitsmart.dto.MonthlySummaryResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ExpenseRepository {
    private final JdbcTemplate jdbcTemplate;
    public ExpenseRepository(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    public ExpenseResponse insert(Long groupId, CreateExpenseRequest request) {
        jdbcTemplate.update("INSERT INTO expense (group_id, description, category, expense_date, amount, payer_id, split_method) VALUES (?, ?, ?, ?, ?, ?, ?)",
                groupId, request.getDescription(), request.getCategory(), Date.valueOf(request.getExpenseDate()),
                request.getAmount(), request.getPayerId(), request.getSplitMethod());
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        insertShares(id, request);
        return findById(groupId, id);
    }

    public List<ExpenseResponse> findAll(Long groupId, String category) {
        if (category == null || category.trim().isEmpty()) {
            return jdbcTemplate.query("SELECT id, description, category, expense_date, amount, payer_id, split_method FROM expense WHERE group_id = ? ORDER BY expense_date DESC, id DESC",
                    this::mapExpense, groupId);
        }
        return jdbcTemplate.query("SELECT id, description, category, expense_date, amount, payer_id, split_method FROM expense WHERE group_id = ? AND category = ? ORDER BY expense_date DESC, id DESC",
                this::mapExpense, groupId, category);
    }

    public ExpenseResponse findById(Long groupId, Long expenseId) {
        return jdbcTemplate.queryForObject("SELECT id, description, category, expense_date, amount, payer_id, split_method FROM expense WHERE group_id = ? AND id = ?",
                this::mapExpense, groupId, expenseId);
    }

    public void update(Long groupId, Long expenseId, CreateExpenseRequest request) {
        jdbcTemplate.update("UPDATE expense SET description = ?, category = ?, expense_date = ?, amount = ?, payer_id = ?, split_method = ? WHERE group_id = ? AND id = ?",
                request.getDescription(), request.getCategory(), Date.valueOf(request.getExpenseDate()), request.getAmount(),
                request.getPayerId(), request.getSplitMethod(), groupId, expenseId);
        jdbcTemplate.update("DELETE FROM expense_share WHERE expense_id = ?", expenseId);
        insertShares(expenseId, request);
    }

    public void delete(Long groupId, Long expenseId) {
        jdbcTemplate.update("DELETE FROM expense WHERE group_id = ? AND id = ?", groupId, expenseId);
    }

    public List<MonthlySummaryResponse> monthlySummary(Long groupId) {
        return jdbcTemplate.query("SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month, SUM(amount) AS total_amount, COUNT(*) AS expense_count " +
                        "FROM expense WHERE group_id = ? GROUP BY DATE_FORMAT(expense_date, '%Y-%m') ORDER BY month DESC",
                (resultSet, rowNumber) -> new MonthlySummaryResponse(resultSet.getString("month"),
                        resultSet.getBigDecimal("total_amount"), resultSet.getInt("expense_count")), groupId);
    }

    private void insertShares(Long expenseId, CreateExpenseRequest request) {
        for (CreateExpenseRequest.ShareRequest share : request.getShares()) {
            jdbcTemplate.update("INSERT INTO expense_share (expense_id, user_id, share_amount) VALUES (?, ?, ?)",
                    expenseId, share.getUserId(), share.getAmount());
        }
    }

    private ExpenseResponse mapExpense(ResultSet resultSet, int rowNumber) throws SQLException {
        return new ExpenseResponse(resultSet.getLong("id"), resultSet.getString("description"),
                resultSet.getString("category"), resultSet.getDate("expense_date").toLocalDate(),
                resultSet.getBigDecimal("amount"), resultSet.getLong("payer_id"), resultSet.getString("split_method"));
    }
}
