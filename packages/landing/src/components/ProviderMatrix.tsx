import {
  DatabaseDuoStrokeIcon,
  FolderDuoStrokeIcon,
  LayoutGridStackUpDuoStrokeIcon,
  ShieldCheckDuoStrokeIcon,
  WifiOnDuoStrokeIcon,
} from "@pikaicons/core-free";
import { PikaIcon } from "@pikaicons/react";
import { useRef } from "react";
import { useTiltGroup } from "../hooks/useTiltGroup";
import "./ProviderMatrix.css";

const LAYERS = [
  {
    icon: DatabaseDuoStrokeIcon,
    name: "Database",
    providers: [
      "PostgreSQL (Docker)",
      "PostgreSQL (Neon)",
      "PostgreSQL (Supabase)",
      "SQLite",
      "MongoDB",
      "Convex",
    ],
  },
  {
    icon: LayoutGridStackUpDuoStrokeIcon,
    name: "ORM",
    providers: ["Drizzle", "Prisma", "Mongoose"],
  },
  {
    icon: ShieldCheckDuoStrokeIcon,
    name: "Auth",
    providers: ["Better Auth", "Clerk", "Supabase Auth", "Firebase Auth", "Convex Auth"],
  },
  {
    icon: FolderDuoStrokeIcon,
    name: "Storage",
    providers: ["S3 / Cloudflare R2", "Supabase Storage", "Firebase Storage"],
  },
  {
    icon: WifiOnDuoStrokeIcon,
    name: "Realtime",
    providers: ["Supabase Realtime", "Convex Realtime"],
  },
];

export function ProviderMatrix() {
  const ledgerRef = useRef<HTMLDivElement>(null);
  useTiltGroup(ledgerRef);

  return (
    <section className="matrix" id="providers">
      <div className="tx-dots-layer" aria-hidden />

      <div className="matrix__inner">
        <div className="matrix__intro">
          <h2 className="matrix__heading">Five layers. Pick across them freely.</h2>
          <p className="matrix__lede">
            Mix and match &mdash; Supabase Auth with a Neon database, Firebase Storage with Better
            Auth &mdash; and it still generates, installs, typechecks, and builds. Convex is the one
            exception: pick it and it bundles auth and realtime with it automatically, and the
            resolver rejects any combination that doesn&rsquo;t make sense, with a clear reason.
          </p>
        </div>

        <div className="matrix__ledger" ref={ledgerRef}>
          {LAYERS.map((layer) => (
            <div className="matrix__row t-tilt" key={layer.name}>
              <div className="matrix__row-card t-tilt-card">
                <div className="matrix__row-icon">
                  <PikaIcon icon={layer.icon} size={22} strokeWidth={1.6} />
                </div>
                <div className="matrix__row-name">{layer.name}</div>
                <ul className="matrix__chips">
                  {layer.providers.map((p) => (
                    <li key={p} className="matrix__chip">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
