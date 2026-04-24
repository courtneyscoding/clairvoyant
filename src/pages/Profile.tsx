import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import CosmicBackground from "@/components/CosmicBackground";
import { ArrowLeft, Save } from "lucide-react";
import { BRAND_FIRST_NAME } from "@/lib/brand";
import { toast } from "@/components/ui/sonner";
import {
  getBirthdayValidationError,
  getMaxAllowedBirthday,
  getZodiacSign,
} from "@/lib/profile";
import { fetchProfileContext, saveProfile } from "@/lib/profileStore";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";
  const returnTo = searchParams.get("returnTo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    display_name: "",
    birthday: "",
    zodiac_sign: "",
    gender_identity: "",
    bio: "",
    location: "",
  });

  useEffect(() => {
    if (!user) return;

    fetchProfileContext(user.id).then(({ data, error }) => {
      if (error) {
        console.error("Failed to load profile:", error);
        toast.error("Profile could not be loaded", {
          description: error.message,
        });
      }

      if (data) {
        const bday = data.birthday || "";
        setForm({
          display_name: data.display_name || "",
          birthday: bday,
          zodiac_sign: bday ? getZodiacSign(bday) : "",
          gender_identity: data.gender_identity || "",
          bio: data.bio || "",
          location: data.location || "",
        });
      }

      setLoading(false);
    });
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.display_name.trim()) newErrors.display_name = "Name is required";
    const birthdayError = getBirthdayValidationError(form.birthday);
    if (birthdayError) newErrors.birthday = birthdayError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validate()) return;

    setSaving(true);

    const { error, usedFallback } = await saveProfile({
      userId: user.id,
      email: user.email,
      display_name: form.display_name,
      birthday: form.birthday,
      zodiac_sign: form.zodiac_sign,
      gender_identity: form.gender_identity,
      bio: form.bio,
      location: form.location,
    });

    setSaving(false);

    if (error) {
      console.error("Failed to save profile:", error);
      toast.error("Profile could not be saved", {
        description: error.message,
      });
      return;
    }

    if (usedFallback) {
      toast.success("Profile saved", {
        description: "Your required details were saved. A couple optional fields may need one more database update later.",
      });
    }

    navigate(isOnboarding && returnTo?.startsWith("/") ? returnTo : "/", { replace: true });
  };

  if (loading) {
    return (
      <div className="relative min-h-[100dvh] flex items-center justify-center">
        <CosmicBackground />
        <p className="text-muted-foreground font-body text-sm animate-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col px-6 py-8 overflow-hidden">
      <CosmicBackground />

      <div className="flex items-center gap-3 mb-8">
        {!isOnboarding && (
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="font-display text-foreground text-2xl font-light">
          {isOnboarding ? "Complete Your Profile" : "Your Profile"}
        </h1>
      </div>

      {isOnboarding && (
        <p className="font-body text-muted-foreground text-sm mb-6 max-w-sm mx-auto text-center">
          {BRAND_FIRST_NAME} needs your real name and birth date so the readings stay personal without getting weird.
        </p>
      )}

      <div className="space-y-5 max-w-sm mx-auto w-full animate-fade-in">
        <div className="space-y-1.5">
          <label className="font-body text-xs text-muted-foreground uppercase tracking-wider">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))}
            className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="What should Clairvoyant Courtney call you?"
          />
          {errors.display_name && <p className="text-destructive text-xs font-body">{errors.display_name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="font-body text-xs text-muted-foreground uppercase tracking-wider">
            Date of Birth <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => {
              const bday = e.target.value;
              setForm(f => ({ ...f, birthday: bday, zodiac_sign: bday ? getZodiacSign(bday) : "" }));
            }}
            max={getMaxAllowedBirthday()}
            className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {form.zodiac_sign && (
            <p className="text-primary font-body text-xs mt-1">✦ {form.zodiac_sign}</p>
          )}
          <p className="text-muted-foreground font-body text-xs mt-1">Live readings are for ages 18 and up.</p>
          {errors.birthday && <p className="text-destructive text-xs font-body">{errors.birthday}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="font-body text-xs text-muted-foreground uppercase tracking-wider">
            Gender
          </label>
          <input
            type="text"
            value={form.gender_identity}
            onChange={(e) => setForm(f => ({ ...f, gender_identity: e.target.value }))}
            className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="e.g. woman"
          />
          <p className="text-muted-foreground font-body text-xs mt-1">
            Courtney will treat this as factual and will not speculate around it.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-body text-xs text-muted-foreground uppercase tracking-wider">
            City / Country <span className="text-muted-foreground/70 normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
            className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="Only if you want to share it"
          />
          <p className="text-muted-foreground font-body text-xs mt-1">
            Cookies do not tell the site where someone lives. Exact location is optional here.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-body text-xs text-muted-foreground uppercase tracking-wider">About You</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            maxLength={500}
            className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Tell Courtney about your life — relationships, career, goals..."
          />
          <p className="text-right text-xs text-muted-foreground">{form.bio.length}/500</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-3 font-body text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : isOnboarding ? "Continue" : "Save Profile"}
        </button>
      </div>
    </div>
  );
};

export default Profile;
