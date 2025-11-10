# PromptPay Integration Guide

## 🇹🇭 Overview

PromptPay is Thailand's national payment system enabling instant money transfers between bank accounts using mobile numbers, national IDs, or tax IDs. This integration allows ZeaZDev users to instantly top up their crypto wallets using any Thai banking app.

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Thai Banking App                  │
│                   (SCB, Kbank, BBL, etc.)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ (Scans QR)
┌─────────────────────────────────────────────────────────────┐
│                   PromptPay QR Code (EMV)                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  • Payload Format: EMV QR Code Standard            │     │
│  │  • PromptPay ID: Phone/National ID/Tax ID          │     │
│  │  • Amount: THB (Thai Baht)                         │     │
│  │  • Reference: Unique transaction identifier        │     │
│  │  • Expiry: 15 minutes                              │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    ZeaZDev Backend API                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │  POST /fintech/promptpay/generate                  │     │
│  │  GET  /fintech/promptpay/verify/:id                │     │
│  │  POST /fintech/promptpay/webhook                   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│  • FintechTransaction (pending → completed)                 │
│  • FintechUser (account linking)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Details

### 1. QR Code Generation

**Endpoint**: `POST /fintech/promptpay/generate`

**Request**:
```json
{
  "userId": "user_uuid_here",
  "amount": "1000",
  "currency": "THB"
}
```

**Response**:
```json
{
  "qrCode": "00020101021129370016A000000677010111011301234567890125303764540510005802TH62180514TOPUP_user_12363040000",
  "amount": "1000",
  "reference": "transaction_uuid",
  "expiresAt": "2025-11-10T09:00:00Z"
}
```

**QR Code Structure (EMV Format)**:

```
00 - Payload Format Indicator: "01"
01 - Point of Initiation Method: "11" (static) or "12" (dynamic)
29 - Merchant Account Information - PromptPay
     0016 - Tag: Application Identifier
     A000000677010111 - PromptPay AID
     01 - PromptPay ID length
     13 - 13 digits (National ID/Tax ID) or 10 (Phone)
     0123456789012 - Actual PromptPay ID
53 - Transaction Currency: "764" (THB)
54 - Transaction Amount: "1000"
58 - Country Code: "TH"
62 - Additional Data
     05 - Reference length
     14 - Length of reference
     TOPUP_user_123 - Transaction reference
63 - CRC: "0000" (calculated via CRC-16-CCITT)
```

### 2. Payment Verification

**Two-Way Verification System**:

#### Method A: Polling (Frontend)
```javascript
// Frontend polls every 5 seconds
const checkPayment = async () => {
  const response = await fetch(
    `/fintech/promptpay/verify/${transactionId}`
  );
  const data = await response.json();
  
  if (data.status === 'completed') {
    // Show success, credit crypto
  }
};
```

#### Method B: Webhook (Backend)
```javascript
// Thai bank calls this endpoint when payment is received
POST /fintech/promptpay/webhook
{
  "transactionRef": "TOPUP_user_123",
  "amount": "1000",
  "paidAt": "2025-11-10T08:45:00Z",
  "status": "success"
}
```

### 3. Transaction States

```
[Generated] → QR code created, waiting for payment
     ↓
[Pending] → User scanned QR, payment in progress
     ↓
[Completed] → Payment confirmed, crypto minted
     ↓
[Failed] → Payment rejected by bank
     ↓
[Expired] → QR code timeout (15 minutes)
```

---

## 🔐 Security Measures

### 1. QR Code Security
- **Expiry Time**: 15 minutes maximum
- **One-Time Use**: Each QR is unique per transaction
- **Amount Lock**: Amount cannot be changed after QR generation
- **CRC Validation**: CRC-16-CCITT checksum prevents tampering

### 2. Transaction Verification
- **Dual Verification**: Both webhook and polling check
- **Unique References**: Cryptographically secure transaction IDs
- **Amount Matching**: Verify paid amount matches requested amount
- **Timestamp Validation**: Check payment within expiry window

### 3. Webhook Security
- **Signature Verification**: Verify webhook signature from Thai bank
- **IP Whitelisting**: Only accept webhooks from known bank IPs
- **Replay Protection**: Track processed webhook IDs
- **HTTPS Only**: All webhook endpoints use TLS

### 4. Anti-Fraud
- **Rate Limiting**: Max 5 QR generations per user per hour
- **Amount Limits**: Per transaction (50,000 THB) and daily (200,000 THB)
- **Pattern Detection**: Monitor for suspicious behavior
- **KYC Requirements**: Higher limits require identity verification

---

## 💰 Transaction Limits

| Tier | Per Transaction | Daily Limit | Monthly Limit |
|------|----------------|-------------|---------------|
| Basic (No KYC) | 5,000 THB | 20,000 THB | 100,000 THB |
| Verified (World ID) | 20,000 THB | 100,000 THB | 500,000 THB |
| Premium (Full KYC) | 50,000 THB | 200,000 THB | 2,000,000 THB |

---

## 🏦 Supported Banks

PromptPay works with **ALL** Thai banks, including:

- **Siam Commercial Bank (SCB)**
- **Kasikornbank (Kbank)**
- **Bangkok Bank (BBL)**
- **Krung Thai Bank (KTB)**
- **TMB Bank (TMB)**
- **Bank of Ayudhya (Krungsri)**
- **Government Savings Bank (GSB)**
- **CIMB Thai**
- **Standard Chartered Thailand**
- **UOB Thailand**
- And all other Thai banks with PromptPay support

---

## 📱 User Experience Flow

### Step-by-Step User Journey

1. **User Opens FinTech Screen**
   - Sees "PromptPay Top-Up" option
   - Reads instructions

2. **User Enters Amount**
   - Types amount in THB (e.g., 1000)
   - Clicks "Generate PromptPay QR"

3. **System Generates QR**
   - Backend creates transaction record
   - Generates EMV QR code
   - Returns QR to frontend (expires in 15 min)

4. **User Scans QR**
   - Opens any Thai banking app
   - Scans QR code
   - Reviews payment details

5. **User Confirms Payment**
   - Confirms in banking app
   - Payment processed instantly
   - Bank sends notification

6. **System Receives Payment**
   - Webhook received from bank
   - Transaction verified
   - Status updated to "completed"

7. **Crypto Credited**
   - System calculates crypto equivalent
   - Mints ZEA/DING tokens
   - Transfers to user's wallet

8. **User Sees Success**
   - Frontend polls and detects completion
   - Shows success message
   - Updates wallet balance

**Total Time**: ~30 seconds (instant payment)

---

## 🧪 Testing

### Development Testing

```bash
# 1. Set environment variables
PROMPTPAY_ENABLED=true
PROMPTPAY_ID=0123456789012  # Test PromptPay ID

# 2. Generate QR code
curl -X POST http://localhost:3000/fintech/promptpay/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "amount": "100",
    "currency": "THB"
  }'

# 3. Simulate webhook (for testing)
curl -X POST http://localhost:3000/fintech/promptpay/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transactionRef": "TOPUP_test_user_1234567890",
    "amount": "100",
    "paidAt": "2025-11-10T08:30:00Z",
    "status": "success"
  }'

# 4. Verify payment
curl http://localhost:3000/fintech/promptpay/verify/{transaction_id}
```

### Sandbox Testing

Thai banks provide sandbox environments:

- **SCB Developer Portal**: https://developer.scb.co.th
- **Kbank Open API**: https://developer.kasikornbank.com
- **BBL Developer**: https://developer.bangkokbank.com

---

## 🚀 Production Deployment

### Prerequisites

1. **PromptPay ID Registration**
   - Register business PromptPay ID with Thai bank
   - Options: Phone number, Tax ID, or e-Wallet ID
   - Requires Thai business registration

2. **Bank API Access**
   - Apply for production API credentials
   - Complete bank's KYC/compliance process
   - Set up webhook endpoints

3. **Environment Configuration**
   ```bash
   PROMPTPAY_ENABLED=true
   PROMPTPAY_ID=your_production_promptpay_id
   THAI_BANK_API_KEY=your_production_api_key
   THAI_BANK_PROXY_URL=https://api.production-bank.com
   ```

4. **SSL Certificate**
   - Webhook endpoints must use HTTPS
   - Valid SSL certificate required
   - Consider using Let's Encrypt

### Deployment Checklist

- [ ] PromptPay ID registered and verified
- [ ] Bank API credentials obtained (production)
- [ ] Webhook endpoints configured with HTTPS
- [ ] Environment variables set correctly
- [ ] Transaction limits configured
- [ ] Rate limiting enabled
- [ ] Monitoring and alerting set up
- [ ] Error handling tested
- [ ] Compliance requirements met
- [ ] User documentation updated

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **QR Generation Rate**: QRs generated per hour/day
2. **Completion Rate**: % of QRs that result in payment
3. **Average Time to Payment**: From QR scan to payment
4. **Failed Transactions**: Track failure reasons
5. **Revenue by Amount**: Distribution of top-up amounts
6. **Popular Banks**: Which banks users prefer
7. **Peak Hours**: When most top-ups occur

### Logging

```typescript
// Log all PromptPay events
logger.info('PromptPay QR generated', {
  userId,
  amount,
  transactionId,
  expiresAt
});

logger.info('PromptPay payment received', {
  transactionId,
  amount,
  paidAt,
  timeToPay: duration
});

logger.error('PromptPay verification failed', {
  transactionId,
  error,
  reason
});
```

---

## ❓ FAQ

**Q: How long does a PromptPay payment take?**
A: Instant. Usually 5-30 seconds from scan to confirmation.

**Q: What if the QR code expires before payment?**
A: User must generate a new QR code. The old transaction is marked as expired.

**Q: Can users cancel a payment?**
A: Before scanning: Yes (don't scan). After scanning: No (contact support for refund).

**Q: What's the exchange rate for THB to crypto?**
A: Real-time rate determined at time of payment completion.

**Q: Are there any fees?**
A: No fees from ZeaZDev. User's bank may charge standard transfer fees.

**Q: What if payment is received but crypto isn't credited?**
A: System automatically retries. If still failing, transaction is flagged for manual review.

**Q: Can I use PromptPay from outside Thailand?**
A: No. PromptPay only works within Thailand's banking system.

**Q: Is my PromptPay ID stored?**
A: No. Only the business PromptPay ID is used. User's banking details are never stored.

---

## 🔗 Resources

### Official Documentation
- [PromptPay Specification](https://www.bot.or.th/Thai/PaymentSystems/PSServices/PromptPay/)
- [EMV QR Code Specification](https://www.emvco.com/emv-technologies/qrcodes/)
- [Thai QR Payment Standard](https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Documents/ThaiQRCode_Payment_Standard.pdf)

### Development Tools
- [QR Code Generator Library](https://github.com/soldair/node-qrcode)
- [EMV QR Parser](https://github.com/emv-qrcode/emv-qrcode)
- [Thai Bank API Documentation](https://developer.scb.co.th)

### Support
- Technical Support: dev@zeazdev.com
- PromptPay Issues: promptpay@zeazdev.com
- Community Forum: https://community.zeazdev.com

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
**Status**: Production Ready ✅
