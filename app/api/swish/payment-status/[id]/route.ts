import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;

    // In production, this would check with Swish API
    // const swishResponse = await fetch(`https://mss.cpc.getswish.net/swish-cpcapi/api/v1/paymentrequests/${paymentId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SWISH_ACCESS_TOKEN}`
    //   }
    // });

    // For demo, simulate payment status
    // Randomly complete payment after a few checks (to simulate user paying)
    const randomComplete = Math.random() > 0.7;
    
    // Mock status progression
    const mockStatus = randomComplete ? 'PAID' : 'CREATED';

    return NextResponse.json({
      paymentId,
      status: mockStatus,
      amount: 3630, // Mock amount
      payeePaymentReference: 'NF2024001',
      payerAlias: '0701234567',
      paymentReference: paymentId,
      dateCreated: new Date().toISOString(),
      datePaid: mockStatus === 'PAID' ? new Date().toISOString() : null
    });

  } catch (error) {
    console.error('Swish status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}