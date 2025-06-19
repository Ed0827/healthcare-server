import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  return NextResponse.json({
    message: 'Provider details retrieved',
    status: 'ok',
    data: {
      id,
      name: `Provider ${id}`,
      location: 'Sample Location',
      services: ['MRI', 'CT Scan', 'Blood Test']
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Provider updated',
      data: { id, ...body },
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
