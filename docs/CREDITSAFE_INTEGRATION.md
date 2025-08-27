# Creditsafe CAS Integration with BankID

This document describes the implementation of Creditsafe CAS (Credit Assessment Service) with BankID authentication for the Nordflytt booking system.

## Overview

The integration provides credit checking functionality for private customers who want to pay by invoice. The system uses BankID for secure authentication and Creditsafe for credit assessment.

## Features

- ✅ BankID authentication for secure identity verification
- ✅ Real-time credit checks via Creditsafe SOAP API
- ✅ Alternative payment options for rejected customers
- ✅ Deposit handling for customers with payment remarks
- ✅ 30-day credit check validity caching
- ✅ GDPR-compliant personal number handling

## Database Schema

### New Tables

1. **credit_checks**
   - Stores credit check results
   - Personal numbers are hashed for security
   - Includes reject codes and alternative payment options
   - 30-day validity period

2. **bankid_authentications**
   - Tracks BankID authentication sessions
   - Stores completion data
   - Session management

### Updated Tables

- **customers**: Added personal_number fields with verification status
- **bookings**: Added credit check reference and payment method fields

## API Endpoints

### `/api/credit-check`
Performs credit check after BankID authentication
- Validates personal number format
- Checks for existing valid credit checks (30-day cache)
- Returns approval/rejection with alternative options

### `/api/bankid`
Handles BankID authentication flow
- `POST` with action: 'auth' - Initiates authentication
- `POST` with action: 'status' - Checks authentication status
- `POST` with action: 'cancel' - Cancels authentication

### `/api/submit-booking-with-credit`
Enhanced booking submission that validates credit checks
- Requires credit check ID for invoice payments
- Handles deposit requirements
- Links credit check to customer record

## Components

### `BankIDAuth`
Handles the BankID authentication flow
- Mobile app integration
- QR code support
- Real-time status updates
- Error handling

### `CreditCheckResult`
Displays credit check results
- Approval/rejection status
- Deposit requirements
- Alternative payment options
- Contact information

### `useCreditCheck` Hook
Manages the credit check state and flow
- Authentication state
- Credit check processing
- Error handling
- Result management

## Integration Flow

1. **Customer selects invoice payment**
   - Only available for private customers
   - Business customers skip credit check

2. **Personal number input**
   - Swedish format validation
   - GDPR consent implied

3. **BankID authentication**
   - Mobile app launch on phones
   - QR code for desktop
   - Real-time status polling

4. **Credit check execution**
   - Uses authenticated personal number
   - Checks cache first (30 days)
   - Performs new check if needed

5. **Result handling**
   - **Approved**: Continue with invoice payment
   - **Rejected**: Show alternatives
     - Deposit payment (5000 kr typical)
     - Direct payment (card/Swish)
     - Contact support

## Reject Codes

| Code | Description | Deposit Required | Amount |
|------|-------------|------------------|--------|
| REJECT_1 | Betalningsanmärkning | Yes | 5000 kr |
| REJECT_2 | För hög skuldsättning | Yes | 5000 kr |
| REJECT_3 | Tidigare betalningsproblem | Yes | 5000 kr |
| REJECT_4 | Otillräcklig kredithistorik | Yes | 3000 kr |
| REJECT_5 | Säkerhetsrisk | No | Prepayment only |

## Configuration

### Environment Variables

```env
# Creditsafe API
CREDITSAFE_ENDPOINT=https://casapi.creditsafe.se/casapi/cas.asmx
CREDITSAFE_USERNAME=your-username
CREDITSAFE_PASSWORD=your-password
CREDITSAFE_TEMPLATE_ID=1

# Supabase (for database)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Sandbox Credentials

For testing in sandbox environment:
- Username: `FLYTTSVETESTIN`
- Password: `Flyttsvetestin123!`

## Security Considerations

1. **Personal Number Handling**
   - Always hash before storage (SHA-256)
   - Mask last 4 digits in logs/UI
   - Never store in plain text

2. **API Security**
   - Use service role for database operations
   - Validate all inputs
   - Rate limit credit checks

3. **Session Management**
   - 5-minute timeout for BankID
   - Clear sessions after completion
   - Prevent replay attacks

## Testing

### Demo Page
Access `/demo-credit-check` to test the integration:

1. **Approved scenario**: Use PN 198502021234
2. **Rejected with deposit**: Use PN 199001011234
3. **Rejected alternatives**: Use PN 197512121234

### Test Flow
1. Enter personal number
2. Complete BankID auth (sandbox mode)
3. View credit check result
4. Test alternative payment options

## Production Deployment

1. **Update credentials**
   - Replace sandbox credentials
   - Configure production BankID certificates
   - Set up payment gateway for deposits

2. **Database migration**
   ```bash
   npm run migrate:production
   ```

3. **Enable monitoring**
   - Track credit check success rates
   - Monitor BankID authentication times
   - Alert on high rejection rates

4. **Compliance**
   - Ensure GDPR compliance documentation
   - Set up data retention policies
   - Configure audit logging

## Troubleshooting

### Common Issues

1. **BankID not launching**
   - Check mobile detection
   - Verify autostarttoken format
   - Test deep link generation

2. **Credit check timeout**
   - Check API credentials
   - Verify network connectivity
   - Review SOAP envelope format

3. **Database errors**
   - Check RLS policies
   - Verify service role key
   - Review migration status

### Debug Mode

Enable debug logging:
```javascript
// In creditsafe/client.ts
console.log('SOAP Request:', envelope);
console.log('SOAP Response:', xmlText);
```

## Future Enhancements

1. **Additional credit providers**
   - UC (Upplysningscentralen)
   - Bisnode
   - Multiple provider fallback

2. **Enhanced risk scoring**
   - ML-based risk assessment
   - Custom scoring models
   - Dynamic deposit amounts

3. **Payment integration**
   - Automatic deposit collection
   - Payment plan options
   - Invoice factoring

## Support

For technical issues:
- Check logs in Supabase dashboard
- Review API response codes
- Contact Creditsafe support for API issues

For business questions:
- Rejection rate analysis
- Deposit amount optimization
- Alternative payment strategies