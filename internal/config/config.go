package config

import (
	"os"
)

type Config struct {
	ServerAddr    string
	DatabaseURL   string
	JWTSecret     []byte
	AdminUsername string
	AdminPassword string
	CertEmail     string
}

func Load() (*Config, error) {
	return &Config{
		ServerAddr:    os.Getenv("SERVER_ADDR"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		JWTSecret:     []byte(os.Getenv("JWT_SECRET")),
		AdminUsername: os.Getenv("ADMIN_USERNAME"),
		AdminPassword: os.Getenv("ADMIN_PASSWORD"),
		CertEmail:     os.Getenv("CERT_EMAIL"),
	}, nil
}
