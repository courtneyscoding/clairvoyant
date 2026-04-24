import { useEffect, useState } from "react";
import { LogIn, LogOut, MessageCircle, ScrollText, Shield, Sparkles, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { BRAND_NAME } from "@/lib/brand";
import { getAdminAccess } from "@/lib/admin";

const navBase =
  "inline-flex items-center rounded-full border border-transparent px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-all duration-300 hover:border-purple-dim hover:text-foreground";

const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    if (!user?.email) {
      setIsAdmin(false);
      return () => {
        active = false;
      };
    }

    getAdminAccess(user.email).then(({ allowed }) => {
      if (active) {
        setIsAdmin(allowed);
      }
    });

    return () => {
      active = false;
    };
  }, [user?.email]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="rounded-full border border-purple-dim bg-black/35 px-4 py-2 backdrop-blur-md">
          <NavLink
            to="/"
            end
            className="font-display text-base tracking-[0.08em] text-foreground sm:text-lg"
            activeClassName="text-purple-light"
          >
            {BRAND_NAME}
          </NavLink>
        </div>

        <div className="flex min-w-0 flex-1 justify-center">
          <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-purple-dim bg-black/30 px-2 py-1.5 backdrop-blur-md">
            <NavLink to="/" end className={navBase} activeClassName="border-purple-dim bg-secondary/80 text-foreground">
              Home
            </NavLink>
            <NavLink
              to="/chat"
              className={`${navBase} gap-2`}
              activeClassName="border-purple-dim bg-secondary/80 text-foreground"
            >
              <MessageCircle size={14} />
              Speak
            </NavLink>
            <NavLink
              to="/tarot"
              className={`${navBase} gap-2`}
              activeClassName="border-purple-dim bg-secondary/80 text-foreground"
            >
              <Sparkles size={14} />
              Tarot
            </NavLink>
            <NavLink
              to="/articles"
              className={`${navBase} gap-2`}
              activeClassName="border-purple-dim bg-secondary/80 text-foreground"
            >
              <ScrollText size={14} />
              Articles
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-purple-dim bg-black/35 px-2 py-1.5 backdrop-blur-md">
          {user ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Admin"
                >
                  <Shield size={18} />
                </button>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Profile"
              >
                <User size={18} />
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
              activeClassName="text-foreground"
            >
              <LogIn size={14} />
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
