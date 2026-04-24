export interface ProfileContext {
  display_name?: string | null;
  birthday?: string | null;
  zodiac_sign?: string | null;
  gender_identity?: string | null;
  bio?: string | null;
  location?: string | null;
}

export const MINIMUM_READING_AGE = 18;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseBirthday = (dateStr?: string | null): Date | null => {
  if (!dateStr || !ISO_DATE_PATTERN.test(dateStr)) return null;

  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return formatDateInputValue(parsed) === dateStr ? parsed : null;
};

export const getMaxAllowedBirthday = (minimumAge = MINIMUM_READING_AGE) => {
  const latestAllowed = startOfDay(new Date());
  latestAllowed.setFullYear(latestAllowed.getFullYear() - minimumAge);
  return formatDateInputValue(latestAllowed);
};

export const getAgeFromBirthday = (
  dateStr: string,
  today = startOfDay(new Date()),
): number | null => {
  const birthday = parseBirthday(dateStr);
  if (!birthday) return null;

  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age -= 1;
  }

  return age;
};

export const getZodiacSign = (dateStr: string): string => {
  const birthday = parseBirthday(dateStr);
  if (!birthday) return "";

  const month = birthday.getMonth() + 1;
  const day = birthday.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
};

export const getBirthdayValidationError = (birthday?: string | null) => {
  if (!birthday) return "Date of birth is required";

  const parsedBirthday = parseBirthday(birthday);
  if (!parsedBirthday) return "Enter a valid birth date";

  const today = startOfDay(new Date());
  if (parsedBirthday > today) return "Birth date can't be in the future";

  const age = getAgeFromBirthday(birthday, today);
  if (age === null) return "Enter a valid birth date";
  if (age < MINIMUM_READING_AGE) {
    return `Please enter a real birth date. Live readings are for ages ${MINIMUM_READING_AGE}+`;
  }

  return null;
};

export const isProfileComplete = (profile?: ProfileContext | null) =>
  Boolean(
    profile?.display_name?.trim() && !getBirthdayValidationError(profile?.birthday),
  );

export const isAdultProfile = (profile?: ProfileContext | null) =>
  !getBirthdayValidationError(profile?.birthday);

const trimOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const sanitizeProfileForReading = (profile?: ProfileContext | null) => {
  if (!profile) return undefined;

  const birthday =
    profile.birthday && !getBirthdayValidationError(profile.birthday)
      ? profile.birthday
      : undefined;

  const sanitized = {
    birthday,
    zodiac_sign: birthday ? getZodiacSign(birthday) : undefined,
    gender_identity: trimOrUndefined(profile.gender_identity),
    bio: trimOrUndefined(profile.bio),
  };

  return Object.values(sanitized).some(Boolean) ? sanitized : undefined;
};
