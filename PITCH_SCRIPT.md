# 90-Second Hackathon Pitch Script: Emergency Matchmaker

**Presenter:** Crisis Coordinator & Lead Engineer  
**Duration:** Exactly 90 Seconds  
**Tone:** Confident, concrete, zero buzzwords.  

---

### [00:00 – 00:15] The Problem (Chaos in Crisis Coordination)
> "When a disaster strikes, people don't fill out clean database forms. They send frantic text messages: *'50 meals expiring downtown, need drivers'* or *'tree down blocking the ER entrance'*. Coordinators drown in unformatted text, spreadsheets lock up, and critical hours are lost matching who has the skills and wheels to help."

---

### [00:15 – 00:30] The Insight (AI Parsing + Realtime Matching)
> "We built **Emergency Matchmaker** — a zero-touch coordination engine. Instead of forcing manual data entry, coordinators paste raw dispatch text. Our agent instantly extracts required skills, urgency, and location hints, while PostgreSQL automatically calculates skillset overlap with available local volunteers in real time."

---

### [00:30 – 01:00] Live Demo Narration (What I Click and Say)
> *(Click the input box and select the preset: '50 meals expiring in 2 hours downtown, need drivers' — click 'Dispatch Emergency Request'.)*  
> "Watch this. I paste raw crisis text and hit Dispatch. Boom — in milliseconds, the AI triages it into high urgency, tags the location as Downtown, and identifies the required skills: 'driver' and 'food distribution'.  
> 
> Instantly, without refreshing, Supabase Realtime pushes this card to every connected screen. The system matches and highlights Marcus Vance, an available driver nearby.  
> 
> *(Click 'Volunteer Link', select volunteer profile, and click 'Accept Task'.)*  
> The volunteer receives their dynamic link on mobile, taps 'Accept Task', and the coordinator's screen immediately flips to 'Accepted'. When they finish, they tap 'Mark Complete', and the audit trail logs every state transition with zero coordinator intervention."

---

### [01:00 – 01:15] Tech Flex (Antigravity MCP + Supabase Realtime + Vercel)
> "We shipped this entire stack in minutes:
> - **Antigravity IDE** generated and applied migrations directly to live Postgres with Row Level Security.
> - **Supabase Realtime** handled full-row replication via Postgres WAL pub/sub.
> - **Next.js 14 App Router** with TypeScript interfaces guarantees strict type-safety with zero runtime latency.
> - Deployed in one click to Vercel."

---

### [01:15 – 01:30] Impact (What This Unlocks at Scale)
> "In acute emergencies, response latency isn't just a metric — it's survival. Emergency Matchmaker turns raw human panic into structured, autonomous mobilization. Zero phone trees. Zero spreadsheet bottlenecks. Zero friction. Thank you."
