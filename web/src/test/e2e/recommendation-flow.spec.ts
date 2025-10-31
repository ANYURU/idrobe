import { test, expect } from '@playwright/test'

test.describe('Recommendation Interaction Flow', () => {
  test('user can interact with recommendations and see feedback', async ({ page }) => {
    // Navigate to recommendation page
    await page.goto('/onboarding/first-recommendation')
    
    // Wait for recommendations to load
    await expect(page.locator('[data-testid="recommendation"]')).toBeVisible()
    
    // Click love button
    const loveButton = page.locator('[data-testid="love-button"]')
    await loveButton.click()
    
    // Verify button state changed
    await expect(loveButton).toHaveClass(/bg-green-500/)
    await expect(loveButton).toContainText('Loved!')
    
    // Verify feedback message appears
    await expect(page.locator('text=We\'ll remember you love this style')).toBeVisible()
    
    // Verify navigation dot turns green
    await expect(page.locator('.bg-green-500').first()).toBeVisible()
  })

  test('handles network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/onboarding/first-recommendation')
    
    const loveButton = page.locator('[data-testid="love-button"]')
    await loveButton.click()
    
    // Should show error state or retry mechanism
    await expect(page.locator('text=Failed to save feedback')).toBeVisible()
  })
})