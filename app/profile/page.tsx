"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  updateUserProfile,
  updateParticipantProfile,
  updateUserPassword,
  updateUserEmail,
  logOut,
  friendlyAuthError,
  type UserProfile,
} from "@/lib/auth";

const TRACKS = [
  "AI",
  "Cloud",
  "Data",
  "Security",
  "Automation",
  "Storage",
  "IBM Z",
  "Red Hat",
  "App Development",
  "IT Optimization",
  "Power",
  "FinOps",
];

const ROLES = [
  "Client / Customer",
  "Developer",
  "Architect",
  "Data Scientist",
  "Security Professional",
  "IT Operations",
  "Business Leader",
  "Student",
  "IBM Champion",
  "IBMer",
  "Partner",
];

const GOALS = [
  "Learn new technologies",
  "Earn a certification",
  "Meet IBM experts",
  "Explore AI",
  "Network with peers",
  "Discover customer stories",
  "Understand IBM roadmap",
  "Grow my career",
];

const inputStyle = {
  height: "42px",
  padding: "0 13px",
  border: "1px solid var(--line)",
  background: "var(--panel)",
  color: "var(--text)",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

const sectionCard = {
  border: "1px solid var(--line)",
  background: "var(--panel)",
  padding: "24px 24px 20px",
  display: "flex" as const,
  flexDirection: "column" as const,
  gap: "16px",
};

function SectionTitle({ label }: { label: string }) {
  return (
    <p
      style={{
        color: "var(--accent)",
        fontSize: "0.72rem",
        fontWeight: 680,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        margin: "0 0 4px",
      }}
    >
      {label}
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, opacity: disabled ? 0.55 : 1 }}
      />
    </label>
  );
}

function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          aria-pressed={selected.includes(o)}
          style={{
            height: "32px",
            padding: "0 12px",
            border: selected.includes(o)
              ? "1px solid var(--accent)"
              : "1px solid var(--line)",
            background: selected.includes(o) ? "var(--accent)" : "transparent",
            color: selected.includes(o) ? "var(--accent-text)" : "var(--soft)",
            fontSize: "0.82rem",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SaveBtn({
  loading,
  onClick,
  label = "Save changes",
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        height: "40px",
        padding: "0 20px",
        background: "var(--accent)",
        border: "none",
        color: "#fff",
        fontSize: "0.9rem",
        fontWeight: 650,
        fontFamily: "inherit",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        alignSelf: "flex-start",
      }}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }}
        />
      )}
      {loading ? "Saving…" : label}
    </button>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        background: ok ? "#DCFCE7" : "#FEE2E2",
        border: `1px solid ${ok ? "#15803D" : "#DC2626"}`,
        borderRadius: 2,
      }}
    >
      <p style={{ color: ok ? "#15803D" : "#DC2626", fontSize: "0.88rem", margin: 0 }}>
        {msg}
      </p>
    </div>
  );
}

function linkedinFromHandle(handle: string): string {
  const clean = handle
    .trim()
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
    .replace(/^www\.linkedin\.com\/in\//i, "")
    .replace(/\//g, "");

  return clean ? `https://www.linkedin.com/in/${clean}` : "";
}

function linkedinHandleFromUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
    .replace(/^www\.linkedin\.com\/in\//i, "")
    .replace(/\//g, "");
}

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [persona, setPersona] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [consentNet, setConsentNet] = useState(false);
  const [consentMent, setConsentMent] = useState(false);

  const [linkedinHandle, setLinkedinHandle] = useState("");
  const [university, setUniversity] = useState("");
  const [pastEmployer, setPastEmployer] = useState("");
  const [careerInterest, setCareerInterest] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");

  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      const raw = profile as unknown as Record<string, unknown>;

      setDisplayName(profile.displayName ?? "");
      setOrganization(profile.organization ?? "");
      setRole(profile.role ?? "");
      setPersona(profile.persona ?? "");
      setTracks((raw.tracks as string[]) ?? []);
      setGoals(profile.goals ?? []);
      setConsentNet(profile.consent?.networking ?? false);
      setConsentMent(profile.consent?.mentoring ?? false);

      setLinkedinHandle(linkedinHandleFromUrl(String(raw.linkedin_url ?? "")));

      const education = (raw.education as { institution?: string }[] | undefined) ?? [];
      const pastEmployers = (raw.past_employers as { company?: string }[] | undefined) ?? [];
      const careerInterests = (raw.career_interests as string[] | undefined) ?? [];

      setUniversity(education[0]?.institution ?? "");
      setPastEmployer(pastEmployers[0]?.company ?? "");
      setCareerInterest(careerInterests[0] ?? "");
    } else if (user) {
      setDisplayName(user.displayName ?? "");
      setNewEmail(user.email ?? "");
    }
  }, [profile, user]);

  async function handleSaveProfile() {
    if (!user) return;

    setSaving(true);

    try {
      const linkedinUrl = linkedinFromHandle(linkedinHandle);

      const updates: Partial<UserProfile> & Record<string, unknown> = {
        displayName,
        organization,
        role,
        persona,
        goals,
        tracks,
        linkedin_url: linkedinUrl,
        education: university.trim() ? [{ institution: university.trim() }] : [],
        past_employers: pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],
        career_interests: careerInterest.trim() ? [careerInterest.trim()] : [],
        consent: {
          networking: consentNet,
          mentoring: consentMent,
          recruiting: false,
          partnerIntroductions: false,
        },
      };

      await updateUserProfile(user.uid, updates);

      await updateParticipantProfile(user.uid, {
        displayName,
        email: user.email ?? "",
        role,
        organization,
        persona,
        goals,
        tracks,
        linkedin_url: linkedinUrl,
        education: university.trim() ? [{ institution: university.trim() }] : [],
        past_employers: pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],
        career_interests: careerInterest.trim() ? [careerInterest.trim()] : [],
        networking_identity: {
          open_to_alumni_connections: consentNet,
          open_to_past_colleague_connections: consentNet,
          open_to_university_connections: consentNet,
          open_to_career_conversations: consentMent,
        },
      });

      await refreshProfile();
      showToast("Profile saved.", true);
    } catch (err: unknown) {
      showToast((err as Error).message ?? "Save failed.", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) {
      showToast("Passwords do not match.", false);
      return;
    }

    if (newPw.length < 8) {
      showToast("Password must be at least 8 characters.", false);
      return;
    }

    setPwSaving(true);

    try {
      await updateUserPassword(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      showToast("Password updated.", true);
    } catch (err: unknown) {
      showToast(friendlyAuthError((err as { code?: string }).code ?? ""), false);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.includes("@")) {
      showToast("Enter a valid email address.", false);
      return;
    }

    setEmailSaving(true);

    try {
      await updateUserEmail(emailPw, newEmail);
      setEmailPw("");
      showToast("Email updated.", true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";

      if (code === "auth/requires-recent-login") {
        showToast("For security, please sign out and sign back in before changing your email.", false);
      } else {
        showToast(friendlyAuthError(code), false);
      }
    } finally {
      setEmailSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="section no-top-border">
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </section>
    );
  }

  if (!user) return null;

  return (
    <>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      <section className="compact-hero">
        <div className="section-kicker">My Profile</div>
        <h1>{displayName || user.displayName || "Your profile"}</h1>
        <p>{user.email}</p>
      </section>

      <section className="section no-top-border">
        <div style={{ display: "grid", gap: "20px", maxWidth: 680 }}>
          {toast && <Toast msg={toast.msg} ok={toast.ok} />}

          <div style={sectionCard}>
            <SectionTitle label="Identity" />
            <Field label="Display name" value={displayName} onChange={setDisplayName} />
            <Field label="Organization" value={organization} onChange={setOrganization} />
            <Field label="Role / Title" value={role} onChange={setRole} />
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>
                Persona
              </span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                style={{ ...inputStyle, height: "42px" }}
              >
                <option value="">Select…</option>
                {[
                  "Technical Practitioner",
                  "Architect",
                  "Business Decision Maker",
                  "IT Leader",
                  "Developer",
                  "Student / Early Career",
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <SaveBtn loading={saving} onClick={handleSaveProfile} />
          </div>

          <div style={sectionCard}>
            <SectionTitle label="Compass signal" />
            <div>
              <p style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600, margin: "0 0 10px" }}>
                Tech tracks
              </p>
              <ChipSelect
                options={TRACKS}
                selected={tracks}
                onToggle={(v) => setTracks((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))}
              />
            </div>
            <div>
              <p style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600, margin: "0 0 10px" }}>
                Goals
              </p>
              <ChipSelect
                options={GOALS}
                selected={goals}
                onToggle={(v) => setGoals((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))}
              />
            </div>
            <SaveBtn loading={saving} onClick={handleSaveProfile} label="Save signal" />
          </div>

          <div style={sectionCard}>
            <SectionTitle label="Network signal" />
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
              These signals help Compass find alumni, past colleagues, and people connected to your journey.
            </p>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>
                LinkedIn profile
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", alignItems: "center" }}>
                <span
                  style={{
                    height: "42px",
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 10px",
                    border: "1px solid var(--line)",
                    borderRight: 0,
                    background: "var(--panel)",
                    color: "var(--muted)",
                    fontSize: "0.84rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  linkedin.com/in/
                </span>
                <input
                  value={linkedinHandle}
                  onChange={(e) => setLinkedinHandle(e.target.value.replace(/\//g, ""))}
                  placeholder="your-name"
                  style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                />
              </div>
            </label>

            <Field
              label="University / school"
              value={university}
              onChange={setUniversity}
              placeholder="North Carolina State University"
            />

            <Field
              label="Past employer"
              value={pastEmployer}
              onChange={setPastEmployer}
              placeholder="Cisco, IBM, Red Hat..."
            />

            <Field
              label="Career interest"
              value={careerInterest}
              onChange={setCareerInterest}
              placeholder="Mentoring, leadership, AI architecture..."
            />

            <SaveBtn loading={saving} onClick={handleSaveProfile} label="Save network signal" />
          </div>

          <div style={sectionCard}>
            <SectionTitle label="Preferences & consent" />
            {[
              ["Open to networking introductions", consentNet, setConsentNet],
              ["Open to mentoring conversations", consentMent, setConsentMent],
            ].map(([label, val, set]) => (
              <label
                key={label as string}
                style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={val as boolean}
                  onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <span style={{ color: "var(--soft)", fontSize: "0.9rem", lineHeight: 1.45 }}>
                  {label as string}
                </span>
              </label>
            ))}
            <SaveBtn loading={saving} onClick={handleSaveProfile} label="Save preferences" />
          </div>

          <div style={sectionCard}>
            <SectionTitle label="Change email" />
            <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: 0, lineHeight: 1.5 }}>
              Current email: <strong>{user.email}</strong>. Re-authentication is required for email changes.
            </p>
            <Field label="New email address" type="email" value={newEmail} onChange={setNewEmail} />
            <Field label="Current password" type="password" value={emailPw} onChange={setEmailPw} />
            <SaveBtn loading={emailSaving} onClick={handleChangeEmail} label="Update email" />
          </div>

          <div style={sectionCard}>
            <SectionTitle label="Change password" />
            <Field label="Current password" type="password" value={currentPw} onChange={setCurrentPw} />
            <Field label="New password" type="password" value={newPw} onChange={setNewPw} />
            <Field label="Confirm new password" type="password" value={confirmPw} onChange={setConfirmPw} />
            <SaveBtn loading={pwSaving} onClick={handleChangePassword} label="Update password" />
          </div>

          <div style={{ ...sectionCard, borderColor: "#DC2626" }}>
            <SectionTitle label="Sign out" />
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
              You will be returned to the home page.
            </p>
            <button
              onClick={async () => {
                await logOut();
                router.push("/");
              }}
              style={{
                height: "40px",
                padding: "0 20px",
                background: "transparent",
                border: "1px solid #DC2626",
                color: "#DC2626",
                fontSize: "0.9rem",
                fontWeight: 650,
                fontFamily: "inherit",
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      <div style={{ height: "64px" }} />
    </>
  );
}