import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  return NextResponse.json({
    message: 'Provider pricing retrieved',
    status: 'ok',
    data: {
      providerId: id,
      pricing: [
        { service: 'MRI', price: 850, insuranceRate: 650 },
        { service: 'CT Scan', price: 1200, insuranceRate: 950 },
        { service: 'Blood Test', price: 150, insuranceRate: 120 }
      ]
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Pricing updated',
      data: { providerId: id, ...body },
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
