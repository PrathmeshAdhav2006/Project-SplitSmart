package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"taskflow/backend/internal/config"
)

func findMigrationsDir() (string, error) {
	candidates := []string{"migrations", "backend/migrations", "../migrations", "../../migrations"}
	for _, dir := range candidates {
		if fi, err := os.Stat(dir); err == nil && fi.IsDir() {
			return dir, nil
		}
	}
	return "", fmt.Errorf("could not find migrations directory")
}

func main() {
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is not set. Please check backend/.env")
	}

	dsnConfig, err := mysqlDriver.ParseDSN(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("invalid DATABASE_URL: %v", err)
	}

	targetDB := dsnConfig.DBName
	if targetDB != "" {
		// Ensure database exists first
		dsnConfig.DBName = ""
		rootDB, err := sql.Open("mysql", dsnConfig.FormatDSN())
		if err != nil {
			log.Fatalf("failed to connect to MySQL server: %v", err)
		}
		query := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", targetDB)
		if _, err := rootDB.Exec(query); err != nil {
			log.Fatalf("failed to create database %s: %v", targetDB, err)
		}
		_ = rootDB.Close()
		dsnConfig.DBName = targetDB
	}

	db, err := sql.Open("mysql", dsnConfig.FormatDSN())
	if err != nil {
		log.Fatalf("failed to open database connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("cannot ping database: %v", err)
	}

	migrationsDir, err := findMigrationsDir()
	if err != nil {
		log.Fatal(err)
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("failed to read migrations directory: %v", err)
	}

	var sqlFiles []string
	for _, f := range files {
		if !f.IsDir() && filepath.Ext(f.Name()) == ".sql" {
			sqlFiles = append(sqlFiles, f.Name())
		}
	}
	sort.Strings(sqlFiles)

	if len(sqlFiles) == 0 {
		log.Println("No migration files found.")
		return
	}

	for _, filename := range sqlFiles {
		filePath := filepath.Join(migrationsDir, filename)
		content, err := os.ReadFile(filePath)
		if err != nil {
			log.Fatalf("failed to read %s: %v", filename, err)
		}

		log.Printf("Executing migration: %s ...", filename)
		if _, err := db.Exec(string(content)); err != nil {
			if mysqlErr, ok := err.(*mysqlDriver.MySQLError); ok {
				// 1060: Duplicate column name (column already exists)
				// 1050: Table already exists
				// 1061: Duplicate key name
				if mysqlErr.Number == 1060 || mysqlErr.Number == 1050 || mysqlErr.Number == 1061 {
					log.Printf("ℹ %s skipped (%s)", filename, mysqlErr.Message)
					continue
				}
			}
			log.Fatalf("migration %s failed: %v", filename, err)
		}
		log.Printf("✓ %s applied successfully", filename)
	}

	log.Println("All migrations completed successfully!")
}

