/** localStorage keys and change events (Itai branding). */

export const STORAGE_KEYS = {
  store: "itai_conference_intel_v1",
  team: "itai_team_members_v1",
  hubspotToken: "itai_hubspot_token_v1",
  geminiApiKey: "itai_gemini_api_key_v1",
  lastCaptureConference: "itai_last_capture_conference_v1",
} as const;

export const STORE_CHANGE_EVENT = "itai-store-change";
export const INTEGRATIONS_CHANGE_EVENT = "itai-integrations-change";
export const CAPTURE_CONFERENCE_CHANGE_EVENT = "itai-capture-conference-change";
