// index.ts

import express from 'express';

// Types
interface EmailRequest {
  id: string;
  to: string;
  subject: string;
  body: string;
}

type EmailStatus = 'SUCCESS' | 'FAILED' | 'FALLBACK_USED';

// Logger
function log(message: string) {
  console.log(`[LOG ${new Date().toISOString()}]: ${message}`);
}

// Rate Limiter
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private limit: number, private interval: number) {
    this.tokens = limit;
    this.lastRefill = Date.now();
  }

  allow(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > this.interval) {
      this.tokens = this.limit;
      this.lastRefill = now;
    }
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }
}

// Circuit Breaker
class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' = 'CLOSED';
  private lastAttempt = Date.now();

  constructor(private failureThreshold: number, private resetTime: number) {}

  canAttempt(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastAttempt > this.resetTime) {
        this.state = 'CLOSED';
        this.failures = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  success() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  fail() {
    this.failures++;
    this.lastAttempt = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Mock Providers
interface EmailProvider {
  send(email: EmailRequest): Promise<boolean>;
}

class MockProviderA implements EmailProvider {
  async send(email: EmailRequest): Promise<boolean> {
    console.log('Provider A sending...');
    return Math.random() < 0.7;
  }
}

class MockProviderB implements EmailProvider {
  async send(email: EmailRequest): Promise<boolean> {
    console.log('Provider B sending...');
    return Math.random() < 0.9;
  }
}

// Email Service
class EmailService {
  private sentIds = new Set<string>();
  private providers: EmailProvider[] = [new MockProviderA(), new MockProviderB()];
  private rateLimiter = new RateLimiter(5, 60000); // 5 per minute
  private breakers = [new CircuitBreaker(3, 30000), new CircuitBreaker(3, 30000)];

  async send(email: EmailRequest): Promise<EmailStatus> {
    if (this.sentIds.has(email.id)) {
      log(`Duplicate email id detected: ${email.id}`);
      return 'SUCCESS';
    }

    if (!this.rateLimiter.allow()) {
      throw new Error('Rate limit exceeded');
    }

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const breaker = this.breakers[i];

      if (!breaker.canAttempt()) {
        log(`Circuit open for provider ${i}`);
        continue;
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const success = await provider.send(email);
          if (success) {
            this.sentIds.add(email.id);
            breaker.success();
            return i === 0 ? 'SUCCESS' : 'FALLBACK_USED';
          } else {
            throw new Error('Send failed');
          }
        } catch (err) {
          breaker.fail();
          const backoff = Math.pow(2, attempt) * 100;
          log(`Retry ${attempt + 1} failed, backing off for ${backoff}ms`);
          await new Promise((res) => setTimeout(res, backoff));
        }
      }
    }

    log('All providers failed');
    return 'FAILED';
  }
}

// Server Setup
const app = express();
const emailService = new EmailService();

app.use(express.json());

app.post('/send-email', async (req, res) => {
  const email: EmailRequest = req.body;
  try {
    const status = await emailService.send(email);
    res.json({ status });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.listen(3000, () => console.log('Email service running on port 3000'));
