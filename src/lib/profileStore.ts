import { supabase } from "@/integrations/supabase/client";
import type { ProfileContext } from "@/lib/profile";

type SupabaseErrorLike = {
  message: string;
} | null;

const EXTENDED_PROFILE_SELECT =
  "display_name, birthday, zodiac_sign, gender_identity, bio, location";
const MINIMAL_PROFILE_SELECT = "display_name, birthday, zodiac_sign";

const missingColumnPattern =
  /column .* does not exist|Could not find the '.*' column|schema cache/i;

const isMissingColumnError = (error: SupabaseErrorLike) =>
  Boolean(error?.message && missingColumnPattern.test(error.message));

const normalizeProfileRow = (
  row: Partial<Record<keyof ProfileContext, string | null>> | null,
): ProfileContext | null => {
  if (!row) return null;

  return {
    display_name: row.display_name ?? null,
    birthday: row.birthday ?? null,
    zodiac_sign: row.zodiac_sign ?? null,
    gender_identity: row.gender_identity ?? null,
    bio: row.bio ?? null,
    location: row.location ?? null,
  };
};

export const fetchProfileContext = async (userId: string) => {
  const extendedResult = await supabase
    .from("profiles")
    .select(EXTENDED_PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (!extendedResult.error) {
    return {
      data: normalizeProfileRow(
        extendedResult.data as Partial<Record<keyof ProfileContext, string | null>> | null,
      ),
      error: null,
      usedFallback: false,
    };
  }

  if (!isMissingColumnError(extendedResult.error)) {
    return {
      data: null,
      error: extendedResult.error,
      usedFallback: false,
    };
  }

  const minimalResult = await supabase
    .from("profiles")
    .select(MINIMAL_PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    data: normalizeProfileRow(
      minimalResult.data as Partial<Record<keyof ProfileContext, string | null>> | null,
    ),
    error: minimalResult.error,
    usedFallback: !minimalResult.error,
  };
};

interface SaveProfileInput {
  userId: string;
  email: string | null;
  display_name: string;
  birthday: string;
  zodiac_sign: string;
  gender_identity: string;
  bio: string;
  location: string;
}

const buildExtendedPayload = (input: SaveProfileInput) => ({
  user_id: input.userId,
  email: input.email,
  display_name: input.display_name.trim(),
  birthday: input.birthday || null,
  zodiac_sign: input.zodiac_sign || null,
  gender_identity: input.gender_identity.trim() || null,
  bio: input.bio || null,
  location: input.location.trim() || null,
});

const buildMinimalPayload = (input: SaveProfileInput) => ({
  user_id: input.userId,
  display_name: input.display_name.trim(),
  birthday: input.birthday || null,
  zodiac_sign: input.zodiac_sign || null,
});

export const saveProfile = async (input: SaveProfileInput) => {
  const extendedResult = await supabase
    .from("profiles")
    .upsert(buildExtendedPayload(input) as never, { onConflict: "user_id" });

  if (!extendedResult.error) {
    return {
      error: null,
      usedFallback: false,
    };
  }

  if (!isMissingColumnError(extendedResult.error)) {
    return {
      error: extendedResult.error,
      usedFallback: false,
    };
  }

  const minimalResult = await supabase
    .from("profiles")
    .upsert(buildMinimalPayload(input) as never, { onConflict: "user_id" });

  return {
    error: minimalResult.error,
    usedFallback: !minimalResult.error,
  };
};
