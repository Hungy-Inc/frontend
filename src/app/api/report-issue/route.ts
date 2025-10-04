import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, email, organization, subject, description, priority, category, type, to } = body;
    
    if (!name || !email || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, subject, description' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare the email data for the existing backend contact API
    const emailData = {
      name: name.trim(),
      email: email.trim(),
      type: 'issue_report',
      description: `
Issue Report Details:
====================

Name: ${name.trim()}
Email: ${email.trim()}
Organization: ${organization || 'Not specified'}
Category: ${category || 'bug'}
Priority: ${priority || 'medium'}
Subject: ${subject.trim()}

Description:
${description.trim()}

---
This report was submitted through the Hungy Dashboard Report Issue feature.
Timestamp: ${new Date().toISOString()}
      `.trim()
    };

    // Forward the request to the backend contact endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to submit issue report' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Issue report submitted successfully'
    });
  } catch (error) {
    console.error('Report Issue API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
