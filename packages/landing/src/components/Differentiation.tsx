import { CheckTickCircleDuoStrokeIcon, LinkChainHorizontalIcon } from "@pikaicons/core-free";
import { PikaIcon } from "@pikaicons/react";
import "./Differentiation.css";

const CHECKS = [
  "Postgres + Drizzle + Better Auth + S3 + Supabase Realtime",
  "MongoDB + Mongoose + Clerk",
  "Convex (database, auth, realtime bundled)",
  "SQLite + Drizzle, zero accounts, zero Docker",
];

export function Differentiation() {
  return (
    <section className="diff">
      <div className="diff__claim">
        <h2 className="diff__heading">
          Most <code>create-*</code> CLIs hand you a landing page and a TODO list.
        </h2>
        <p className="diff__body">
          The real work &mdash; wiring a database, getting auth to actually protect a route, getting
          uploads to actually upload &mdash; usually starts after the generator finishes. Here it
          doesn&rsquo;t: every provider for a given layer implements the exact same interface.
        </p>
        <ul className="diff__interfaces">
          <li>
            <code>getSession</code> / <code>requireUser</code> / <code>signOut</code> for auth
          </li>
          <li>
            <code>getUploadUrl</code> / <code>getDownloadUrl</code> / <code>remove</code> for
            storage
          </li>
          <li>
            <code>subscribe</code> / <code>publish</code> for realtime
          </li>
        </ul>
        <p className="diff__swap">
          <PikaIcon icon={LinkChainHorizontalIcon} size={16} />
          Start with Clerk, move to Supabase Auth later &mdash; your routes don&rsquo;t change, just
          the flag you passed at generation time.
        </p>
      </div>

      <div className="diff__proof">
        <div className="diff__proof-label">verified on every push</div>
        {CHECKS.map((item) => (
          <div className="diff__proof-row" key={item}>
            <PikaIcon icon={CheckTickCircleDuoStrokeIcon} size={17} className="diff__proof-icon" />
            <span>{item}</span>
          </div>
        ))}
        <div className="diff__proof-foot">
          + a weekly job bumps every pinned dependency, verifies the bump against this same matrix,
          and only opens a PR if it passes.
        </div>
      </div>
    </section>
  );
}
