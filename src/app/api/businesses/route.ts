
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
    console.error('SERVER_API_ERROR in GET /api/businesses:', error);
    let detail = 'An unexpected error occurred on the server.';
    if (error instanceof Error) {
        detail = error.message || 'Error message was empty.';
        if (error.stack) {
            console.error('SERVER_API_ERROR_STACK:', error.stack);
        }
    } else if (typeof error === 'string') {
        detail = error;
    } else {
        try {
            // Attempt to stringify non-Error objects for more context
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

    if (!body.email || !body.name || !body.password || !body.category) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingBusiness = await BusinessModel.findOne({ email: body.email });
    if (existingBusiness) {
      return NextResponse.json({ message: 'A business with this email already exists' }, { status: 400 });
    }

    // TODO: Implement password hashing here before saving
    // Example: const hashedPassword = await bcrypt.hash(body.password, 10);
    // Then save hashedPassword instead of body.password

    const newBusinessData: Partial<IBusiness> = {
      ...body,
      isSponsored: false, 
    };

    const business = new BusinessModel(newBusinessData);
    await business.save();
    
    const businessObject = business.toObject({ virtuals: true });
    businessObject.id = businessObject._id.toString();
    delete businessObject._id;
    delete businessObject.__v;

    return NextResponse.json(businessObject, { status: 201 });
  } catch (error) {
    console.error('SERVER_API_ERROR in POST /api/businesses:', error);
    let detail = 'Failed to create business due to a server issue.';
     if (error instanceof Error) {
        detail = error.message || 'Error message was empty during POST.';
         // @ts-ignore
        if (error.name === 'ValidationError') {
            // @ts-ignore
            const messages = Object.values(error.errors).map(err => (err as any).message);
            return NextResponse.json({ message: 'Validation failed', errorDetail: messages.join(', ') }, { status: 400 });
        }
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
 *         image:
 *           type: string
 *           nullable: true
 */
