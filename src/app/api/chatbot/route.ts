import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // Simple chatbot response
    const response = {
      message: `You said: "${message}". This is a placeholder response from the healthcare chatbot.`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Healthcare Chatbot API is running',
    status: 'ok'
  });
}
