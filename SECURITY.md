# Security Policy

## Supported Versions
Only the current production build of Terra is actively supported with security updates.

## Vulnerability Reporting
Please do not open public GitHub issues for security vulnerabilities. Instead, report security bugs directly to the maintainers. We investigate all credible reports within 24 hours.

## Implemented Safeguards
1. **Server-Side API Proxy Isolation:** All transactions involving Google Gemini or database nodes pass through an internal middleware proxy layer. No operational API tokens reach the client-side network profile.
2. **Input Sanitization:** Incoming parameters undergo structural validation and boundary validation before mutations hit state models.
