# ZeaZDev Enterprise API Documentation

## Base URL
```
https://api.zeazdev.com
```

## Authentication

All API requests require authentication using an API key. Include your API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

---

## White-Label APIs

### Create White-Label Configuration

**Endpoint:** `POST /enterprise/whitelabel`

**Description:** Create a new white-label configuration for your organization.

**Request Body:**
```json
{
  "orgId": "org_123",
  "orgName": "Your Company",
  "brandName": "Your App",
  "logo": "https://yoursite.com/logo.png",
  "primaryColor": "#FF6B35",
  "secondaryColor": "#004E89",
  "domain": "app.yourcompany.com"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orgId": "org_123",
  "orgName": "Your Company",
  "brandName": "Your App",
  "logo": "https://yoursite.com/logo.png",
  "primaryColor": "#FF6B35",
  "secondaryColor": "#004E89",
  "domain": "app.yourcompany.com",
  "apiKey": "zea_1a2b3c4d5e6f...",
  "features": [],
  "active": true,
  "createdAt": "2025-11-10T10:00:00.000Z",
  "updatedAt": "2025-11-10T10:00:00.000Z"
}
```

---

### Get White-Label Configuration

**Endpoint:** `GET /enterprise/whitelabel/:orgId`

**Description:** Retrieve white-label configuration for an organization.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orgId": "org_123",
  "orgName": "Your Company",
  "brandName": "Your App",
  "logo": "https://yoursite.com/logo.png",
  "primaryColor": "#FF6B35",
  "secondaryColor": "#004E89",
  "domain": "app.yourcompany.com",
  "apiKey": "zea_1a2b3c4d5e6f...",
  "features": ["wallet", "bridge", "game"],
  "active": true,
  "createdAt": "2025-11-10T10:00:00.000Z",
  "updatedAt": "2025-11-10T10:00:00.000Z"
}
```

---

### Update White-Label Configuration

**Endpoint:** `PUT /enterprise/whitelabel/:orgId`

**Description:** Update white-label configuration settings.

**Request Body:**
```json
{
  "brandName": "Updated App Name",
  "primaryColor": "#1E40AF",
  "active": true
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orgId": "org_123",
  "brandName": "Updated App Name",
  "primaryColor": "#1E40AF",
  "active": true,
  "updatedAt": "2025-11-10T10:05:00.000Z"
}
```

---

### Get White-Label Features

**Endpoint:** `GET /enterprise/whitelabel/:orgId/features`

**Description:** Get available and enabled features for the organization.

**Response:** `200 OK`
```json
{
  "availableFeatures": [
    { "id": "wallet", "name": "Wallet Management", "enabled": true },
    { "id": "bridge", "name": "Cross-Chain Bridge", "enabled": true },
    { "id": "game", "name": "GameFi Suite", "enabled": true },
    { "id": "fintech", "name": "FinTech Services", "enabled": true },
    { "id": "defi", "name": "DeFi Operations", "enabled": true },
    { "id": "nft", "name": "NFT Marketplace", "enabled": false },
    { "id": "governance", "name": "DAO Governance", "enabled": true },
    { "id": "social", "name": "Social Features", "enabled": true }
  ],
  "customization": {
    "brandName": "Your App",
    "logo": "https://yoursite.com/logo.png",
    "primaryColor": "#FF6B35",
    "secondaryColor": "#004E89",
    "domain": "app.yourcompany.com"
  }
}
```

---

### Update White-Label Features

**Endpoint:** `PUT /enterprise/whitelabel/:orgId/features`

**Description:** Enable or disable specific features for the organization.

**Request Body:**
```json
{
  "features": ["wallet", "bridge", "game", "fintech", "defi"]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orgId": "org_123",
  "features": ["wallet", "bridge", "game", "fintech", "defi"],
  "updatedAt": "2025-11-10T10:10:00.000Z"
}
```

---

## Developer App APIs

### Create Developer App

**Endpoint:** `POST /enterprise/developer/app`

**Description:** Create a new developer application and receive API credentials.

**Request Body:**
```json
{
  "developerId": "dev_123",
  "appName": "My Awesome App",
  "description": "A crypto gaming platform",
  "webhookUrl": "https://myapp.com/webhooks"
}
```

**Response:** `200 OK`
```json
{
  "id": "app_456",
  "developerId": "dev_123",
  "appName": "My Awesome App",
  "description": "A crypto gaming platform",
  "apiKey": "zea_1a2b3c4d5e6f...",
  "apiSecret": "secret_9z8y7x6w5v...",
  "webhookUrl": "https://myapp.com/webhooks",
  "active": true,
  "createdAt": "2025-11-10T10:00:00.000Z",
  "updatedAt": "2025-11-10T10:00:00.000Z"
}
```

**Note:** The `apiSecret` is only returned once. Store it securely.

---

### Get Developer Apps

**Endpoint:** `GET /enterprise/developer/:developerId/apps`

**Description:** List all applications for a developer.

**Response:** `200 OK`
```json
[
  {
    "id": "app_456",
    "appName": "My Awesome App",
    "description": "A crypto gaming platform",
    "apiKey": "zea_1a2b3c4d5e6f...",
    "webhookUrl": "https://myapp.com/webhooks",
    "active": true,
    "createdAt": "2025-11-10T10:00:00.000Z",
    "updatedAt": "2025-11-10T10:00:00.000Z"
  }
]
```

---

### Update Developer App

**Endpoint:** `PUT /enterprise/developer/app/:appId`

**Description:** Update developer application settings.

**Request Body:**
```json
{
  "appName": "Updated App Name",
  "webhookUrl": "https://myapp.com/new-webhooks",
  "active": true
}
```

**Response:** `200 OK`
```json
{
  "id": "app_456",
  "appName": "Updated App Name",
  "webhookUrl": "https://myapp.com/new-webhooks",
  "active": true,
  "updatedAt": "2025-11-10T10:15:00.000Z"
}
```

---

## Plugin APIs

### List Plugins

**Endpoint:** `GET /enterprise/plugins`

**Description:** List available plugins from the marketplace.

**Query Parameters:**
- `category` (optional): Filter by category (payments, analytics, auth, marketing, blockchain)
- `featured` (optional): Show only featured plugins (true/false)

**Response:** `200 OK`
```json
{
  "plugins": [
    {
      "id": "1",
      "name": "Payment Gateway Integration",
      "version": "1.0.0",
      "description": "Accept payments via Stripe, PayPal, and more",
      "author": "ZeaZDev",
      "category": "payments",
      "price": 0,
      "downloads": 15420,
      "rating": 4.8
    },
    {
      "id": "2",
      "name": "Advanced Analytics Dashboard",
      "version": "2.1.0",
      "description": "Comprehensive analytics with charts and insights",
      "author": "Analytics Pro",
      "category": "analytics",
      "price": 49,
      "downloads": 8750,
      "rating": 4.6
    }
  ]
}
```

---

### Create Plugin

**Endpoint:** `POST /enterprise/plugins`

**Description:** Publish a new plugin to the marketplace.

**Request Body:**
```json
{
  "developerId": "dev_123",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "Adds advanced analytics",
  "category": "analytics",
  "price": 29
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "plugin": {
    "id": "uuid",
    "developerId": "dev_123",
    "name": "My Awesome Plugin",
    "version": "1.0.0",
    "description": "Adds advanced analytics",
    "category": "analytics",
    "price": 29,
    "downloads": 0,
    "rating": 0,
    "active": true,
    "createdAt": "2025-11-10T10:00:00.000Z"
  },
  "message": "Plugin created successfully"
}
```

---

### Install Plugin

**Endpoint:** `POST /enterprise/plugins/install`

**Description:** Install a plugin for your organization.

**Request Body:**
```json
{
  "orgId": "org_123",
  "pluginId": "1"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "installation": {
    "id": "uuid",
    "orgId": "org_123",
    "pluginId": "1",
    "installedAt": "2025-11-10T10:00:00.000Z",
    "active": true
  },
  "message": "Plugin installed successfully"
}
```

---

### Get Installed Plugins

**Endpoint:** `GET /enterprise/plugins/installed/:orgId`

**Description:** List all installed plugins for an organization.

**Response:** `200 OK`
```json
{
  "plugins": [
    {
      "id": "uuid",
      "orgId": "org_123",
      "pluginId": "1",
      "installedAt": "2025-11-10T10:00:00.000Z",
      "active": true,
      "plugin": {
        "id": "1",
        "name": "Payment Gateway Integration",
        "version": "1.0.0",
        "description": "Accept payments via Stripe, PayPal, and more",
        "category": "payments",
        "price": 0
      }
    }
  ]
}
```

---

### Uninstall Plugin

**Endpoint:** `DELETE /enterprise/plugins/uninstall`

**Description:** Uninstall a plugin from your organization.

**Request Body:**
```json
{
  "orgId": "org_123",
  "pluginId": "1"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Plugin uninstalled successfully"
}
```

---

## SDK APIs

### Get SDK List

**Endpoint:** `GET /enterprise/sdk/list`

**Description:** Get list of available SDKs for different programming languages.

**Response:** `200 OK`
```json
{
  "sdks": [
    {
      "language": "TypeScript/JavaScript",
      "packageName": "@zeazdev/sdk",
      "version": "2.0.0",
      "installCommand": "npm install @zeazdev/sdk",
      "docUrl": "https://docs.zeazdev.com/sdk/typescript"
    },
    {
      "language": "Python",
      "packageName": "zeazdev-sdk",
      "version": "2.0.0",
      "installCommand": "pip install zeazdev-sdk",
      "docUrl": "https://docs.zeazdev.com/sdk/python"
    },
    {
      "language": "Go",
      "packageName": "github.com/zeazdev/sdk-go",
      "version": "2.0.0",
      "installCommand": "go get github.com/zeazdev/sdk-go",
      "docUrl": "https://docs.zeazdev.com/sdk/go"
    },
    {
      "language": "PHP",
      "packageName": "zeazdev/sdk-php",
      "version": "2.0.0",
      "installCommand": "composer require zeazdev/sdk-php",
      "docUrl": "https://docs.zeazdev.com/sdk/php"
    },
    {
      "language": "Ruby",
      "packageName": "zeazdev-sdk",
      "version": "2.0.0",
      "installCommand": "gem install zeazdev-sdk",
      "docUrl": "https://docs.zeazdev.com/sdk/ruby"
    }
  ]
}
```

---

### Generate SDK Example

**Endpoint:** `GET /enterprise/sdk/example`

**Description:** Generate code examples for a specific language.

**Query Parameters:**
- `language` (required): Language name (typescript, python, go, php, ruby)
- `apiKey` (required): Your API key

**Response:** `200 OK`
```json
{
  "language": "typescript",
  "example": "import { ZeaZDevSDK } from '@zeazdev/sdk';\n\nconst sdk = new ZeaZDevSDK('zea_...');\n\n// Create a wallet\nconst wallet = await sdk.wallet.create({\n  userId: 'user_123',\n  type: 'custodial'\n});\n\n// Bridge tokens\nconst bridge = await sdk.bridge.initiate({\n  token: 'ZEA',\n  amount: '1000',\n  sourceChain: 10,\n  targetChain: 137\n});"
}
```

---

## API Marketplace APIs

### Get API Endpoints

**Endpoint:** `GET /enterprise/api/endpoints`

**Description:** Get list of all available API endpoints organized by category.

**Response:** `200 OK`
```json
{
  "endpoints": [
    {
      "category": "Wallet",
      "endpoints": [
        { "method": "POST", "path": "/api/wallet/create", "description": "Create a new wallet" },
        { "method": "GET", "path": "/api/wallet/:userId", "description": "Get wallet details" },
        { "method": "GET", "path": "/api/wallet/:userId/balance", "description": "Get wallet balance" }
      ]
    },
    {
      "category": "Bridge",
      "endpoints": [
        { "method": "GET", "path": "/api/bridge/quote", "description": "Get bridge quote" },
        { "method": "POST", "path": "/api/bridge/initiate", "description": "Initiate bridge transaction" },
        { "method": "GET", "path": "/api/bridge/transaction/:hash", "description": "Get bridge status" }
      ]
    }
  ]
}
```

---

### Get Rate Limits

**Endpoint:** `GET /enterprise/rate-limits`

**Description:** Get current rate limit information for your API key.

**Query Parameters:**
- `apiKey` (required): Your API key

**Response:** `200 OK`
```json
{
  "tier": "free",
  "limits": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  },
  "current": {
    "requestsThisMinute": 45,
    "requestsThisHour": 823,
    "requestsToday": 7234
  }
}
```

---

## Analytics APIs

### Get API Usage

**Endpoint:** `GET /enterprise/api-usage/:orgId`

**Description:** Get API usage statistics for your organization.

**Query Parameters:**
- `startDate` (required): Start date (ISO 8601 format)
- `endDate` (required): End date (ISO 8601 format)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "orgId": "org_123",
    "endpoint": "/api/wallet/create",
    "method": "POST",
    "requestCount": 1234,
    "successCount": 1200,
    "errorCount": 34,
    "date": "2025-11-10T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "orgId": "org_123",
    "endpoint": "/api/bridge/initiate",
    "method": "POST",
    "requestCount": 567,
    "successCount": 550,
    "errorCount": 17,
    "date": "2025-11-10T00:00:00.000Z"
  }
]
```

---

## Rate Limits

### Tiers

| Tier       | Requests/Min | Requests/Hour | Requests/Day | Price        |
|------------|--------------|---------------|--------------|--------------|
| Free       | 60           | 1,000         | 10,000       | $0/month     |
| Pro        | 600          | 20,000        | 500,000      | $99/month    |
| Enterprise | 6,000        | 200,000       | 5,000,000    | Custom       |

### Rate Limit Headers

All API responses include rate limit information in the headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699632000
```

---

## Error Responses

### Error Format

```json
{
  "statusCode": 400,
  "message": "Invalid request parameters",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Webhooks

### Webhook Events

- `whitelabel.created` - White-label configuration created
- `whitelabel.updated` - White-label configuration updated
- `plugin.installed` - Plugin installed
- `plugin.uninstalled` - Plugin uninstalled
- `app.created` - Developer app created
- `app.updated` - Developer app updated

### Webhook Payload

```json
{
  "event": "plugin.installed",
  "timestamp": "2025-11-10T10:00:00.000Z",
  "data": {
    "orgId": "org_123",
    "pluginId": "1",
    "pluginName": "Payment Gateway Integration"
  },
  "signature": "sha256=..."
}
```

### Webhook Verification

Verify webhook signatures using HMAC-SHA256:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expected}`;
}
```

---

## Support

- **Documentation**: https://docs.zeazdev.com
- **Discord**: https://discord.gg/zeazdev
- **Email**: enterprise@zeazdev.com
- **Status**: https://status.zeazdev.com

---

**Version**: 2.0.0
**Last Updated**: 2025-11-10
