import { NextResponse } from "next/server";
import { truncateRelationshipSummary } from "@/lib/aiSummarize";
import { formatIsoDateTimeDDMMYYYY } from "@/lib/dates";

const GEMINI_MODEL = "gemini-2.5-flash";

type EncounterInput = {
  conferenceName?: string;
  createdAt: string;
  encounteredBy?: string;
  notes?: string;
  company: string;
  icpEstimate?: number;
};

type RequestBody = {
  contact: {
    canonicalName: string;
    canonicalCompany?: string;
    email?: string;
    linkedInUrl?: string;
  };
  encounters: EncounterInput[];
};

function formatEncounters(encounters: EncounterInput[]): string {
  return encounters
    .map((e, i) => {
      const where = e.conferenceName ?? "No conference linked";
      const lines = [
        `${i + 1}. ${where} (${formatIsoDateTimeDDMMYYYY(e.createdAt)})`,
        `   Company at encounter: ${e.company || "—"}`,
      ];
      if (e.encounteredBy) lines.push(`   Met by: ${e.encounteredBy}`);
      if (e.icpEstimate !== undefined) {
        lines.push(`   ICP est.: ${e.icpEstimate}/100`);
      }
      if (e.notes?.trim()) lines.push(`   Notes: ${e.notes.trim()}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export async function POST(request: Request) {
  const apiKey =
    request.headers.get("x-gemini-api-key")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key missing. Add it in Settings." },
      { status: 401 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
    if (!body.contact?.canonicalName || !Array.isArray(body.encounters)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.encounters.length === 0) {
    return NextResponse.json(
      { error: "No encounters to summarize." },
      { status: 400 },
    );
  }

  const { contact, encounters } = body;
  const contactLines = [
    `Name: ${contact.canonicalName}`,
    contact.canonicalCompany ? `Company: ${contact.canonicalCompany}` : null,
    contact.email ? `Email: ${contact.email}` : null,
    contact.linkedInUrl ? `LinkedIn: ${contact.linkedInUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a B2B sales assistant summarizing conference relationship history.

Contact:
${contactLines}

Encounters (chronological):
${formatEncounters(encounters)}

Write a concise relationship summary in 3–5 short sentences (under 120 words total). Cover the arc across conferences (how the relationship evolved), key themes from notes, and company context. End with one concrete suggested next step. Use a professional, direct tone. Do not use bullet points.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 400,
        },
      }),
    });

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = data.error?.message ?? "Gemini request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!summary) {
      return NextResponse.json(
        { error: "Empty response from Gemini." },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary: truncateRelationshipSummary(summary) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summary generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
