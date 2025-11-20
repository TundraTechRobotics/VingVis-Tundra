# Security Fixes Checklist

Use this checklist to track progress on implementing security fixes from the audit.

---

## 🔴 CRITICAL (Week 1) - **MUST FIX IMMEDIATELY**

### Issue 1.1: Placeholder Credentials
- [ ] Remove placeholder values from `lib/supabase.ts`
- [ ] Remove placeholder values from `lib/supabase-admin.ts`
- [ ] Add environment variable validation that throws errors if missing
- [ ] Test that app fails to start without required env vars
- [ ] Create `.env.example` file documenting all required variables

**Files to modify:**
- `lib/supabase.ts` (lines 9-10)
- `lib/supabase-admin.ts` (lines 10-11)

**Code example:** See SECURITY-AUDIT-REPORT.md section 1.1

---

### Issue 1.2: Verbose Error Messages
- [ ] Remove all `console.log` statements that log user data from API routes
- [ ] Replace detailed error messages with generic ones in production
- [ ] Implement proper error logging service (Sentry recommended)
- [ ] Add error tracking codes instead of detailed messages
- [ ] Update error responses in all API routes

**Files to modify:**
- `app/api/projects/route.ts` (30+ console statements)
- `app/api/auth/signin/route.ts`
- `app/api/waitlist/route.ts`
- All other API routes with console.log/error

**Code example:** See SECURITY-AUDIT-REPORT.md section 1.2

---

## 🟠 HIGH (Week 2) - **FIX WITHIN 2 WEEKS**

### Issue 2.1: Weak Password Policy
- [ ] Update password validation in `app/signup/page.tsx`
- [ ] Change minimum length from 6 to 8 characters
- [ ] Add requirement for uppercase, lowercase, and numbers
- [ ] Consider adding password strength meter (zxcvbn library)
- [ ] Update error messages to reflect new requirements
- [ ] Update user-facing documentation

**Files to modify:**
- `app/signup/page.tsx` (line 37)

**Code example:** See SECURITY-AUDIT-REPORT.md section 2.1

---

### Issue 2.2: Missing Input Validation
- [ ] Create Zod schemas for all API endpoints
- [ ] Add validation to `app/api/auth/signup/route.ts`
- [ ] Add validation to `app/api/auth/signin/route.ts`
- [ ] Add validation to `app/api/projects/route.ts`
- [ ] Add validation to `app/api/projects/[projecthash]/route.ts`
- [ ] Add validation to `app/api/waitlist/route.ts`
- [ ] Add validation to `app/api/users/profile/route.ts`
- [ ] Add size limits for motorConfig and workflowData

**Files to modify:**
- `app/api/auth/signup/route.ts`
- `app/api/auth/signin/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[projecthash]/route.ts`
- `app/api/waitlist/route.ts`

**Code example:** See SECURITY-AUDIT-REPORT.md section 2.2

---

### Issue 2.3: IDOR in Project URL Structure
- [ ] **Option A:** Remove username from URL entirely
  - [ ] Change route from `/dashboard/[username]/[projecthash]` to `/dashboard/project/[projecthash]`
  - [ ] Update all navigation links
  - [ ] Update any hardcoded routes
- [ ] **Option B:** Validate username matches project owner
  - [ ] Add validation in page component
  - [ ] Redirect to correct URL if username doesn't match
- [ ] Test that users cannot access projects by manipulating URL

**Files to modify:**
- `app/dashboard/[username]/[projecthash]/page.tsx`
- Any components that link to project pages

**Code example:** See SECURITY-AUDIT-REPORT.md section 2.3

---

### Issue 2.4: Insufficient Rate Limiting
- [ ] Reduce signin rate limit from 5/min to 3/min
- [ ] Reduce signup rate limit to 2 per 15 minutes
- [ ] Implement account-based rate limiting (not just IP)
- [ ] Add CAPTCHA requirement after 3 failed attempts
- [ ] Consider adding exponential backoff
- [ ] Test rate limiting with automated tests

**Files to modify:**
- `app/api/auth/signin/route.ts` (line 8)
- `app/api/auth/signup/route.ts` (line 8)
- `lib/rate-limit.ts` (add account-based limiting)

**Code example:** See SECURITY-AUDIT-REPORT.md section 2.4

---

## 🟡 MEDIUM (Month 1) - **FIX WITHIN 1 MONTH**

### Issue 3.1: In-Memory Rate Limiting
- [ ] Set up Redis/Upstash account
- [ ] Install `@upstash/ratelimit` and `@upstash/redis`
- [ ] Replace in-memory rate limit with Redis-based solution
- [ ] Update all rate limit calls to use new implementation
- [ ] Test rate limiting across multiple server instances
- [ ] Remove old in-memory implementation

**Files to modify:**
- `lib/rate-limit.ts` (complete rewrite)
- All files that import rate-limit

**Code example:** See SECURITY-AUDIT-REPORT.md section 3.1

---

### Issue 3.2: Missing CSRF Protection
- [ ] Document that Authorization header pattern must be maintained
- [ ] Add comments in API routes warning against cookie-based auth
- [ ] If planning to use cookies, implement CSRF protection
- [ ] Add SameSite cookie policy to next.config.mjs
- [ ] Test that CSRF protection works (if implemented)

**Files to modify:**
- All API routes (add documentation comments)
- `next.config.mjs` (if adding cookie policies)

**Code example:** See SECURITY-AUDIT-REPORT.md section 3.2

---

### Issue 3.3: Dangerous Inner HTML
- [ ] Add color sanitization to `components/ui/chart.tsx`
- [ ] Use CSS.escape for the id parameter
- [ ] Add validation that color values are safe CSS
- [ ] Add warning comment for developers
- [ ] Test with various color inputs

**Files to modify:**
- `components/ui/chart.tsx` (lines 82-100)

**Code example:** See SECURITY-AUDIT-REPORT.md section 3.3

---

### Issue 3.4: No Request Size Limits
- [ ] Add body size checking in `middleware.ts`
- [ ] Add 1MB limit for all API routes
- [ ] Add 500KB specific limit for workflowData
- [ ] Configure Next.js bodyParser size limit
- [ ] Test with oversized payloads
- [ ] Add appropriate error messages

**Files to modify:**
- `middleware.ts`
- `app/api/projects/[projecthash]/route.ts`
- `next.config.mjs`

**Code example:** See SECURITY-AUDIT-REPORT.md section 3.4

---

### Issue 3.5: Inadequate Session Management
- [ ] Configure explicit session settings in Supabase client
- [ ] Implement session timeout checking on frontend
- [ ] Add session refresh logic
- [ ] Configure session expiry in Supabase dashboard (1 hour access, 7 days refresh)
- [ ] Enable refresh token rotation in Supabase dashboard
- [ ] Add automatic sign-out on session expiry

**Files to modify:**
- `lib/supabase.ts`
- `lib/auth-context.tsx`
- Supabase dashboard configuration

**Code example:** See SECURITY-AUDIT-REPORT.md section 3.5

---

## 🟢 LOW (Ongoing) - **CONTINUOUS IMPROVEMENT**

### Issue 4.1: TypeScript Errors Ignored
- [ ] Run `npm run build` and note all TypeScript errors
- [ ] Fix TypeScript errors incrementally (create separate tickets)
- [ ] Enable strict type checking in `tsconfig.json`
- [ ] Set `ignoreBuildErrors: false` in `next.config.mjs`
- [ ] Add TypeScript checking to CI/CD pipeline

**Files to modify:**
- `next.config.mjs` (line 10)
- `tsconfig.json`
- Various files with TypeScript errors

**Code example:** See SECURITY-AUDIT-REPORT.md section 4.1

---

### Issue 4.2: Overly Permissive CORS
- [ ] Create explicit origin whitelist for production
- [ ] Add environment-specific allowed origins
- [ ] Add origin format validation
- [ ] Remove generic comment about adding origins
- [ ] Test CORS with production domains

**Files to modify:**
- `middleware.ts` (lines 12-22)

**Code example:** See SECURITY-AUDIT-REPORT.md section 4.2

---

### Issue 4.3: No Security Monitoring
- [ ] Set up Sentry or similar logging service
- [ ] Implement structured security logging
- [ ] Add logging for authentication events
- [ ] Add logging for authorization failures
- [ ] Set up alerts for suspicious activity
- [ ] Create security dashboard

**Files to create:**
- `lib/logger.ts`

**Files to modify:**
- All API routes (add security logging)

**Code example:** See SECURITY-AUDIT-REPORT.md section 4.3

---

## 🧪 Testing Checklist

After implementing fixes, verify:

### Authentication Security
- [ ] Weak passwords are rejected
- [ ] Strong passwords are accepted
- [ ] Rate limiting prevents brute force
- [ ] Failed login attempts are logged
- [ ] Successful logins are logged

### Authorization Security
- [ ] Users cannot access other users' projects
- [ ] JWT tokens are properly validated
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected

### Input Validation
- [ ] Oversized payloads are rejected (413 error)
- [ ] Invalid input formats are rejected (400 error)
- [ ] SQL injection attempts fail safely
- [ ] XSS attempts are sanitized

### Error Handling
- [ ] Error messages don't leak sensitive info
- [ ] Errors are properly logged server-side
- [ ] Console doesn't contain PII in production

### Rate Limiting
- [ ] Rate limits prevent abuse
- [ ] Rate limit headers are present
- [ ] Rate limiting works across instances (if using Redis)

---

## 📝 Testing Commands

```bash
# Run security audit on dependencies
npm audit --production

# Check for vulnerable packages
npm audit fix

# Run linter
npm run lint

# Build project (will fail if TypeScript errors)
npm run build

# Run tests (add security tests)
npm test

# Start development server
npm run dev
```

---

## ✅ Sign-off

Once all critical and high priority fixes are complete:

- [ ] All critical issues resolved (1.1, 1.2)
- [ ] All high priority issues resolved (2.1, 2.2, 2.3, 2.4)
- [ ] Security tests added and passing
- [ ] Code reviewed by senior developer
- [ ] Changes tested in staging environment
- [ ] Documentation updated
- [ ] Team trained on new security requirements

**Signed off by:** ___________________  
**Date:** ___________________

---

## 🔄 Next Security Audit

Schedule next security audit for: **December 20, 2025** (30 days from initial audit)

Items to review:
- All fixes implemented correctly
- No new vulnerabilities introduced
- Dependency updates and security patches
- Any new features added
- Effectiveness of monitoring and alerting

---

**Reference:** See [SECURITY-AUDIT-REPORT.md](./SECURITY-AUDIT-REPORT.md) for detailed explanations and code examples for each issue.
