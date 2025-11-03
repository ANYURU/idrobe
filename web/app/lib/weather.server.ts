interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
}

export async function getWeatherForUser(city: string, country: string, request: Request): Promise<WeatherData | null> {
  console.log('🌤️ Weather request:', { city, country });
  
  if (!city || !country) {
    console.log('❌ Missing city or country');
    return null;
  }
  
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.log('❌ Missing OPENWEATHER_API_KEY');
      return null;
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${apiKey}&units=metric`;
    console.log('🌐 Fetching weather from:', url.replace(apiKey, 'HIDDEN'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('❌ Weather API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Weather data:', data);
    
    const result = {
      condition: mapWeatherCondition(data.weather[0].main.toLowerCase()),
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description
    };
    
    console.log('🌤️ Processed weather:', result);
    return result;
  } catch (error) {
    console.log('❌ Weather fetch error:', error);
    return null;
  }
}

function mapWeatherCondition(condition: string): string {
  const mapping: Record<string, string> = {
    'clear': 'sunny',
    'clouds': 'cloudy',
    'rain': 'rainy',
    'snow': 'snowy',
    'thunderstorm': 'stormy',
    'drizzle': 'rainy',
    'mist': 'foggy',
    'fog': 'foggy'
  };
  
  return mapping[condition] || 'mild';
}