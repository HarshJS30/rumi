import Image from "next/image";
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

      <section className="founder-feature" aria-labelledby="founder-heading">
        <div className="founder-feature-layout">
          <div className="story-intro founder-feature-intro">
            <p className="eyebrow">The woman behind Rumi</p>
            <h2 id="founder-heading">Meet the Founder</h2>
          </div>
          <article className="founder-card">
            <div className="founder-identity">
              <div className="founder-mark" aria-hidden="true">MN</div>
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

      <section className="story-ritual" aria-labelledby="piece-story">
        <div className="story-ritual-layout">
          <div className="story-ritual-intro">
            <p className="eyebrow">The Story Behind the Piece</p>
            <h2 id="piece-story">
              <span>Handcrafted with heritage,</span>
              <span>made for today.</span>
            </h2>
            <p className="story-ritual-lead">
              Every Rumi piece begins with a love for the quiet beauty of Indian
              craftsmanship.
            </p>
          </div>
          <figure className="story-image story-image-craft">
            <Image
              src="/kota_chicken_blue_1.jpg"
              width={1200}
              height={800}
              sizes="(max-width: 680px) 92vw, (max-width: 900px) 45vw, 33vw"
              alt="Blue Chikankari fabric, showcasing the detail of the embroidery"
            />
            <figcaption>
              <span>The beauty is in the detail</span>
              <span>Chikankari, by hand</span>
            </figcaption>
          </figure>
          <div className="story-ritual-copy">
            <div className="story-ritual-details">
          <p>
            Rooted in the timeless tradition of Lucknowi Chikankari, each piece
            is thoughtfully chosen for its fabric, silhouette and intricate
            handwork. Some are intentionally delicate, allowing the beauty of the
            embroidery to speak for itself; others are enriched with additional
            handcrafted details that bring a subtle touch of shimmer and
            character.
          </p>
          <p>
            What remains constant is our belief in clothing that feels graceful
            rather than excessive — pieces that carry the charm of traditional
            craftsmanship while fitting naturally into the life of the modern
            Indian woman.
          </p>
          <p>
            Because these are handcrafted pieces, every garment has its own
            character. The occasional variation in stitch, motif or finish is
            part of what makes it unique and a gentle reminder of the hands that
            brought it to life.
          </p>
          <p>
            We hope each Rumi piece becomes more than something you wear — but
            something you reach for, return to, and treasure.
          </p>
            </div>
          </div>
        </div>
      </section>

      <NewArrivals />
      <WomensWear />
      <MensWear />
      <Testimonials />
      <HomeFooter />
    </main>
  );
}
