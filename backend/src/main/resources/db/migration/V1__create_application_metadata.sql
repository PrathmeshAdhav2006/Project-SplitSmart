CREATE TABLE application_metadata (
    metadata_key VARCHAR(100) NOT NULL,
    metadata_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_application_metadata PRIMARY KEY (metadata_key)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

INSERT INTO application_metadata (metadata_key, metadata_value)
VALUES ('schema_version', 'foundation');
