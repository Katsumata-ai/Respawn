/**
 * POST /api/webhooks/whop
 * Receives webhooks from Whop for payment events
 *
 * NOTE: Whop handles all user management and membership verification.
 * This webhook is kept for logging purposes but doesn't need to update Supabase.
 * User access is checked via Whop API in checkUserHasPremiumAccess()
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-whop-signature');

    // Verify webhook signature
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (!secret) {
      console.error('WHOP_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Create HMAC signature
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Verify signature matches
    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(body);
    console.log('✅ Whop webhook received:', event.type);

    // Handle payment completed
    if (event.type === 'payment.completed') {
      const { customer_id, product_id, amount } = event.data;
      console.log(`💰 Payment completed for customer: ${customer_id}, amount: ${amount}`);
      // Whop handles membership automatically - no action needed
      return NextResponse.json({ ok: true });
    }

    // Handle payment refunded
    if (event.type === 'payment.refunded') {
      const { customer_id } = event.data;
      console.log(`↩️ Payment refunded for customer: ${customer_id}`);
      // Whop handles membership automatically - no action needed
      return NextResponse.json({ ok: true });
    }

    // Unknown event type
    console.log(`ℹ️ Unknown event type: ${event.type}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

