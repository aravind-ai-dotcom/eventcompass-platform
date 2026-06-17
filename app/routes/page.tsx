import Link from "next/link";

const ROUTES = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login (TechXchange)" },
  { href: "/enroll", label: "Enroll (TechXchange)" },
  { href: "/profile", label: "Profile / My Compass (SKO)" },
  { href: "/compass", label: "Compass → redirects to /profile" },
  { href: "/content", label: "Content / Explore SKO" },
  { href: "/pulse", label: "Pulse (SKO)" },
  { href: "/people", label: "People" },
  { href: "/experience", label: "Experience (TechXchange My Compass)" },
  { href: "/explore", label: "Explore (TechXchange)" },
  { href: "/sessions", label: "Sessions" },
  { href: "/champions", label: "Champions" },
  { href: "/communities", label: "Communities" },
  { href: "/setup", label: "Setup hub" },
  { href: "/sko", label: "SKO home" },
  { href: "/sko/login", label: "SKO login" },
  { href: "/sko/enroll", label: "SKO enroll" },
  { href: "/sko/compass", label: "SKO compass" },
  { href: "/sko/content", label: "SKO content → redirects to /content" },
  { href: "/sko/pulse", label: "SKO pulse" },
  { href: "/routes", label: "This route index" },
] as const;

export default function RoutesPage() {
  return (
    <section className="section no-top-border">
      <div className="section-kicker">Diagnostics</div>
      <h1>Active routes</h1>
      <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
        App directory: <code>app/</code> at project root (<code>eventcompass-platform</code>).
        Not <code>src/app</code>.
      </p>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "10px" }}>
        {ROUTES.map(route => (
          <li key={route.href}>
            <Link href={route.href} style={{ color: "var(--accent)" }}>
              {route.href}
            </Link>
            <span style={{ color: "var(--muted)", marginLeft: "8px" }}>— {route.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
