import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import NewArrivals from "../components/NewArrivals";
import WomensWear from "../components/WomensWear";
import MensWear from "../components/MensWear";
import Testimonials from "../components/Testimonials";
import HomeFooter from "../components/HomeFooter";

export default function HomePage() {
  return (
    <main id="top">
      <Navbar />
      <Hero />

      <NewArrivals />
      <WomensWear />
      <MensWear />

      <section className="brand-story" aria-labelledby="story-heading">
        <div className="story-intro">
          <p className="eyebrow">Our Story</p>
          <h2 id="story-heading">Fashion Woven With Heritage.</h2>
          <p className="story-lead">
            There is something quietly beautiful about a garment that carries
            the work of human hands.
          </p>
        </div>
        <div className="story-body-columns">
          <div className="story-copy-left">
            <p className="story-body story-body-one">
            At Rumi, we celebrate the timeless artistry of Lucknowi
            Chikankari &mdash; a craft shaped over generations, where delicate
            needlework, intricate motifs and the patience of skilled
            artisans transform fabric into something truly special. Rooted in
            the cultural heritage of Lucknow, Chikankari is a craft of
            remarkable delicacy, with its floral motifs, fine stitches and
            intricate jaali work.
            </p>
            <p className="story-body story-body-two">
            For us, however, Chikankari is more than an embroidery
            technique. It is about the hands behind the garment, the time
            invested in it, and the quiet individuality that comes with
            something made by hand. A slight variation in a stitch or motif
            is not an imperfection &mdash; it is a reminder that the piece was
            created by an artisan, not a machine.
            </p>
          </div>
          <div className="story-copy-right">
            <p className="story-body story-body-three">
            Even our name, Rumi, draws from the spirit of Lucknow. The
            magnificent Rumi Darwaza stands as an enduring symbol of the
            city&apos;s architectural beauty and craftsmanship. And the
            evocative poetry of Jalaluddin Rumi inspires us in another way &mdash;
            to find beauty in simplicity, meaning in detail, and timelessness
            in things created with feeling.
            </p>
            <p className="story-body story-body-four">
            This is the sensibility we bring to our collections: traditional
            craftsmanship thoughtfully interpreted for the woman of today.
            We are inspired by the poetry of old Lucknow, its flowers and
            architecture, its quiet elegance, and by the belief that
            beautiful clothing need not be loud to be memorable.
            </p>
            <p className="story-body story-body-five">
            When you choose a Rumi piece, you are choosing more than an
            outfit. You are choosing a little piece of living heritage,
            thoughtfully brought into the present.
            </p>
          </div>
        </div>
      </section>

      <section className="founder-feature" aria-labelledby="founder-heading">
        <div className="founder-feature-layout">
          <div className="story-intro founder-feature-intro">
            <p className="eyebrow">The woman behind Rumi</p>
            <h2 id="founder-heading">Meet the Founder</h2>
          </div>
          <article className="founder-card">
            <div className="founder-identity">
              <figure className="founder-photo-placeholder">
                <div className="founder-photo-placeholder-frame" aria-hidden="true">
                  <span>Founder portrait</span>
                </div>
              </figure>
              <p className="story-label">Founder, Rumi Ethnic</p>
              <h3>Madeeha Naaz</h3>
            </div>
            <div className="founder-story">
              <blockquote>
                &ldquo;Rumi began with a simple thought: what if a little piece of
                Lucknow could find its way into the wardrobes of women
                everywhere?&rdquo;
              </blockquote>
              <div className="founder-biography">
                <p>
                  Madeeha comes from a diverse academic and professional
                  background, having studied Biotechnology, Business
                  Administration, Education and Economics, and spent years as a
                  teacher and academician. After moving to Delhi, she began to
                  recognise a genuine gap &mdash; the beauty and craftsmanship of
                  authentic Lucknowi Chikankari deserved to be experienced by
                  women far beyond Lucknow.
                </p>
                <p>
                  That belief became Rumi. Away from Rumi, Madeeha is a mother to
                  two young daughters and someone known for her warmth,
                  hospitality and love for bringing people together.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <Testimonials />
      <HomeFooter />
    </main>
  );
}
