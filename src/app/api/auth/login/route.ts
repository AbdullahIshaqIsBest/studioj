
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessModel from '@/lib/models/BusinessModel';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a business user
 *     description: Logs in a business user by verifying email and comparing hashed password.
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
 *               $ref: '#/components/schemas/Business' 
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

    const business = await BusinessModel.findOne({ email: email }).select('+password'); // Explicitly select password for comparison

    if (!business || !business.password) { // business.password check handles cases where password might not be set (though schema requires it)
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const isPasswordMatch = await bcrypt.compare(password, business.password);

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const businessObject = business.toObject({ virtuals: true });
    businessObject.id = businessObject._id.toString();
    delete businessObject._id;
    delete businessObject.__v;
    delete businessObject.password; 

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
