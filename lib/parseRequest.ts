import { ParsedCrisisRequest, TaskUrgency } from '@/types/database';

/**
 * Fallback regex and heuristics parser for demo safety and zero-downtime offline capability.
 */
export function fallbackCrisisParser(input: string): ParsedCrisisRequest {
  const lower = input.toLowerCase();

  // 1. Determine Urgency
  let urgency: TaskUrgency = 'medium';
  const highUrgencyPatterns = [
    /\b(expir|expire|expiring)\b/,
    /\b(\d+|two|three|one)\s+(hour|hours|hr|hrs|min|mins|minutes)\b/,
    /\b(asap|stat|immediate|immediately|urgent|urgently|critical|danger|trapped|dying|bleeding|emergency)\b/,
  ];
  const lowUrgencyPatterns = [
    /\b(next week|later|when possible|non-urgent|low priority|no rush|whenever)\b/,
  ];

  if (highUrgencyPatterns.some((pattern) => pattern.test(lower))) {
    urgency = 'high';
  } else if (lowUrgencyPatterns.some((pattern) => pattern.test(lower))) {
    urgency = 'low';
  }

  // 2. Extract Skills Needed
  const skills: string[] = [];
  const skillMappings: { skill: string; regex: RegExp }[] = [
    { skill: 'driver', regex: /\b(driver|drivers|driving|transport|van|truck|deliver|delivery|car)\b/ },
    { skill: 'food distribution', regex: /\b(food|meal|meals|groceries|lunch|dinner|rations|canned|hunger)\b/ },
    { skill: 'first aid', regex: /\b(medic|medical|doctor|nurse|first aid|paramedic|injury|injured|bandage|triage)\b/ },
    { skill: 'heavy lifting', regex: /\b(lifting|heavy|sandbag|sandbags|carry|rubble|debris|haul)\b/ },
    { skill: 'logistics', regex: /\b(logistics|organizer|warehouse|inventory|dispatch|coordinate)\b/ },
    { skill: 'childcare', regex: /\b(child|children|kids|baby|infant|toddler|daycare)\b/ },
    { skill: 'debris clearance', regex: /\b(debris|clearance|clearing|chainsaw|fallen tree|shovel)\b/ },
    { skill: 'spanish translator', regex: /\b(spanish|translator|translation|bilingual|interpreter)\b/ },
  ];

  for (const { skill, regex } of skillMappings) {
    if (regex.test(lower)) {
      skills.push(skill);
    }
  }

  // Fallback to generic logistics if no skill matched
  if (skills.length === 0) {
    skills.push('logistics');
  }

  // 3. Extract Location Hint
  let locationHint = 'Unspecified';
  const locationMatches = [
    /\b(?:in|at|near|around|to)\s+([A-Za-z0-9\s]+?)(?:,|\.|\bneed|\burgent|$)/i,
    /\b(downtown|midtown|uptown|north district|south district|east side|west end)\b/i,
  ];

  for (const pattern of locationMatches) {
    const match = input.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted.length > 2 && extracted.length < 50) {
        locationHint = extracted;
        break;
      }
    }
  }

  if (locationHint === 'Unspecified' && lower.includes('downtown')) {
    locationHint = 'Downtown';
  }

  // 4. Generate Summary
  const summary = input.length > 80 ? input.slice(0, 77) + '...' : input;

  return {
    skills_needed: Array.from(new Set(skills)),
    urgency,
    location_hint: locationHint,
    summary,
  };
}

/**
 * Parses natural-language crisis request into structured task attributes.
 * Uses OpenAI gpt-4o-mini with strict JSON schema via server-side fetch.
 * Seamlessly falls back to regex parser if LLM call fails or key is invalid.
 */
export async function parseCrisisRequest(input: string): Promise<ParsedCrisisRequest> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      skills_needed: ['logistics'],
      urgency: 'low',
      location_hint: 'Unspecified',
      summary: 'Empty request',
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[parseCrisisRequest] OPENAI_API_KEY not found. Using fallback regex parser.');
    return fallbackCrisisParser(trimmed);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a 911 / crisis triage intelligence agent. Parse the emergency dispatch request into pure JSON matching this exact schema: {"skills_needed": string[], "urgency": "low"|"medium"|"high", "location_hint": string, "summary": string}. Available skills: driver, food distribution, first aid, heavy lifting, logistics, childcare, debris clearance, spanish translator. Choose all relevant skills. Urgency must be high if expiring soon or lives/injuries at risk.',
          },
          {
            role: 'user',
            content: trimmed,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.warn(`[parseCrisisRequest] OpenAI API responded with status ${response.status}. Using fallback parser.`);
      return fallbackCrisisParser(trimmed);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackCrisisParser(trimmed);
    }

    const parsed = JSON.parse(content) as {
      skills_needed?: string[];
      urgency?: string;
      location_hint?: string;
      summary?: string;
    };

    const validUrgency: TaskUrgency =
      parsed.urgency === 'high' || parsed.urgency === 'low' || parsed.urgency === 'medium'
        ? parsed.urgency
        : 'medium';

    return {
      skills_needed: Array.isArray(parsed.skills_needed) && parsed.skills_needed.length > 0
        ? parsed.skills_needed.map((s) => s.toLowerCase().trim())
        : ['logistics'],
      urgency: validUrgency,
      location_hint: parsed.location_hint?.trim() || 'Downtown',
      summary: parsed.summary?.trim() || trimmed.slice(0, 80),
    };
  } catch (error) {
    console.error('[parseCrisisRequest] Error invoking AI parser. Falling back to regex parser:', error);
    return fallbackCrisisParser(trimmed);
  }
}
