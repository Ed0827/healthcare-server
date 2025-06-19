import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'MRF Generate API is running',
    status: 'ok',
    data: {
      mrfStatus: 'ready',
      lastGenerated: new Date().toISOString()
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'MRF generation completed',
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
