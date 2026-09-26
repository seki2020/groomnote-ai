# Architecture and decisions

## Product boundary

The primary task is to document a completed grooming appointment. The groomer selects a fictional pet, speaks or uses the clearly labeled scripted text walkthrough, reviews a draft, edits it, and approves the final record. Historical context is shown as history, never automatically claimed as a new observation. The current demo is public and requires no login.

## Implemented components

| Component | Responsibility | Current state |
| --- | --- | --- |
| React/Vite | Landing page, appointment selection, transcript, editable form, review states | Implemented |
| Cloudflare Worker/Hono | `POST /api/voice-token` exchanges secret for temporary token | Implemented, provider key needed |
| AssemblyAI client | Microphone capture, 24 kHz PCM stream, transcript and reply audio | Integrated, not provider-verified |
| localStorage | Approved notes and demo feedback on one device | Implemented |
| Text walkthrough | Scripted follow-ups and conservative keyword draft | Implemented, explicitly labeled |

## Data flow

1. User chooses one of three fictional appointments. Historical context is visible separately.
2. For voice, the browser requests an ephemeral token from the Worker. The Worker keeps `ASSEMBLYAI_API_KEY` as a secret. The browser requests mic access and streams audio to AssemblyAI.
3. Transcript turns drive a conservative draft. Fields may be blank and require human completion. The groomer edits and approves.
4. Approved records are stored under the appointment ID in browser storage. After reload, the user can reopen them.

## Deployment target

Cloudflare Workers + static assets. Configure `ASSEMBLYAI_API_KEY` only in Worker secrets. `npm run build` produces a Worker/client build. Deployment and voice-provider end-to-end testing are outstanding. The frontend-only `npm run dev` mode intentionally returns a 503 for live voice.

## Next implementation slice

1. Add D1 tables for approved records and feedback with a retention policy, while keeping fictional public demo data isolated.
2. Add a structured extraction service with an explicit source-to-field contract and uncertainty handling. Re-check corrections such as “no nail trim” before approval.
3. Add basic abuse controls to public token issuance before enabling paid voice sessions for anonymous visitors.
4. Verify microphone, WebSocket transcript events, interruption, disconnection, and end-to-end deployment with the actual provider key.
5. Prepare cover image, recorded video, slide deck, public application URL, and final submission text.
