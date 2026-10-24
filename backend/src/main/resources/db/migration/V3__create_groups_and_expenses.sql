CREATE TABLE expense_group (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_expense_group PRIMARY KEY (id),
    CONSTRAINT fk_group_owner FOREIGN KEY (owner_id) REFERENCES app_user (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE group_member (
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_group_member PRIMARY KEY (group_id, user_id),
    CONSTRAINT fk_member_group FOREIGN KEY (group_id) REFERENCES expense_group (id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE expense (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(40) NOT NULL,
    expense_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payer_id BIGINT NOT NULL,
    split_method VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_expense PRIMARY KEY (id),
    CONSTRAINT fk_expense_group FOREIGN KEY (group_id) REFERENCES expense_group (id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_payer FOREIGN KEY (payer_id) REFERENCES app_user (id),
    CONSTRAINT ck_expense_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE expense_share (
    expense_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    share_amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT pk_expense_share PRIMARY KEY (expense_id, user_id),
    CONSTRAINT fk_share_expense FOREIGN KEY (expense_id) REFERENCES expense (id) ON DELETE CASCADE,
    CONSTRAINT fk_share_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT ck_share_amount_nonnegative CHECK (share_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE settlement (
    id BIGINT NOT NULL AUTO_INCREMENT,
    group_id BIGINT NOT NULL,
    payer_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    settlement_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_settlement PRIMARY KEY (id),
    CONSTRAINT fk_settlement_group FOREIGN KEY (group_id) REFERENCES expense_group (id) ON DELETE CASCADE,
    CONSTRAINT fk_settlement_payer FOREIGN KEY (payer_id) REFERENCES app_user (id),
    CONSTRAINT fk_settlement_receiver FOREIGN KEY (receiver_id) REFERENCES app_user (id),
    CONSTRAINT ck_settlement_amount_positive CHECK (amount > 0),
    CONSTRAINT ck_settlement_different_users CHECK (payer_id <> receiver_id)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX ix_group_member_user ON group_member (user_id);
CREATE INDEX ix_expense_group_date ON expense (group_id, expense_date);
CREATE INDEX ix_settlement_group_date ON settlement (group_id, settlement_date);
