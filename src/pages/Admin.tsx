import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, ShieldAlert } from "lucide-react";
import CosmicBackground from "@/components/CosmicBackground";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess, rememberReturnTo } from "@/lib/admin";

interface AdminProfile {
  user_id: string;
  email: string | null;
  display_name: string | null;
  birthday: string | null;
  zodiac_sign: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

interface ReadingRow {
  id: string;
  user_id: string;
  question: string;
  reading: string;
  category: string;
  created_at: string;
}

const setupErrorPattern = /(relation|column).*(admin_users|profiles|readings|email)/i;

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [readings, setReadings] = useState<ReadingRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      rememberReturnTo("/admin");
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setSetupError(null);
      setAccessDenied(false);

      const access = await getAdminAccess(user.email);
      if (!active) return;

      if (access.error) {
        setSetupError(access.error);
        setLoading(false);
        return;
      }

      if (!access.allowed) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const [{ data: profileRows, error: profilesError }, { data: readingRows, error: readingsError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, email, display_name, birthday, zodiac_sign, bio, location, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("readings")
            .select("id, user_id, question, reading, category, created_at")
            .order("created_at", { ascending: false }),
        ]);

      if (!active) return;

      const queryError = profilesError?.message || readingsError?.message;
      if (queryError) {
        setSetupError(queryError);
        setLoading(false);
        return;
      }

      const nextProfiles = (profileRows as AdminProfile[] | null) ?? [];
      const nextReadings = (readingRows as ReadingRow[] | null) ?? [];

      setProfiles(nextProfiles);
      setReadings(nextReadings);
      setSelectedUserId(nextProfiles[0]?.user_id ?? null);
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [authLoading, navigate, user]);

  const readingsByUser = useMemo(() => {
    const grouped = new Map<string, ReadingRow[]>();

    readings.forEach((reading) => {
      const existing = grouped.get(reading.user_id) ?? [];
      existing.push(reading);
      grouped.set(reading.user_id, existing);
    });

    return grouped;
  }, [readings]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles
      .filter((profile) => {
        if (!query) return true;

        return [
          profile.display_name,
          profile.email,
          profile.location,
          profile.zodiac_sign,
          profile.bio,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const latestA = readingsByUser.get(a.user_id)?.[0]?.created_at ?? a.created_at;
        const latestB = readingsByUser.get(b.user_id)?.[0]?.created_at ?? b.created_at;
        return new Date(latestB).getTime() - new Date(latestA).getTime();
      });
  }, [profiles, readingsByUser, search]);

  const selectedProfile =
    filteredProfiles.find((profile) => profile.user_id === selectedUserId) ?? filteredProfiles[0] ?? null;

  const selectedTranscript = selectedProfile ? readingsByUser.get(selectedProfile.user_id) ?? [] : [];

  useEffect(() => {
    if (selectedProfile && selectedProfile.user_id !== selectedUserId) {
      setSelectedUserId(selectedProfile.user_id);
    }
  }, [selectedProfile, selectedUserId]);

  const showSetupMessage = Boolean(setupError && setupErrorPattern.test(setupError));

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 py-8 sm:px-6">
      <CosmicBackground />
      <SiteHeader />

      <main className="relative z-[1] mx-auto flex w-full max-w-6xl flex-col gap-8 pt-28 pb-8">
        <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-purple-light">Admin</p>
          <h1 className="mt-3 font-display text-5xl font-light text-foreground text-glow-purple sm:text-6xl">
            User Logs
          </h1>
          <p className="mt-4 max-w-2xl font-body text-sm leading-7 text-muted-foreground sm:text-base">
            Review profiles and conversation history from one clean dashboard.
          </p>
        </section>

        {loading ? (
          <section className="rounded-[36px] border border-purple-dim bg-[rgba(10,8,18,0.6)] p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <p className="font-body text-sm text-muted-foreground animate-pulse">
              Loading the admin room...
            </p>
          </section>
        ) : accessDenied ? (
          <section className="rounded-[36px] border border-purple-dim bg-[rgba(10,8,18,0.6)] p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <ShieldAlert className="mx-auto text-purple-light" size={28} />
            <p className="mt-4 font-display text-2xl text-foreground">Admin access denied</p>
            <p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
              Sign in with the admin Google account after the admin SQL setup is in place.
            </p>
          </section>
        ) : setupError ? (
          <section className="rounded-[36px] border border-purple-dim bg-[rgba(10,8,18,0.6)] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <ShieldAlert className="text-purple-light" size={28} />
            <p className="mt-4 font-display text-2xl text-foreground">Admin setup needed</p>
            <p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
              {showSetupMessage
                ? "The frontend is ready, but Supabase still needs the admin SQL file run once before this dashboard can see profiles and transcripts."
                : setupError}
            </p>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
            <aside className="rounded-[32px] border border-purple-dim bg-[rgba(10,8,18,0.62)] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users"
                  className="w-full rounded-full border border-purple-dim bg-secondary/40 py-3 pl-11 pr-4 font-body text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </div>

              <div className="mt-4 space-y-3">
                {filteredProfiles.map((profile) => {
                  const totalReadings = readingsByUser.get(profile.user_id)?.length ?? 0;
                  const isSelected = profile.user_id === selectedProfile?.user_id;

                  return (
                    <button
                      key={profile.user_id}
                      onClick={() => setSelectedUserId(profile.user_id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-secondary/70 shadow-[0_12px_32px_rgba(157,92,255,0.16)]"
                          : "border-purple-dim bg-black/20 hover:border-primary/50 hover:bg-secondary/40"
                      }`}
                    >
                      <p className="font-display text-xl text-foreground">
                        {profile.display_name || "Unnamed user"}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted-foreground">
                        {profile.email || "No email synced yet"}
                      </p>
                      <p className="mt-3 font-body text-xs uppercase tracking-[0.28em] text-purple-light">
                        {totalReadings} logged reading{totalReadings === 1 ? "" : "s"}
                      </p>
                    </button>
                  );
                })}

                {filteredProfiles.length === 0 && (
                  <p className="rounded-[24px] border border-dashed border-purple-dim px-4 py-6 text-center font-body text-sm text-muted-foreground">
                    No users match that search yet.
                  </p>
                )}
              </div>
            </aside>

            <section className="rounded-[32px] border border-purple-dim bg-[rgba(10,8,18,0.62)] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-6">
              {!selectedProfile ? (
                <div className="flex min-h-[28rem] items-center justify-center text-center">
                  <p className="max-w-sm font-body text-sm leading-7 text-muted-foreground">
                    Select a user to view their profile details and the full transcript of saved readings.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-purple-dim bg-secondary/25 p-5">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-purple-light">
                      User Info
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Name
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground">
                          {selectedProfile.display_name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Email
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground">
                          {selectedProfile.email || "Not synced yet"}
                        </p>
                      </div>
                      <div>
                        <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Birthday
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground">
                          {selectedProfile.birthday || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Zodiac
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground">
                          {selectedProfile.zodiac_sign || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Location
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground">
                          {selectedProfile.location || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Joined
                        </p>
                        <p className="mt-1 font-body text-sm text-foreground">
                          {format(new Date(selectedProfile.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    {selectedProfile.bio && (
                      <div className="mt-4">
                        <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Bio
                        </p>
                        <p className="mt-1 font-body text-sm leading-7 text-foreground">
                          {selectedProfile.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-purple-dim bg-black/20 p-5">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-purple-light">
                      Transcript
                    </p>
                    <div className="mt-4 space-y-5">
                      {selectedTranscript.length === 0 ? (
                        <p className="font-body text-sm leading-7 text-muted-foreground">
                          No saved readings for this user yet.
                        </p>
                      ) : (
                        selectedTranscript.map((entry) => (
                          <article
                            key={entry.id}
                            className="rounded-[24px] border border-purple-dim bg-secondary/25 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-body text-xs uppercase tracking-[0.22em] text-purple-light">
                                {entry.category}
                              </p>
                              <p className="font-body text-xs text-muted-foreground">
                                {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                            <div className="mt-4 space-y-4">
                              <div className="rounded-[20px] bg-primary/18 px-4 py-3">
                                <p className="font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                  User
                                </p>
                                <p className="mt-2 font-body text-sm leading-7 text-foreground">
                                  {entry.question}
                                </p>
                              </div>
                              <div className="rounded-[20px] bg-black/35 px-4 py-3">
                                <p className="font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                  Courtney
                                </p>
                                <p className="mt-2 font-body text-sm leading-7 text-foreground">
                                  {entry.reading}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;
