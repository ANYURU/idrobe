import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Gemini API
  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', () => {
    return HttpResponse.json({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              recommendations: [
                {
                  id: 'msw-rec-1',
                  name: 'Casual Weekend Look',
                  description: 'Perfect for a relaxed day out',
                  styling_reason: 'The colors complement each other beautifully and create a balanced, comfortable outfit.',
                  items: [
                    { id: 'item-1', name: 'White Polo', image_url: 'test-image-1.jpg', primary_color: 'white' },
                    { id: 'item-2', name: 'Navy Joggers', image_url: 'test-image-2.jpg', primary_color: 'navy' }
                  ]
                },
                {
                  id: 'msw-rec-2',
                  name: 'Athletic Style',
                  description: 'Great for workouts or casual wear',
                  styling_reason: 'This combination is perfect for active days while maintaining style.',
                  items: [
                    { id: 'item-3', name: 'Basketball Jersey', image_url: 'test-image-3.jpg', primary_color: 'blue' },
                    { id: 'item-4', name: 'Athletic Shorts', image_url: 'test-image-4.jpg', primary_color: 'black' }
                  ]
                }
              ]
            })
          }]
        }
      }]
    })
  }),
]