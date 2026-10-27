export default function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-main">
        <p className="eyebrow">Nairobi / Curated wear / Est. 2026</p>
        <h1 className="hero-title" id="hero-title">
          CREE
          <br />
          WRLD<span>.</span>
        </h1>
        <p className="hero-copy">
          Sneakers, streetwear, Old Money and Y2K pieces selected for people who
          move differently. Limited stock. No noise.
        </p>
        <a className="hero-link" href="#shop">
          Shop the collection <span aria-hidden="true">↘</span>
        </a>
      </div>

      <aside className="hero-side" aria-label="Collection notes">
        <div className="hero-index">01 / 04</div>
        <div className="hero-note">
          <p className="eyebrow">The uniform</p>
          <p>
            High-contrast essentials with a second life. Every piece is checked,
            graded, and photographed before it reaches the grid.
          </p>
        </div>
        <dl className="hero-metrics">
          <div>
            <dt>Drop</dt>
            <dd>Live</dd>
          </div>
          <div>
            <dt>Condition</dt>
            <dd>Graded</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>Nairobi</dd>
          </div>
        </dl>
      </aside>
    </section>
  )
}
