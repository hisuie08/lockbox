# Browser Crypto App

## Goal

Browser-only file encryption app.

No server uploads.

## Stack

- React
- TypeScript
- Vite
- Tailwind v4
- shadcn/ui

## Crypto

MVP:
- RSA-OAEP
- AES-GCM

Future:
- X25519
- ChaCha20-Poly1305

## Rules

- Never upload files
- No backend
- No localStorage for private keys
- Prefer pure functions
- Separate hooks and services

# Non Goals

- No backend
- No authentication
- No cloud sync
- No database