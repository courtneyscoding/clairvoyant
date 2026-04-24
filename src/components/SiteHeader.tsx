import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getAdminAccess, rememberReturnTo } from "@/lib/admin";
import { BRAND_NAME } from "@/lib/brand";

const menuStyles = `
.site-header-shell{
  position:fixed;
  inset-inline:0;
  top:0;
  z-index:120;
}

.site-header-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:1rem;
  padding:1.25rem 2rem;
  background:linear-gradient(180deg,rgba(10,6,18,0.78) 0%,rgba(10,6,18,0.22) 72%,rgba(10,6,18,0) 100%);
  transition:background 0.3s,backdrop-filter 0.3s,border-color 0.3s;
}

.site-header-bar.is-scrolled{
  background:linear-gradient(180deg,rgba(10,6,18,0.88) 0%,rgba(10,6,18,0.74) 100%);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(147,51,234,0.08);
}

.site-header-logo{
  border:none;
  background:none;
  color:#dcc8ff;
  cursor:pointer;
  font-family:'Cinzel',serif;
  font-size:1.1rem;
  font-weight:500;
  letter-spacing:0.06em;
  text-decoration:none;
  transition:color 0.3s;
}

.site-header-logo:hover{
  color:#fff;
}

.site-header-menu-btn,
.site-header-close-btn{
  display:flex;
  align-items:center;
  gap:0.6rem;
  border:1px solid rgba(147,51,234,0.2);
  border-radius:8px;
  background:none;
  color:#c4a0ff;
  cursor:pointer;
  font-family:'Raleway',sans-serif;
  font-size:0.65rem;
  letter-spacing:0.3em;
  padding:0.5rem 1rem;
  text-transform:uppercase;
  transition:all 0.3s;
}

.site-header-menu-btn:hover,
.site-header-close-btn:hover{
  border-color:rgba(147,51,234,0.4);
  color:#efe5ff;
}

.site-header-menu-btn svg,
.site-header-close-btn svg{
  flex-shrink:0;
  height:18px;
  width:18px;
}

.site-header-overlay{
  position:fixed;
  inset:0;
  z-index:220;
  display:flex;
  flex-direction:column;
  overflow-y:auto;
  overscroll-behavior:contain;
  background:rgba(10,6,18,0.97);
  backdrop-filter:blur(30px);
  -webkit-backdrop-filter:blur(30px);
  opacity:0;
  visibility:hidden;
  transition:opacity 0.5s cubic-bezier(0.4,0,0.2,1),visibility 0.5s;
}

.site-header-overlay.is-open{
  opacity:1;
  visibility:visible;
}

.site-header-overlay-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:1.25rem 2rem;
}

.site-header-overlay-body{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-start;
  padding:2rem 2rem 1rem;
}

.site-header-nav{
  width:min(100%,960px);
  list-style:none;
  text-align:center;
}

.site-header-nav li{
  opacity:0;
  transform:translateY(30px);
  transition:opacity 0.4s ease-out,transform 0.4s ease-out;
}

.site-header-overlay.is-open .site-header-nav li{
  opacity:1;
  transform:translateY(0);
}

.site-header-overlay.is-open .site-header-nav li:nth-child(1){transition-delay:0.1s}
.site-header-overlay.is-open .site-header-nav li:nth-child(2){transition-delay:0.17s}
.site-header-overlay.is-open .site-header-nav li:nth-child(3){transition-delay:0.24s}
.site-header-overlay.is-open .site-header-nav li:nth-child(4){transition-delay:0.31s}
.site-header-overlay.is-open .site-header-nav li:nth-child(5){transition-delay:0.38s}
.site-header-overlay.is-open .site-header-nav li:nth-child(6){transition-delay:0.45s}
.site-header-overlay.is-open .site-header-nav li:nth-child(7){transition-delay:0.52s}

.site-header-nav-btn{
  display:inline-block;
  border:none;
  background:none;
  color:rgba(232,223,245,0.6);
  cursor:pointer;
  font-family:'Cinzel',serif;
  font-size:clamp(1.45rem,4.1vw,3rem);
  font-weight:400;
  letter-spacing:0.04em;
  line-height:1.06;
  padding:0.18rem 0;
  position:relative;
  text-decoration:none;
  transition:color 0.3s,text-shadow 0.3s;
}

.site-header-nav-btn:hover{
  color:#fff;
  text-shadow:0 0 40px rgba(147,51,234,0.5),0 0 80px rgba(147,51,234,0.2);
}

.site-header-nav-btn::after{
  content:'';
  position:absolute;
  left:50%;
  bottom:0;
  height:1px;
  width:0;
  background:#9f67ff;
  transition:left 0.3s,width 0.3s;
}

.site-header-nav-btn:hover::after{
  left:0;
  width:100%;
}

.site-header-nav-label{
  display:block;
  color:rgba(232,223,245,0.3);
  font-family:'Raleway',sans-serif;
  font-size:0.55rem;
  letter-spacing:0.3em;
  margin-top:0.15rem;
  text-transform:uppercase;
}

.site-header-overlay-foot{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:1rem;
  opacity:0;
  padding:1.5rem 2rem 2rem;
  transform:translateY(20px);
  transition:opacity 0.4s 0.45s ease-out,transform 0.4s 0.45s ease-out;
}

.site-header-overlay.is-open .site-header-overlay-foot{
  opacity:1;
  transform:translateY(0);
}

.site-header-divider{
  width:60px;
  height:1px;
  background:linear-gradient(90deg,transparent,#3f2272,transparent);
}

.site-header-auth{
  display:flex;
  align-items:center;
  gap:1rem;
}

.site-header-auth-link,
.site-header-auth-primary{
  cursor:pointer;
  text-decoration:none;
}

.site-header-auth-link{
  border:none;
  background:none;
  color:#c4a0ff;
  font-family:'Raleway',sans-serif;
  font-size:0.7rem;
  letter-spacing:0.2em;
  padding:0.6rem 1.5rem;
  text-transform:uppercase;
  transition:color 0.3s;
}

.site-header-auth-link:hover{
  color:#fff;
}

.site-header-auth-primary{
  border:1px solid rgba(147,51,234,0.4);
  border-radius:8px;
  background:linear-gradient(135deg,#3f2272,#5a2d9e);
  color:#efe5ff;
  font-family:'Raleway',sans-serif;
  font-size:0.7rem;
  letter-spacing:0.2em;
  padding:0.6rem 1.8rem;
  text-transform:uppercase;
  transition:all 0.3s;
}

.site-header-auth-primary:hover{
  background:linear-gradient(135deg,#5a2d9e,#7c3aed);
  box-shadow:0 0 25px rgba(147,51,234,0.35);
}

@media (max-width:700px){
  .site-header-bar,
  .site-header-overlay-head{
    padding:1rem 1.25rem;
  }

  .site-header-nav-btn{
    font-size:clamp(1.4rem,7vw,2.2rem);
  }

  .site-header-auth{
    flex-direction:column;
    width:100%;
  }

  .site-header-auth-link,
  .site-header-auth-primary{
    text-align:center;
    width:min(100%,280px);
  }
}

@media (max-height:820px){
  .site-header-nav-btn{
    font-size:clamp(1.35rem,3.7vw,2.4rem);
  }

  .site-header-nav-label{
    font-size:0.5rem;
  }
}
`;

type MenuItem = {
  label: string;
  sublabel: string;
  action: () => void;
};

const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      return;
    }

    let active = true;

    getAdminAccess(user.email).then(({ allowed }) => {
      if (active) {
        setIsAdmin(allowed);
      }
    });

    return () => {
      active = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const goTo = useCallback((path: string) => {
    closeMenu();
    navigate(path);
  }, [navigate]);

  const goToProtected = useCallback((path: string) => {
    closeMenu();

    if (!user) {
      rememberReturnTo(path);
      navigate("/login");
      return;
    }

    navigate(path);
  }, [navigate, user]);

  const handleSignOut = async () => {
    closeMenu();
    await signOut();
    navigate("/login");
  };

  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      { label: "Home", sublabel: "Welcome", action: () => goTo("/") },
      { label: "Speak with Courtney", sublabel: "Private Reading", action: () => goToProtected("/chat") },
      { label: "Plans", sublabel: "Voice Access", action: () => goToProtected("/plans") },
      { label: "Tarot", sublabel: "Card Readings", action: () => goToProtected("/tarot") },
      { label: "Articles", sublabel: "Guidance & Insight", action: () => goTo("/articles") },
    ];

    if (user) {
      items.push({ label: "Profile", sublabel: "Your Details", action: () => goTo("/profile") });
    }

    if (isAdmin) {
      items.push({ label: "Admin", sublabel: "Control Room", action: () => goTo("/admin") });
    }

    return items;
  }, [goTo, goToProtected, isAdmin, user]);

  return (
    <>
      <style>{menuStyles}</style>
      <header className="site-header-shell">
        <div className={`site-header-bar ${isScrolled ? "is-scrolled" : ""}`.trim()}>
          <button type="button" className="site-header-logo" onClick={() => goTo("/")}>
            {BRAND_NAME}
          </button>

          <button
            type="button"
            className="site-header-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open site menu"
            aria-controls="siteHeaderOverlay"
            aria-expanded={menuOpen}
          >
            <span>Explore</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      <div
        id="siteHeaderOverlay"
        className={`site-header-overlay ${menuOpen ? "is-open" : ""}`.trim()}
        aria-hidden={!menuOpen}
      >
        <div className="site-header-overlay-head">
          <button type="button" className="site-header-logo" onClick={() => goTo("/")}>
            {BRAND_NAME}
          </button>

          <button type="button" className="site-header-close-btn" onClick={closeMenu} aria-label="Close menu">
            <span>Close</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="site-header-overlay-body">
          <ul className="site-header-nav">
            {menuItems.map((item) => (
              <li key={item.label}>
                <button type="button" className="site-header-nav-btn" onClick={item.action}>
                  {item.label}
                </button>
                <span className="site-header-nav-label">{item.sublabel}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-header-overlay-foot">
          <div className="site-header-divider" />
          <div className="site-header-auth">
            {user ? (
              <>
                <button type="button" className="site-header-auth-link" onClick={() => goTo("/profile")}>
                  Account
                </button>
                <button type="button" className="site-header-auth-primary" onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button type="button" className="site-header-auth-link" onClick={() => goTo("/login")}>
                  Sign In
                </button>
                <button
                  type="button"
                  className="site-header-auth-primary"
                  onClick={() => {
                    rememberReturnTo("/chat");
                    goTo("/login");
                  }}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SiteHeader;
