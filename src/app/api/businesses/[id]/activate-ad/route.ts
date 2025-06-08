
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessModel from '@/lib/models/BusinessModel';
import { activateAdSubscription, type ActivateAdSubscriptionInput, type ActivateAdSubscriptionOutput } from '@/ai/flows/activate-ad-subscription';
import mongoose from 'mongoose';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const businessId = params.id;

  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    return NextResponse.json({ message: 'Invalid business ID format.' }, { status: 400 });
  }

  try {
    const { code } = await request.json() as { code: string };

    if (!code) {
      return NextResponse.json({ message: 'Activation code is required.' }, { status: 400 });
    }

    await dbConnect();

    // 1. Call the Genkit flow to validate the code
    const genkitInput: ActivateAdSubscriptionInput = { code };
    const genkitResult: ActivateAdSubscriptionOutput = await activateAdSubscription(genkitInput);

    if (!genkitResult.success) {
      return NextResponse.json({ message: genkitResult.message || 'Invalid activation code provided by Genkit flow.' }, { status: 400 });
    }

    // 2. If code is valid, find and update the business
    const business = await BusinessModel.findById(businessId);

    if (!business) {
      return NextResponse.json({ message: 'Business not found.' }, { status: 404 });
    }

    business.isSponsored = true;
    const now = new Date();
    // Set expiry to 1 month from now
    business.adExpiryDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());


    await business.save();

    const businessObject = business.toObject({ virtuals: true });
    businessObject.id = businessObject._id.toString();
    delete businessObject._id;
    delete businessObject.__v;
    delete businessObject.password; 

    return NextResponse.json(businessObject, { status: 200 });

  } catch (error) {
    console.error(`SERVER_API_ERROR in POST /api/businesses/${businessId}/activate-ad:`, error);
    let detail = 'An unexpected error occurred during ad activation.';
    if (error instanceof Error) {
        detail = error.message || 'Error message was empty.';
        if (error.stack) {
            console.error('SERVER_API_ERROR_STACK (ACTIVATE_AD_POST):', error.stack);
        }
    } else if (typeof error === 'string') {
        detail = error;
    }
    return NextResponse.json({ message: 'Ad activation failed due to a server issue.', errorDetail: detail }, { status: 500 });
  }
}
