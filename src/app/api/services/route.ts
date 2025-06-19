import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Services API is running',
    status: 'ok',
    services: [
      { id: 1, name: 'MRI', category: 'Imaging' },
      { id: 2, name: 'CT Scan', category: 'Imaging' },
      { id: 3, name: 'Blood Test', category: 'Laboratory' }
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Service request processed',
      data: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
