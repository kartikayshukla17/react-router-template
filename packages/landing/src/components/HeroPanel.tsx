import type { Act } from "../stageshow-kit";
import { Caret, Prompt, Stage, Window } from "../stageshow-kit";
import "./HeroPanel.css";

const COMMAND = "npm create rrstack@latest";

const LAYERS: Array<[string, string]> = [
  ["Database", "Postgres (Neon)"],
  ["ORM", "Drizzle"],
  ["Auth", "Better Auth"],
  ["Storage", "S3 / R2"],
  ["Realtime", "Supabase Realtime"],
];

type S = {
  typed: string;
  submitted: boolean;
  revealed: number;
  done: boolean;
};

const initial: S = { typed: "", submitted: false, revealed: 0, done: false };
const poster: S = { typed: COMMAND, submitted: true, revealed: LAYERS.length, done: true };

async function script(a: Act<S>) {
  await a.wait(600);
  await a.click("cmdline");
  await a.wait(150);
  await a.type("typed", COMMAND, { interval: 38 });
  await a.wait(300);
  await a.key("enter");
  await a.set({ submitted: true });
  await a.wait(350);

  for (let n = 1; n <= LAYERS.length; n++) {
    await a.wait(420);
    await a.set({ revealed: n });
  }

  await a.wait(300);
  await a.move("rest");
  await a.wait(250);
  await a.set({ done: true });
}

/**
 * The CLI's own session, acted out: a click into the terminal, the install
 * command typed in, the prompts answered one at a time, then the claim this
 * product makes proven in the same frame (installed, typechecked, built).
 * Plays once as the hero comes into view, then holds on that payoff — this
 * is the thing a visitor should still be able to describe an hour later.
 */
export function HeroPanel() {
  return (
    <Stage<S>
      width={560}
      height={288}
      theme="dark"
      accent="#ff6b5b"
      tokens={{
        "--ss-term-bg": "#0e1830",
        "--ss-chrome": "#16233f",
        "--ss-surface": "#1c2b4d",
        "--ss-canvas": "#0e1830",
        "--ss-line": "rgba(244, 237, 224, 0.12)",
        "--ss-term-path": "#8fa6d8",
        "--ss-term-sigil": "#ff6b5b",
        "--ss-text": "#a7b4cc",
        "--ss-text-strong": "#f4ede0",
        "--ss-text-faint": "#8795b0",
      }}
      className="hero-panel-stage"
      initial={initial}
      poster={poster}
      script={script}
      play="once"
      cursor={{ at: { x: 462, y: 268 }, idle: 600 }}
      fill
    >
      {(s) => (
        <Window chrome="terminal" title="~/projects — zsh" lights="grey">
          <Prompt path="~/projects" data-target="cmdline" data-cursor="ibeam">
            {s.typed}
            {!s.submitted && <Caret still={s.typed.length > 0} />}
          </Prompt>

          <div className="hero-panel__gap" />

          {LAYERS.map(([label, value], i) => (
            <div className="hero-panel__row" data-shown={s.revealed > i || undefined} key={label}>
              <span className="hero-panel__diamond" aria-hidden>
                ◇
              </span>
              <span className="hero-panel__label">{label}</span>
              <span className="hero-panel__value">{value}</span>
            </div>
          ))}

          <div className="hero-panel__gap" />

          <div className="hero-panel__row hero-panel__row--done" data-shown={s.done || undefined}>
            <span className="t-success-check" data-state={s.done ? "in" : "out"} aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true">
                <path
                  d="M3 8.5 6.5 12 13 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={20}
                />
              </svg>
            </span>
            <span className="hero-panel__done-text">
              installed &middot; typechecked &middot; built
            </span>
          </div>

          <span data-target="rest" className="hero-panel__rest" aria-hidden />
        </Window>
      )}
    </Stage>
  );
}
