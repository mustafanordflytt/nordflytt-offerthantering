# Swish Prepayment Implementation

## Overview
This implementation adds Swish prepayment as the only payment option for customers who fail the credit check. The flow ensures that customers who cannot get invoice payment can still book by paying in advance with Swish.

## Key Features

### 1. Credit Check Result Handling
- When a customer fails the credit check, they are only shown the Swish prepayment option
- All other payment alternatives (deposit, guarantor, etc.) are disabled
- Clear messaging explains that prepayment is required

### 2. Swish Payment Component
- **QR Code Generation**: Displays a QR code that can be scanned with the Swish app
- **Manual Payment**: Shows Swish number (1236721476) for manual payment
- **Deep Link**: Opens Swish app directly on mobile devices
- **Payment Tracking**: Polls for payment status every 2 seconds
- **Timeout**: 5-minute timeout with countdown timer
- **Visual Feedback**: Clear status indicators for pending, processing, completed, and failed states

### 3. Order Confirmation
- Shows prepayment status prominently
- Displays Swish transaction ID
- Explains that additional costs will be invoiced after the move
- Different messaging for prepaid vs invoice customers

### 4. Database Updates
- Booking status set to 'confirmed' for prepaid bookings (vs 'pending' for invoice)
- Stores payment_status, swish_payment_id in the bookings table
- Payment method stored as 'swish_prepayment'

### 5. Notification Updates
- Email and SMS templates updated to include prepayment information
- Different messaging for prepaid customers
- Confirmation includes payment details

## Implementation Files

### Components
- `/components/CreditCheckResult.tsx` - Updated to show only Swish for rejected customers
- `/components/SwishPayment.tsx` - New component for Swish payment flow
- `/components/OrderConfirmation.tsx` - New component for order confirmation page

### API Routes
- `/app/api/swish/create-payment/route.ts` - Creates Swish payment request
- `/app/api/swish/payment-status/[id]/route.ts` - Checks payment status

### Updated Files
- `/components/form/Step4SummaryWithCreditCheck.tsx` - Handles Swish payment flow
- `/app/api/submit-booking/route.ts` - Stores prepayment status
- `/types/formData.ts` - Added Swish-related fields
- `/lib/notifications.ts` - Updated to handle prepaid bookings
- `/app/confirmation/page.tsx` - New confirmation page

## User Flow

1. **Credit Check Fails**
   - Customer attempts invoice payment
   - Credit check is rejected
   - Only Swish prepayment option is shown

2. **Swish Payment**
   - Customer clicks "Betala hela beloppet i förväg med Swish"
   - Payment screen shows QR code and payment details
   - Customer completes payment in Swish app
   - System polls for payment confirmation

3. **Payment Confirmed**
   - Payment status updates to completed
   - Booking is automatically submitted with 'prepaid' status
   - Customer sees confirmation page

4. **Confirmation**
   - Shows booking details with prepayment status
   - Explains that any additional costs will be invoiced later
   - Sends confirmation email/SMS with prepayment details

## Testing

To test the implementation:

1. Fill out the booking form as a private customer
2. Choose invoice payment at the summary step
3. Enter a personal number that will fail credit check
4. Verify that only Swish payment is offered
5. Complete the Swish payment flow
6. Check that the confirmation shows prepayment status

## Production Considerations

1. **Swish API Integration**
   - Currently uses mock endpoints for demo
   - In production, integrate with real Swish API
   - Requires merchant agreement and certificates

2. **Payment Reconciliation**
   - Implement webhook for real-time payment confirmation
   - Add payment reconciliation reports
   - Handle failed/cancelled payments

3. **Security**
   - Store sensitive payment data securely
   - Implement proper authentication for payment endpoints
   - Add rate limiting for payment status checks

4. **Error Handling**
   - Handle network errors gracefully
   - Provide fallback payment methods
   - Clear error messages for users

## Configuration

Environment variables needed:
```env
# Swish Configuration (Production)
SWISH_MERCHANT_ID=1233052468
SWISH_CERTIFICATE_PATH=/path/to/cert.pem
SWISH_PRIVATE_KEY_PATH=/path/to/key.pem
SWISH_CALLBACK_URL=https://yourdomain.com/api/swish/callback
```