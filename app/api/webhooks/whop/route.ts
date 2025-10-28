/**
 * POST /api/webhooks/whop
 * Receives webhooks from Whop for payment events
 *
 * Webhook events:
 * - payment.completed: User paid €10
 * - payment.refunded: Payment was refunded
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { UserLimitsService } from '@/app/services/user-limits.service';
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
    console.log('Whop webhook event:', event.type);

    const supabase = getSupabaseClient();

    // Handle payment completed
    if (event.type === 'payment.completed') {
      const { customer_id, product_id, amount } = event.data;

      console.log(`Processing payment for customer: ${customer_id}`);

      // Find existing user
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('whop_user_id', customer_id)
        .single();

      let userId: string;

      if (findError && findError.code === 'PGRST116') {
        // User doesn't exist, create new one
        console.log(`Creating new user for customer: ${customer_id}`);

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            whop_user_id: customer_id,
            has_paid: true,
            payment_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
          );
        }

        userId = newUser.id;
      } else if (findError) {
        console.error('Error finding user:', findError);
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        );
      } else {
        userId = existingUser.id;

        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            has_paid: true,
            payment_date: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user:', updateError);
          return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
          );
        }
      }

      // Set unlimited access
      const limits = await UserLimitsService.setUnlimitedAccess(userId);
      if (!limits) {
        console.error('Failed to set unlimited access');
        return NextResponse.json(
          { error: 'Failed to set unlimited access' },
          { status: 500 }
        );
      }

      console.log(`✅ Payment processed successfully for user: ${userId}`);
      return NextResponse.json({ ok: true, userId });
    }

    // Handle payment refunded
    if (event.type === 'payment.refunded') {
      const { customer_id } = event.data;

      console.log(`Processing refund for customer: ${customer_id}`);

      // Find user
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('whop_user_id', customer_id)
        .single();

      if (findError) {
        console.error('Error finding user for refund:', findError);
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        );
      }

      // Reset payment status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          has_paid: false,
          payment_date: null,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user for refund:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }

      // Reset limits to default
      const { error: limitsError } = await supabase
        .from('user_limits')
        .update({
          cloud_uploads_limit: 1,
          local_downloads_limit: 1,
        })
        .eq('user_id', user.id);

      if (limitsError) {
        console.error('Error resetting limits:', limitsError);
        return NextResponse.json(
          { error: 'Failed to reset limits' },
          { status: 500 }
        );
      }

      console.log(`✅ Refund processed successfully for user: ${user.id}`);
      return NextResponse.json({ ok: true, userId: user.id });
    }

    // Unknown event type
    console.log(`Unknown event type: ${event.type}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

