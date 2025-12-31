# SLA Compliance Tracker - Backend

A production-ready Node.js/Express backend for tracking Service Level Agreements (SLAs) with real-time alerts, compliance metrics, and comprehensive reporting.

## Architecture Overview

```
backend/
├── src/
│   ├── server.ts                 # Express app setup & initialization
│   ├── config.ts                 # MongoDB connection pooling
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification & authorization
│   │   └── errorHandler.ts      # Centralized error handling
│   ├── models/
│   │   ├── Team.ts              # Team subscription & members
│   │   ├── Ticket.ts            # Support tickets with SLA tracking
│   │   └── SLAPolicy.ts         # SLA targets by priority
│   ├── services/
│   │   ├── slaCalculator.ts     # CORE: Compliance & MTTR calculations
│   │   ├── alertService.ts      # Real-time breach risk detection
│   │   └── emailService.ts      # SMTP email notifications
│   └── routes/
│       ├── auth.ts              # Register, login
│       ├── metrics.ts           # Compliance % & MTTR
│       ├── tickets.ts           # Ticket CRUD & at-risk detection
│       ├── policies.ts          # SLA policy management
│       └── reports.ts           # PDF/CSV exports
├── package.json
├── tsconfig.json
└── .env.example
```

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Reports**: PDFKit
- **Dev Tools**: ts-node, nodemon

## Key Features

### 1. **SLA Compliance Tracking**
- Automatic calculation of compliance percentage
- Real-time response time vs. target tracking
- Resolution time vs. target tracking
- Monthly and daily trend analysis

### 2. **Metrics & Reporting**
- **MTTR (Mean Time To Resolution)**: Average resolution time across all tickets
- **MTTR by Priority**: Separate MTTR for P1/P2/P3 tickets
- **Compliance %**: Formula: `(resolved - breached) / resolved * 100`
- **At-Risk Detection**: Identifies tickets at 80%+ of SLA target

### 3. **Alert System**
- Automatic 5-minute interval checks for breach risk
- Email notifications when tickets approach SLA breach
- At-risk ticket list with percentage elapsed

### 4. **Report Generation**
- Monthly PDF reports with charts and metrics
- CSV export of all tickets
- Worst-performing tickets analysis

### 5. **Authentication & Authorization**
- JWT-based team authentication
- Role-based access control (admin/member/viewer)
- Secure password hashing with bcrypt

## Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your values:
   - MongoDB connection string
   - JWT secret
   - SMTP email configuration
   - Frontend URL

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Server runs on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new team
- `POST /api/auth/login` - Login team

### Metrics
- `GET /api/metrics` - Get current month metrics
- `GET /api/metrics/daily-trend?days=7` - Get daily trend (last 7 days)

### Tickets
- `GET /api/tickets` - List tickets with filters
- `POST /api/tickets` - Create ticket
- `PATCH /api/tickets/:id` - Update ticket status/timing
- `GET /api/tickets/at-risk` - Get at-risk tickets

### Policies
- `GET /api/policies` - Get SLA policies
- `PATCH /api/policies/:id` - Update policy targets

### Reports
- `GET /api/reports/monthly?month=2024-12` - Download monthly PDF report
- `GET /api/reports/csv` - Download all tickets as CSV

## Database Schema

### Teams Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  members: [{name, email, role}],
  subscriptionPlan: "free|pro|enterprise",
  ticketsUsed: Number,
  ticketLimit: Number,
  slaPolicy: ObjectId (ref),
  createdAt: Date,
  updatedAt: Date
}
```

### Tickets Collection
```javascript
{
  _id: ObjectId,
  teamId: ObjectId (ref),
  ticketNumber: String (unique per team),
  title: String,
  description: String,
  priority: "P1|P2|P3",
  status: "open|assigned|in_progress|resolved|closed",
  slaResponseTarget: Number (hours),
  slaResolutionTarget: Number (hours),
  responseTime: Number (minutes),
  resolutionTime: Number (minutes),
  responseBreached: Boolean,
  resolutionBreached: Boolean,
  createdAt: Date,
  firstResponseAt: Date,
  resolvedAt: Date
}
```

### SLA Policies Collection
```javascript
{
  _id: ObjectId,
  teamId: ObjectId (ref),
  name: String,
  p1ResponseTime: Number (hours, default: 1),
  p2ResponseTime: Number (hours, default: 4),
  p3ResponseTime: Number (hours, default: 24),
  p1ResolutionTime: Number (hours, default: 2),
  p2ResolutionTime: Number (hours, default: 8),
  p3ResolutionTime: Number (hours, default: 48),
  businessHoursOnly: Boolean,
  businessHours: {start, end},
  holidays: [Date],
  createdAt: Date
}
```

## Core Service: SLACalculator

The heart of the application. All calculations use exact formulas:

### Compliance Percentage
```
compliance = (resolved_count - breached_count) / resolved_count * 100
```

### MTTR (Mean Time To Resolution)
```
mttr = sum(resolutionTime) / count(resolved) [in minutes]
```

### At-Risk Detection
```
percentage_elapsed = (now - createdAt) / (target_hours * 60 * 60 * 1000) * 100
is_at_risk = percentage_elapsed >= 80 AND not_yet_breached
```

## Alert Service

**Runs every 5 minutes** (configurable via `ALERT_CHECK_INTERVAL`)

1. Fetches all open tickets
2. Checks if each is at-risk (80%+ of SLA target)
3. Sends email alert to team admin
4. Includes time remaining and percentage elapsed

## Subscription Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Teams | 1 | 5 | Unlimited |
| Tickets/Month | 100 | 10,000 | Unlimited |
| SLA Policies | Basic | Advanced | Custom |
| Reports | Basic | Advanced | Full |
| Email Alerts | ✓ | ✓ | ✓ |
| API Access | Limited | Full | Full |

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-12-30T10:00:00Z"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (email already exists)
- `429` - Ticket limit reached
- `500` - Server error

## Development

### TypeScript Compilation
```bash
npm run build    # Compile to dist/
npm run dev      # Run with hot-reload
npm start        # Run compiled version
```

### Database Indexing

Automatic indexes on:
- `Team.email` - O(1) lookups
- `Ticket.teamId` - Efficient filtering
- `Ticket.teamId + status` - Fast status queries
- `Ticket.teamId + priority` - Fast priority queries
- `SLAPolicy.teamId` - Quick policy lookups

## Security Features

- ✓ JWT token expiration (24 hours default)
- ✓ Bcrypt password hashing (10 rounds)
- ✓ CORS configured for localhost:5173
- ✓ Environment variable protection
- ✓ MongoDB connection pooling
- ✓ Request validation on all endpoints
- ✓ Team isolation in all queries

## Deployment

### Railway
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy on push to main branch

### Environment Variables
```
MONGODB_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=https://app.slatracker.com
ALERT_CHECK_INTERVAL=5
```

## Performance Optimization

- Connection pooling (10 connections, 5 min)
- Database indexes on frequently queried fields
- Response caching via client
- Pagination support (default 50, max 100)
- Lazy calculation of metrics
- Efficient aggregation pipelines

## Monitoring & Logging

All events logged to console:
```
✅ MongoDB connected successfully
🔔 Alert service started - checking every 5 minutes
[2024-12-30T10:00:00Z] Running SLA risk check...
✅ At-risk alert sent for ticket TKT-1234567890
📧 Email sent: <message-id>
```

## Testing Endpoints

Use curl or Postman:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Support Team","email":"team@example.com","password":"SecurePass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"team@example.com","password":"SecurePass123"}'

# Get metrics (use token from login)
curl http://localhost:5000/api/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create ticket
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Login issue","description":"Users cannot login","priority":"P1","assignedTo":"john@example.com"}'
```

## License

MIT

## Support

For issues or questions, create an issue in the GitHub repository.
