import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Providers API is running',
    status: 'ok',
    providers: [
      { id: 1, name: 'Memorial Hospital', location: 'New York, NY' },
      { id: 2, name: 'City Medical Center', location: 'Los Angeles, CA' },
      { id: 3, name: 'Regional Heart Institute', location: 'Chicago, IL' }
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Provider request processed',
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
