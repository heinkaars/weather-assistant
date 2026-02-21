import express from 'express';
import OpenAI from 'openai';

export const recommendationsRouter = express.Router();

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    temperatureUnit: string;
    windSpeed: string;
    shortForecast: string;
    relativeHumidity?: { value: number | null };
  };
  hourly: Array<{
    startTime: string;
    temperature: number;
    windSpeed: string;
    shortForecast: string;
  }>;
}

recommendationsRouter.post('/', async (req, res) => {
  try {
    const { location1, location2, weather1, weather2 } = req.body;

    if (!location1 || !location2 || !weather1 || !weather2) {
      return res.status(400).json({ error: 'Missing required weather comparison data' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add OPENAI_API_KEY to your .env file'
      });
    }

    // Initialize OpenAI client with the API key from environment
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`→ Generating recommendations for ${location1} vs ${location2}`);

    // Build location-aware system prompt that lets AI infer regional expertise
    const systemPrompt = `You are a knowledgeable weather expert providing advice for ${location1} and ${location2}. Use your knowledge of local weather patterns, microclimates, and regional climate to give practical, specific recommendations.`;

    // Get current date, time, and season
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    // Calculate season based on month
    const month = now.getMonth(); // 0-11
    let season = 'winter';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';

    const prompt = `Compare the weather between two locations and provide practical advice.

Current date and time: ${dateString}, ${timeString}
Current season: ${season}

Location 1: ${location1}
- Current: ${weather1.current.temperature}°${weather1.current.temperatureUnit}, ${weather1.current.shortForecast}
- Wind: ${weather1.current.windSpeed}
- Humidity: ${weather1.current.relativeHumidity?.value || 'N/A'}%

Location 2: ${location2}
- Current: ${weather2.current.temperature}°${weather2.current.temperatureUnit}, ${weather2.current.shortForecast}
- Wind: ${weather2.current.windSpeed}
- Humidity: ${weather2.current.relativeHumidity?.value || 'N/A'}%

Provide your response in EXACTLY this format with each section header on its own line:

**Key Weather Differences:**
[Write 2-3 sentences about the main weather differences between the two locations]

**What to Bring or Wear:**
[Write 2-3 sentences about specific items to bring - layers, sunscreen, umbrella, etc.]

**Local Weather Insights:**
[Write 2-3 sentences about local weather patterns, temperature shifts, and regional climate behavior specific to these locations]

IMPORTANT: Each section header MUST be on its own line with nothing else on that line. Keep it conversational, specific to these locations, and focus on actionable advice.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const recommendations = completion.choices[0].message.content;

    console.log(`✓ Generated recommendations`);

    res.json({
      recommendations,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: 'OpenAI API error',
        message: error.message,
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
