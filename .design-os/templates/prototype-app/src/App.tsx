import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <p className="eyebrow">Outbound prototype · __FEATURE__</p>
        <h1>Validate the interaction, not the polish</h1>
        <p className="lede">
          Tokens come from your project design system via program knowledge. Do not restyle from
          taste — cite constraints in BRAND.md and OPTIONS.md.
        </p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>Primary action</h2>
          <p className="muted">
            Replace this screen with the flow from your PRD. Keep CSS variables from tokens.css.
          </p>
          <button type="button" className="btn-primary">
            Continue
          </button>
        </section>

        <section className="card card-secondary">
          <h2>Secondary panel</h2>
          <ul className="stack">
            <li>
              <span className="label">Status</span>
              <span className="value">Draft option</span>
            </li>
            <li>
              <span className="label">Branch</span>
              <span className="value mono">proto/__SLUG__/__FEATURE__/base</span>
            </li>
            <li>
              <span className="label">Hypothesis</span>
              <span className="value">See OPTIONS.md</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
