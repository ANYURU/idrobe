interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
}

export async function getWeatherForUser(city: string, country: string): Promise<WeatherData | null> {
  if (!city || !country) {
    return null;
  }
  
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return {
      condition: 'mild',
      temperature: 20,
      description: 'pleasant weather'
    };
  }
  
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${apiKey}&units=metric`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'iDrobe-App/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      condition: mapWeatherCondition(data.weather[0].main.toLowerCase()),
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description
    };
  } catch (error) {
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
