import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import styles from "./HomeFooter.module.css";

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none"/></svg>;
}
function FacebookIcon() {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M13.3 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.4V13h2.7v8h3.2z"/></svg>;
}

// Keep social destinations together so the studio's confirmed profile URLs can be updated here.
const socials = [
  { name: "Instagram", href: "https://www.instagram.com/rumistudio/", Icon: InstagramIcon },
  { name: "Facebook", href: "https://www.facebook.com/rumistudio/", Icon: FacebookIcon },
  { name: "WhatsApp", href: "https://wa.me/918796677991", Icon: MessageCircle },
];

export default function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.brandBlock}>
          <Link href="/" aria-label="Rumi Studio home" className={styles.logo}>
            <Image src="/Rumi_RGB_Black.png" alt="Rumi Studio" width={132} height={40} />
          </Link>
          <p>Timeless Chikankari, thoughtfully made for the moments that matter.</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <h2>Explore</h2>
          <Link href="/shop">Shop the collection</Link>
          <a href="#new-arrivals">New arrivals</a>
          <a href="#womens-edit">For her</a>
          <a href="#mens-edit">For him</a>
        </nav>

        <div className={styles.socialBlock}>
          <h2>Stay connected</h2>
          <p>Follow along for new pieces and studio updates.</p>
          <div className={styles.socials}>
            {socials.map(({ name, href, Icon }) => (
              <a key={name} href={href} aria-label={name} title={name} target="_blank" rel="noreferrer">
                <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Rumi Studio</span>
        <Link href="/shop">Discover the collection</Link>
      </div>
    </footer>
  );
}
