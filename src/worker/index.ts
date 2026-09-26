import { Hono } from 'hono'

type Env = { ASSEMBLYAI_API_KEY?: string }
const app = new Hono<{ Bindings: Env }>()

app.post('/api/voice-token', async (context) => {
  // The endpoint is called by the same-origin demo. Reject cross-site requests
  // before exchanging provider credentials for a billable session token.
  const origin = context.req.header('Origin')
  if (!origin || origin !== new URL(context.req.url).origin) {
    return context.json({ error: 'Voice tokens can only be requested from this demo.' }, 403)
  }
  const key = context.env.ASSEMBLYAI_API_KEY
  if (!key) return context.json({ error: 'Live voice is not configured yet. Try the text walkthrough.' }, 503)
  try {
    const response = await fetch('https://agents.assemblyai.com/v1/token?expires_in_seconds=60&max_session_duration_seconds=300', {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!response.ok) return context.json({ error: 'Could not connect to the voice provider. Try again later.' }, 502)
    const result = await response.json() as { token?: string }
    if (!result.token) return context.json({ error: 'The voice provider did not return a session token.' }, 502)
    return context.json({ token: result.token })
  } catch {
    return context.json({ error: 'Voice service is temporarily unavailable.' }, 502)
  }
})

export default app
