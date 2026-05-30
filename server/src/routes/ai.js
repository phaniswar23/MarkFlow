const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the server .env file. Please check the server setup instructions.'
    });
  }

  const { contents, systemInstruction } = req.body;

  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: 'Invalid chat contents provided.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.2
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error details:', errText);
      try {
        const errJSON = JSON.parse(errText);
        return res.status(response.status).json({
          error: errJSON.error?.message || 'Failed to communicate with Gemini API.'
        });
      } catch (e) {
        return res.status(response.status).json({
          error: 'Failed to communicate with Gemini API. Please verify your GEMINI_API_KEY.'
        });
      }
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server AI Chat Error:', error);
    res.status(500).json({ error: 'Internal Server Error during AI Chat process.' });
  }
});

module.exports = router;
