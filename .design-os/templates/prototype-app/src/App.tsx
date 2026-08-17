import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <p className="eyebrow">Outbound prototype · __FEATURE__</p>
        <h1>__PRD_HEADLINE__</h1>
        <p className="lede">__PRD_LEDE__</p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>Primary action</h2>
          <p className="muted">
            __PRD_FOCUS__ See <code>RATIONALE.md</code> for users, goals, and constraints from the PRD.
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
