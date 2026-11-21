import { CommandBlock } from "./CommandBlock";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__cta">
        <h2 className="site-footer__heading">Scaffold the next one for real.</h2>
        <div className="site-footer__command">
          <CommandBlock />
        </div>
      </div>

      <div className="site-footer__links">
        <div className="site-footer__col">
          <div className="site-footer__col-title">create-rr-stack</div>
          <a
            href="https://github.com/kartikayshukla17/react-router-template"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://github.com/kartikayshukla17/react-router-template/blob/main/PRD.md"
            target="_blank"
            rel="noreferrer"
          >
            PRD
          </a>
          <a
            href="https://github.com/kartikayshukla17/react-router-template/tree/main/tickets"
            target="_blank"
            rel="noreferrer"
          >
            Build log (tickets)
          </a>
        </div>
        <div className="site-footer__col">
          <div className="site-footer__col-title">Package</div>
          <a
            href="https://github.com/kartikayshukla17/react-router-template/tree/main/packages/create-rr-stack"
            target="_blank"
            rel="noreferrer"
          >
            packages/create-rr-stack
          </a>
          <span className="site-footer__meta">MIT licensed</span>
        </div>
      </div>

      <div className="site-footer__legal">
        &copy; {new Date().getFullYear()} create-rr-stack. Built in public, ticket by ticket.
      </div>
    </footer>
  );
}
