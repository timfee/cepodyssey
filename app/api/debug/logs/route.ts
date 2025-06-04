import { NextResponse } from 'next/server';

const logs: unknown[] = [];

export async function POST(request: Request) {
  try {
    const logEntry = await request.json();
    logs.push(logEntry);
    return NextResponse.json({ message: 'Log received' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(logs);
}
