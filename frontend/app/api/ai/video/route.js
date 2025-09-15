export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.FLASK_API_BASE}/api/videos/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return Response.json({ error: 'Failed to generate video' }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Video generation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}