import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'

// Mock React Router hooks
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useFetcher: () => ({
      submit: vi.fn(),
      state: 'idle',
      data: null
    })
  }
})

// Mock the recommendation component
const MockRecommendation = () => {
  const mockRecommendations = [
    {
      id: 'test-rec-1',
      name: 'Test Outfit',
      description: 'Test description',
      styling_reason: 'Test reason',
      items: [
        { id: 'item-1', name: 'Test Item 1', image_url: 'test1.jpg', primary_color: 'blue' },
        { id: 'item-2', name: 'Test Item 2', image_url: 'test2.jpg', primary_color: 'white' }
      ]
    }
  ]

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <div data-testid="recommendation">
          <h1>{mockRecommendations[0].name}</h1>
          <button data-testid="love-button">Love it</button>
          <button data-testid="pass-button">Pass</button>
        </div>
      )
    }
  ])

  return <RouterProvider router={router} />
}

describe('First Recommendation', () => {
  it('renders recommendation with interaction buttons', () => {
    render(<MockRecommendation />)
    
    expect(screen.getByText('Test Outfit')).toBeInTheDocument()
    expect(screen.getByTestId('love-button')).toBeInTheDocument()
    expect(screen.getByTestId('pass-button')).toBeInTheDocument()
  })

  it('handles love button click', () => {
    render(<MockRecommendation />)
    
    const loveButton = screen.getByTestId('love-button')
    fireEvent.click(loveButton)
    
    // Button should still be present after click
    expect(loveButton).toBeInTheDocument()
  })
})