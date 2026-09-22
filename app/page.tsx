import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import NewArrivals from "../components/NewArrivals";
import WomensWear from "../components/WomensWear";
import MensWear from "../components/MensWear";
import Testimonials from "../components/Testimonials";
import "./globals.css";


export default function App() {
  return (
    <main id="top">
      <Navbar />
      <Hero />
      <NewArrivals />
      <WomensWear />
      <MensWear />
      <Testimonials />
    </main>
  );
}