/**
 * Feature flags for MVP vs full SaaS.
 * Toggle these to show/hide functionality without removing code.
 * TODO: Re-enable advanced features when moving past MVP.
 */

export const FEATURES = {
  /** When true, app shows a single linear workflow: Upload → Mockup pack → Generate mockups → Generate listing → Preview/Download. */
  MVP_MODE: true,

  /** Etsy OAuth, connect store, and publish/save draft to Etsy. When false, listing is preview + export only. */
  ETSY_UPLOAD: false,

  /** Multiple tool dashboards (Bulk Edit, Listing Templates, Inventory). When false, sidebar shows only main workflow + Settings. */
  ADVANCED_AI_TOOLS: false,

  /** Background generation / experimental AI tools. */
  BACKGROUND_GENERATION: false,

  /** Analytics and usage dashboards. */
  ANALYTICS: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** Helper: show UI only when not in MVP-only mode (e.g. advanced tools). */
export function isAdvancedFeatureEnabled(feature: FeatureKey): boolean {
  if (feature === 'MVP_MODE') return FEATURES.MVP_MODE;
  if (FEATURES.MVP_MODE) return false;
  return FEATURES[feature] as boolean;
}
