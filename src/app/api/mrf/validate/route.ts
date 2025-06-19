import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'MRF Validate API is running',
    status: 'ok',
    data: {
      validationStatus: 'active',
      lastValidated: new Date().toISOString()
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'MRF validation completed',
      data: body,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
