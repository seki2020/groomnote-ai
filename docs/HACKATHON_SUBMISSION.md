# Hackathon submission tracker

This repository is organized around the ten required submission items. Fill in public links only after the actual assets and deployment exist.

| # | Required item | Status | Where / next action |
| --- | --- | --- | --- |
| 1 | Title | Draft ready | GroomNote AI |
| 2 | Short description | Draft ready | “Turn post-groom conversations into clear, human-approved pet care notes.” |
| 3 | Long description | Draft ready | Narrative below; revise after live voice verification |
| 4 | Technology and category tags | Draft ready | React, TypeScript, Cloudflare Workers, Hono, AssemblyAI; AI, Voice, Small Business, Pet Care |
| 5 | Cover image | Pending | Export a 16:9 product cover with the final UI and brand |
| 6 | Video presentation | Pending | Record problem → live demo → review/save → architecture, then publish URL |
| 7 | Slide presentation | Pending | Publish problem, user, flow, architecture, validation, next steps |
| 8 | Public GitHub repository | Complete | https://github.com/seki2020/groomnote-ai |
| 9 | Demo hosting platform | Planned | Cloudflare Workers for the final voice demo; GitHub Pages for a text-only UI preview |
| 10 | Application URL | Pending | Deploy and verify `/` and `/demo` publicly |

## Draft long description

Small grooming salons often finish an appointment with useful observations in mind, then have little time to type them into a reusable record. GroomNote AI explores a voice-first closeout: the groomer describes the completed service, a short follow-up captures important handling details, and the result becomes an editable, structured note. The groomer reviews and approves every field before saving it. The public demo uses fictional pets and shows historical context separately from today's observations. The interface includes a clearly labeled scripted text walkthrough while live AssemblyAI voice is configured and validated.

## Demo script

1. Select Bella and point out her previous dryer sensitivity as historical context.
2. Describe today's bath and brushing, her observed reaction, and the lower setting that helped. State that nails were **not** trimmed.
3. End the conversation. Review the draft, correct or complete fields, then approve.
4. Reload `/demo` and reopen Bella's saved record.
5. Show the voice connection only after AssemblyAI credentials and end-to-end verification are complete.

## Submission gate

Do not mark the project submitted until the repository is public, the app URL loads independently, the voice path has been tested with the provider, and cover/video/slides are published. Browser-local records and feedback are intentionally called out as prototype limitations.
