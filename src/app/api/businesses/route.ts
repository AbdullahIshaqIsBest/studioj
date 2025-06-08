import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessModel, { type IBusiness } from '@/lib/models/BusinessModel';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();

    const businesses = await BusinessModel.find({}).select('-password');

    const plainBusinesses = businesses.map((business) => {
      const obj = business.toObject({ virtuals: true });
      return {
        ...obj,
        id: obj._id.toString(),
      };
    });

    return NextResponse.json(plainBusinesses, { status: 200 });
  } catch (error) {
    console.error('GET /api/businesses error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch businesses.', error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    const requiredFields = ['name', 'email', 'password', 'description', 'address', 'city', 'category', 'phone'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ message: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const existing = await BusinessModel.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ message: 'Email already in use.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newBusiness = new BusinessModel({
      ...body,
      password: hashedPassword,
      isSponsored: false,
    });

    await newBusiness.save();

    const businessObj = newBusiness.toObject({ virtuals: true });
    delete businessObj.password;
    return NextResponse.json({ ...businessObj, id: businessObj._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('POST /api/businesses error:', error);
    return NextResponse.json(
      { message: 'Failed to register business.', error: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
