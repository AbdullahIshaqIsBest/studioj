
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessModel from '@/lib/models/BusinessModel';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a business user
 *     description: Logs in a business user by verifying email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful. Returns business details (excluding password).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business' # Business schema without password
 *       400:
 *         description: Missing email or password.
 *       401:
 *         description: Invalid email or password.
 *       500:
 *         description: Server error.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Fetch the business by email. Crucially, DO NOT use .select('-password') here
    // as we need the password for comparison.
    const business = await BusinessModel.findOne({ email: email });

    if (!business) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // TODO: Implement secure password comparison (e.g., bcrypt.compare)
    // This is a DIRECT comparison and is INSECURE for production.
    // Stored passwords should be hashed.
    const isPasswordMatch = business.password === password;

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // Prepare user object to return, excluding password
    const businessObject = business.toObject({ virtuals: true });
    businessObject.id = businessObject._id.toString();
    delete businessObject._id;
    delete businessObject.__v;
    delete businessObject.password; // Ensure password is not returned

    return NextResponse.json(businessObject, { status: 200 });

  } catch (error) {
    console.error('SERVER_API_ERROR in POST /api/auth/login:', error);
    let detail = 'An unexpected error occurred during login.';
    if (error instanceof Error) {
        detail = error.message || 'Error message was empty.';
        if (error.stack) {
            console.error('SERVER_API_ERROR_STACK (LOGIN_POST):', error.stack);
        }
    } else if (typeof error === 'string') {
        detail = error;
    } else {
        try {
            detail = JSON.stringify(error);
        } catch (e) {
            detail = 'Failed to stringify server error object during login POST.';
        }
    }
    return NextResponse.json({ message: 'Login failed due to a server issue.', errorDetail: detail }, { status: 500 });
  }
}
