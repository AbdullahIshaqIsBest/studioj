
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessModel, { type IBusiness } from '@/lib/models/BusinessModel';

/**
 * @swagger
 * /api/businesses:
 *   get:
 *     summary: Retrieve a list of all businesses
 *     description: Fetches all businesses from the database.
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
    const businesses = await BusinessModel.find({});
    // Convert Mongoose documents to plain objects and map _id to id
    const plainBusinesses = businesses.map(business => {
      const businessObject = business.toObject({ virtuals: true });
      businessObject.id = businessObject._id.toString();
      delete businessObject._id; // remove _id
      delete businessObject.__v; // remove __v
      return businessObject;
    });
    return NextResponse.json(plainBusinesses, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch businesses:', error);
    return NextResponse.json({ message: 'Failed to fetch businesses', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/businesses:
 *   post:
 *     summary: Create a new business
 *     description: Registers a new business in the database.
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
    const body = await request.json() as Omit<IBusiness, 'id' | 'isSponsored' | 'adExpiryDate' | '_id'>;

    // Basic validation (more robust validation should be implemented)
    if (!body.email || !body.name || !body.password || !body.category) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const existingBusiness = await BusinessModel.findOne({ email: body.email });
    if (existingBusiness) {
      return NextResponse.json({ message: 'A business with this email already exists' }, { status: 400 });
    }

    // TODO: Add password hashing here before saving
    // For now, saving password as is, which is not secure for production.
    // Example: const hashedPassword = await bcrypt.hash(body.password, 10);
    // Then save hashedPassword instead of body.password

    const newBusinessData: Partial<IBusiness> = {
      ...body,
      isSponsored: false, // Default value
      // adExpiryDate can be omitted or set if needed
    };

    const business = new BusinessModel(newBusinessData);
    await business.save();
    
    const businessObject = business.toObject({ virtuals: true });
    businessObject.id = businessObject._id.toString();
    delete businessObject._id;
    delete businessObject.__v;

    return NextResponse.json(businessObject, { status: 201 });
  } catch (error) {
    console.error('Failed to create business:', error);
    let errorMessage = 'Failed to create business';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // @ts-ignore
    if (error.name === 'ValidationError') {
       // @ts-ignore
      const messages = Object.values(error.errors).map(err => (err as any).message);
      return NextResponse.json({ message: 'Validation failed', errors: messages }, { status: 400 });
    }
    return NextResponse.json({ message: errorMessage, error: (error as Error).toString() }, { status: 500 });
  }
}

// Define a schema for Swagger documentation if you plan to use it
// This is just an example, you'd typically put this in a shared location or generate it

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
 *         image:
 *           type: string
 *           nullable: true
 */

    