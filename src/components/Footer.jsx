export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="info-grid">
        <section id="delivery" aria-labelledby="delivery-title">
          <p className="eyebrow">01 / Delivery</p>
          <h2 id="delivery-title">Nairobi and beyond.</h2>
          <p>
            Add your delivery area at checkout. We call every customer to
            confirm the exact fee and timing before dispatch.
          </p>
        </section>
        <section id="contact" aria-labelledby="contact-title">
          <p className="eyebrow">02 / Contact</p>
          <h2 id="contact-title">Questions?</h2>
          <p>
            Send a message to @creewrld with the product name and size. Stock
            moves quickly, so we will confirm what is still available.
          </p>
        </section>
        <section aria-labelledby="promise-title">
          <p className="eyebrow">03 / Promise</p>
          <h2 id="promise-title">Checked, graded, real.</h2>
          <p>
            Every item carries its condition and available sizes so you know
            exactly what you are ordering.
          </p>
        </section>
      </div>

      <div className="footer-bottom">
        <span className="footer-brand">CREE WRLD</span>
        <span>Curated streetwear & lifestyle</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
