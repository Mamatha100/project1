# Email Failover System

## Overview

This project is a simulation of a robust email sending microservice designed to handle real-world issues like provider failures, rate limits, retries, fallbacks, and circuit breaking. The solution ensures reliability and high availability in critical communication services.

Technologies Used:
- TypeScript
- Node.js
- Express
- Jest (for testing)

## Problem Statement

**What are the key pain points?**
- Emails might fail to send due to provider issues.
- Single point of failure leads to poor reliability.
- Need to prevent duplicate sends and respect rate limits.

**Why is this problem significant?**
- Emails are essential for notifications, verifications, and communication in applications.
- Unreliable email delivery impacts user trust and system integrity.

**Who does it impact, and what are the consequences of not solving it?**
- End users and businesses relying on communication via email.
- Failed or duplicate emails can lead to lost opportunities and poor UX.

**How does your project approach and solve this issue?**
- Implements a retry mechanism with exponential backoff.
- Uses multiple mock providers for failover.
- Employs a circuit breaker pattern for reliability.
- Includes rate limiting to control throughput.
- Ensures deduplication by tracking sent email IDs.

## Features

✅ Primary and fallback provider logic  
✅ Retry with exponential backoff  
✅ Circuit breaker for fault tolerance  
✅ Rate limiting to avoid spamming  
✅ Duplicate email request prevention  
✅ REST API to send emails  
✅ Unit tests for core logic

## How to Run

1. Install dependencies:
```bash
   npm install
2.Start the server:
   npm run dev
3.Test with:
   npm test
4.Use POST /send-email with JSON:
  {
  "id": "email123",
  "to": "user@example.com",
  "subject": "Test Email",
  "body": "Hello!"
}


