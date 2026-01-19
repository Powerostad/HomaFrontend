# Password Login Feature Design

**Date:** 2026-01-18
**Status:** Approved

## Overview

Add password-based login as a secondary authentication option alongside the existing OTP flow. Users can choose between OTP verification (primary) or phone + password login (secondary).

## User Flow

### Step Structure

```
step: "phone"           → Enter phone, choose OTP or password
step: "otp"             → Verify OTP code (existing)
step: "password"        → Enter phone + password to login
step: "reset-otp"       → Request OTP for password reset
step: "reset-password"  → Enter OTP + new password + confirm
```

### Navigation

```
"phone" ──────► "otp"
   │
   │ (link click)
   ▼
"password" ───► "reset-otp" ───► "reset-password"
```

- Back arrow in top-right corner (RTL) for `password`, `reset-otp`, `reset-password` steps
- Phone number persists across step transitions

## UI Design

### Phone Step (Modified)

Current UI with one addition:
- Add "ورود با رمز عبور" link below the primary button

### Password Login Step

**Header:** "ورود با رمز عبور"

**Fields:**
1. Phone number (pre-filled if coming from phone step, editable)
2. Password with show/hide toggle

**Links below fields:**
- Left: "تغییر شماره"
- Right: "فراموشی رمز عبور"

**Primary button:** "ورود"

**Footer:** Divider with "یا" and "ورود با کد تایید" link

### Password Reset Flow

**Step reset-otp:**
- Title: "بازیابی رمز عبور"
- Phone field (pre-filled)
- Button: "دریافت کد تایید"

**Step reset-password:**
- Title: "تنظیم رمز عبور جدید"
- OTP field with countdown timer
- New password field with show/hide
- Confirm password field with show/hide
- Button: "تغییر رمز عبور"

## Validation & Error Handling

### Client-side Validation

| Field | Rule | Persian Error |
|-------|------|---------------|
| Phone | Valid Iranian mobile | لطفاً یک شماره موبایل معتبر وارد کنید |
| Password | Min 6 characters | رمز عبور باید حداقل ۶ کاراکتر باشد |
| Confirm password | Must match | رمز عبور و تکرار آن یکسان نیستند |
| OTP | 6 digits | کد تایید باید ۶ رقم باشد |

### API Error Messages

| Scenario | Persian Message |
|----------|-----------------|
| Wrong credentials | شماره موبایل یا رمز عبور اشتباه است |
| Account locked | حساب شما موقتاً مسدود شده. لطفاً بعداً تلاش کنید |
| Invalid OTP | کد تایید نامعتبر است |
| OTP expired | کد تایید منقضی شده است |
| Network error | خطا در برقراری ارتباط با سرور |

## API Integration

### Existing Backend Endpoints

```
POST /users/login/           - Phone + password login
POST /users/otp/send/        - Send OTP (purpose: "reset_password")
POST /users/password/reset/  - Reset password with OTP
```

### New authService Functions

```typescript
// Login with phone + password
loginWithPassword(phone: string, password: string): Promise<LoginResult>

// Reset password
resetPassword(phone: string, otp: string, newPassword: string): Promise<ResetResult>
```

## Implementation Scope

### Files to Modify

1. `src/components/AuthModal.tsx` - Add new steps and UI (~200 lines)
2. `src/services/authService.ts` - Add login + reset functions (~40 lines)

### Files Unchanged

- Backend (endpoints already exist)
- `src/context/AuthContext.tsx` (token handling remains same)
- `src/types/auth.ts` (User, AuthTokens unchanged)

## Security Considerations

- Generic error messages for login failures to prevent user enumeration
- Password minimum 6 characters
- Reuses existing OTP rate limiting for password reset
