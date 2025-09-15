export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.FLASK_API_BASE}/api/content/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        type: 'description'
      }),
    });

    if (!response.ok) {
      return Response.json({ error: 'Failed to generate description' }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Description generation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}