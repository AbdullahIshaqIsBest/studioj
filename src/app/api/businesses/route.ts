
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessModel, { type IBusiness } from '@/lib/models/BusinessModel';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/businesses:
 *   get:
 *     summary: Retrieve a list of all businesses
 *     description: Fetches all businesses from the database. Passwords are excluded.
 *     responses:
 *       200:
 *         description: A list of businesses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 *       500:
 *         description: Server error
 */
export async function GET() {
  try {
    await dbConnect();
    const businesses = await BusinessModel.find({}).select('-password');
    const plainBusinesses = businesses.map(business => {
      const businessObject = business.toObject({ virtuals: true });
      businessObject.id = businessObject._id.toString();
      delete businessObject._id; 
      delete businessObject.__v; 
      delete businessObject.password; 
      return businessObject;
    });
    return NextResponse.json(plainBusinesses, { status: 200 });
  } catch (error) {
    console.error('SERVER_API_ERROR in GET /api/businesses:', error);
    let detail = 'An unexpected error occurred on the server.';
    if (error instanceof Error) {
        detail = error.message || 'Error message was empty.';
        if (error.stack) {
            console.error('SERVER_API_ERROR_STACK (GET):', error.stack);
        }
    } else if (typeof error === 'string') {
        detail = error;
    } else {
        try {
            detail = JSON.stringify(error);
        } catch (e) {
            detail = 'Failed to stringify server error object.';
        }
    }
    return NextResponse.json({ message: 'Failed to retrieve businesses due to a server issue.', errorDetail: detail }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/businesses:
 *   post:
 *     summary: Create a new business
 *     description: Registers a new business in the database. Password will be hashed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewBusiness'
 *     responses:
 *       201:
 *         description: Business created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *       400:
 *         description: Invalid input or email already exists.
 *       500:
 *         description: Server error.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json() as Omit<IBusiness, 'id' | 'isSponsored' | 'adExpiryDate' | '_id'> & { password: string };

    if (!body.email || !body.name || !body.password || !body.category) {
      return NextResponse.json({ message: 'Missing required fields: email, name, password, category.' }, { status: 400 });
    }

    const existingBusiness = await BusinessModel.findOne({ email: body.email });
    if (existingBusiness) {
      return NextResponse.json({ message: 'A business with this email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newBusinessData: Partial<IBusiness> = {
      ...body,
      password: hashedPassword, // Store the hashed password
      isSponsored: false,
    };

    const business = new BusinessModel(newBusinessData);
    await business.save();

    const businessObject = business.toObject({ virtuals: true });
    businessObject.id = businessObject._id.toString();
    delete businessObject._id;
    delete businessObject.__v;
    delete businessObject.password; // Ensure password is not returned

    return NextResponse.json(businessObject, { status: 201 });
  } catch (error) {
    console.error('SERVER_API_ERROR in POST /api/businesses:', error);
    let detail = 'Failed to create business due to a server issue.';
     if (error instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(error.errors).map(err => err.message);
        detail = messages.join(', ');
        if (error.stack) {
            console.error('SERVER_API_VALIDATION_ERROR_STACK (POST):', error.stack);
        }
        return NextResponse.json({ message: 'Validation failed. Please check your input.', errorDetail: detail }, { status: 400 });
    } else if (error instanceof Error) {
        detail = error.message || 'Error message was empty during POST.';
        if (error.stack) {
            console.error('SERVER_API_ERROR_STACK (POST):', error.stack);
        }
    } else if (typeof error === 'string') {
        detail = error;
    } else {
        try {
            detail = JSON.stringify(error);
        } catch (e) {
            detail = 'Failed to stringify server error object during POST.';
        }
    }
    return NextResponse.json({ message: 'Failed to create business.', errorDetail: detail }, { status: 500 });
  }
}

/**
 * @openapi
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the business.
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         category:
 *           type: string
 *           enum: ["Restaurant & Cafe", "Grocery & Farm Goods", "Bakery & Sweets", "General Store", "Services", "Other"]
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *         isSponsored:
 *           type: boolean
 *         adExpiryDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     NewBusiness:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - address
 *         - city
 *         - category
 *         - phone
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         category:
 *           type: string
 *           enum: ["Restaurant & Cafe", "Grocery & Farm Goods", "Bakery & Sweets", "General Store", "Services", "Other"]
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *           description: Client should send plain password; server handles hashing.
 *         image:
 *           type: string
 *           nullable: true
 */
