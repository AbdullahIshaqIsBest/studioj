
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProductModel, { type IProduct } from '@/lib/models/ProductModel';
import BusinessModel from '@/lib/models/BusinessModel'; // To validate businessId

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve products, optionally filtered by business ID
 *     description: Fetches products. If a businessId query parameter is provided, it fetches products for that specific business. Otherwise, it fetches all products.
 *     parameters:
 *       - in: query
 *         name: businessId
 *         schema:
 *           type: string
 *         required: false
 *         description: The ID of the business to fetch products for.
 *     responses:
 *       200:
 *         description: A list of products.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product' // Assuming you'll define Product schema in OpenAPI spec
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    let query = {};
    if (businessId) {
      query = { businessId: businessId };
    }

    const products = await ProductModel.find(query).populate('businessId', 'name'); // Optional: populate business name
    
    // Convert Mongoose documents to plain objects and ensure 'id' virtual is present
    const plainProducts = products.map(product => {
      const productObject = product.toObject({ virtuals: true });
      // 'id' is already handled by virtual. Ensure _id and __v are removed if not desired.
      delete productObject._id;
      delete productObject.__v;
      // If businessId was populated as an object, convert its _id to id string
      if (productObject.businessId && typeof productObject.businessId === 'object' && productObject.businessId._id) {
        productObject.businessId = (productObject.businessId as any)._id.toString();
      } else if (productObject.businessId) {
         productObject.businessId = productObject.businessId.toString();
      }
      return productObject;
    });

    return NextResponse.json(plainProducts, { status: 200 });
  } catch (error) {
    console.error('SERVER_API_ERROR in GET /api/products:', error);
    let detail = 'An unexpected error occurred on the server while fetching products.';
     if (error instanceof Error) {
        detail = error.message || 'Error message was empty.';
    } else if (typeof error === 'string') {
        detail = error;
    }
    return NextResponse.json({ message: 'Failed to retrieve products.', errorDetail: detail }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Adds a new product to the database, associated with a business.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewProduct' // Assuming you'll define NewProduct schema
 *     responses:
 *       201:
 *         description: Product created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input or business not found.
 *       500:
 *         description: Server error.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    // The body type should match Omit<Product, 'id'> from AppContext
    // but since IProduct is the DB model, we'll cast carefully.
    const body = await request.json() as Omit<IProduct, '_id' | 'id' | 'createdAt' | 'updatedAt'> & { businessId: string };


    if (!body.name || !body.category || typeof body.price !== 'number' || !body.description || !body.businessId) {
      return NextResponse.json({ message: 'Missing required product fields: name, category, price, description, businessId' }, { status: 400 });
    }
    
    // Validate businessId
    const businessExists = await BusinessModel.findById(body.businessId);
    if (!businessExists) {
        return NextResponse.json({ message: `Business with ID ${body.businessId} not found.` }, { status: 400 });
    }
    
    const productData: Partial<IProduct> = {
        ...body,
        businessId: new mongoose.Types.ObjectId(body.businessId), // Ensure businessId is ObjectId
        salePrice: body.salePrice && body.salePrice > 0 ? body.salePrice : undefined,
    };

    const product = new ProductModel(productData);
    await product.save();
    
    const productObject = product.toObject({ virtuals: true });
    delete productObject._id;
    delete productObject.__v;
    if (productObject.businessId) { // businessId will be an ObjectId here from the saved document
        productObject.businessId = productObject.businessId.toString();
    }


    return NextResponse.json(productObject, { status: 201 });
  } catch (error) {
    console.error('SERVER_API_ERROR in POST /api/products:', error);
    let detail = 'Failed to create product due to a server issue.';
     if (error instanceof Error) {
        detail = error.message || 'Error message was empty.';
        // @ts-ignore
        if (error.name === 'ValidationError') {
            // @ts-ignore
            const messages = Object.values(error.errors).map(err => (err as any).message);
            return NextResponse.json({ message: 'Validation failed', errorDetail: messages.join(', ') }, { status: 400 });
        }
    } else if (typeof error === 'string') {
        detail = error;
    }
    return NextResponse.json({ message: 'Failed to create product.', errorDetail: detail }, { status: 500 });
  }
}

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         businessId:
 *           type: string 
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         price:
 *           type: number
 *         salePrice:
 *           type: number
 *           nullable: true
 *         description:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     NewProduct: # Example, align with your frontend Product type (Omit<Product, 'id'>)
 *       type: object
 *       required:
 *         - businessId
 *         - name
 *         - category
 *         - price
 *         - description
 *       properties:
 *         businessId:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         price:
 *           type: number
 *         salePrice:
 *           type: number
 *           nullable: true
 *         description:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 */
