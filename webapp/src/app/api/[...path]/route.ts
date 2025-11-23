import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const url = `${BACKEND_URL}/api/v1/${path}${request.nextUrl.search}`;

  const headers = new Headers();

  // Forward auth header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers.set('authorization', authHeader);
  }

  // Forward content-type for POST/PUT/PATCH
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Forward body for non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = await request.text();
  }

  try {
    console.log(`[API Proxy] ${request.method} ${url}`);
    const response = await fetch(url, fetchOptions);
    console.log(`[API Proxy] Response: ${response.status}`);

    // Handle 204 No Content properly - don't try to read body
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    console.error('[API Proxy] BACKEND_URL:', BACKEND_URL);
    return NextResponse.json(
      { error: 'Backend unavailable', backend: BACKEND_URL },
      { status: 502 }
    );
  }
}
