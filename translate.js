exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { sourceText, sourceLang, targetLang } = JSON.parse(event.body);

    // Validate input
    if (!sourceText || !targetLang) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Language names mapping
    const languages = {
      'auto': 'Auto-detect',
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese (Simplified)',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'pl': 'Polish',
      'tr': 'Turkish'
    };

    // Create the prompt
    const prompt = sourceLang === 'auto' 
      ? `Translate each of the following lines to ${languages[targetLang]}. Maintain the exact same number of lines. Each translated line should correspond to the source line. Do not add any explanations, numbering, or extra text. Only provide the translations, one per line:\n\n${sourceText}`
      : `Translate each of the following lines from ${languages[sourceLang]} to ${languages[targetLang]}. Maintain the exact same number of lines. Each translated line should correspond to the source line. Do not add any explanations, numbering, or extra text. Only provide the translations, one per line:\n\n${sourceText}`;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const data = await response.json();

    // Check for API errors
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Translation service error', details: data })
      };
    }

    // Extract translation
    const translation = data.content[0].text.trim();

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ translation })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};