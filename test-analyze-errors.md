# Testing Error Handling

## Method 1: Force API Errors
Add this to the top of analyze action (temporarily):

```tsx
// Force different error scenarios for testing
const testMode = new URL(request.url).searchParams.get('test');
if (testMode === 'api-error') {
  return Response.json({ error: "API unavailable" }, { status: 500 });
}
if (testMode === 'empty-response') {
  return Response.json({ error: "Empty response" }, { status: 500 });
}
if (testMode === 'invalid-json') {
  return Response.json({ error: "Invalid JSON" }, { status: 500 });
}
```

## Method 2: Invalid API Key
Set GEMINI_API_KEY to invalid value in .env.local:
```
GEMINI_API_KEY=invalid_key_for_testing
```

## Method 3: Network Issues
Block network requests in browser DevTools:
- Open DevTools → Network tab
- Right-click → Block request URL
- Add: `generativelanguage.googleapis.com`

## Method 4: Malformed Images
Upload non-image files or corrupted images

## Method 5: Rate Limiting
Make many rapid requests to trigger rate limits