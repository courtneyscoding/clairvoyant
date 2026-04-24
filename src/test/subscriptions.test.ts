import { describe, expect, it } from "vitest";
import {
  DEFAULT_ENTITLEMENTS,
  PLAN_DEFINITIONS,
  SEEKER_VOICE_SECONDS_LIMIT,
  formatSecondsAsMinutes,
} from "@/lib/subscriptions";

describe("subscription config", () => {
  it("defines the three expected plans", () => {
    expect(PLAN_DEFINITIONS.map((plan) => plan.key)).toEqual(["free", "seeker", "oracle"]);
  });

  it("keeps the free entitlements locked to text chat", () => {
    expect(DEFAULT_ENTITLEMENTS.planKey).toBe("free");
    expect(DEFAULT_ENTITLEMENTS.canUseVoice).toBe(false);
    expect(DEFAULT_ENTITLEMENTS.voiceSecondsRemaining).toBe(0);
  });

  it("formats the Seeker allowance in whole minutes", () => {
    expect(formatSecondsAsMinutes(SEEKER_VOICE_SECONDS_LIMIT)).toBe("30 min");
  });
});
