import { useEffect, useRef } from "react";
import { CommandBlock } from "./CommandBlock";
import { HeroPanel } from "./HeroPanel";
import "./Hero.css";

export function Hero() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Plays once on mount — this is the first thing a visitor sees.
    requestAnimationFrame(() => el.classList.add("is-shown"));
  }, []);

  return (
    <section className="hero">
      {/* Stand-in for the final atmospheric photo/texture (user-supplied later). */}
      <div className="hero__ground" data-placeholder-asset="hero-background" aria-hidden />
      <div className="tx-grid-layer hero__grid" aria-hidden />
      <div className="hero__scrim" aria-hidden />

      <div className="hero__content">
        <div className="t-stagger hero__text" ref={textRef}>
          <h1 className="t-stagger-line t-stagger-line--1 hero__headline">
            Every provider is real.
          </h1>
          <p className="t-stagger-line t-stagger-line--2 hero__subhead">
            <code>create-rrstack</code> wires a React Router v8 app to the database, auth, storage,
            and realtime you pick. Every combination installs, typechecks, and builds &mdash;
            nothing here is a stub waiting on you to finish it.
          </p>
          <div className="t-stagger-line t-stagger-line--3 hero__actions">
            <CommandBlock />
            <a
              className="hero__secondary-link"
              href="https://github.com/kartikayshukla17/react-router-template"
              target="_blank"
              rel="noreferrer"
            >
              View the build log
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M3 9 9 3M9 3H4M9 3v5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="hero__panel-wrap">
          <HeroPanel />
        </div>
      </div>
    </section>
  );
}
