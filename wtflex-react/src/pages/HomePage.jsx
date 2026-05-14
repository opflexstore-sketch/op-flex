import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import RewardBar from '../components/RewardBar.jsx';
import Categories from '../components/Categories.jsx';
import FeaturedCaps from '../components/FeaturedCaps.jsx';
import NewReleases from '../components/NewReleases.jsx';
import MatchTheMood from '../components/MatchTheMood.jsx';
import ShopTheLook from '../components/ShopTheLook.jsx';
import Strip from '../components/Strip.jsx';
import Usps from '../components/Usps.jsx';
import Newsletter from '../components/Newsletter.jsx';

export default function HomePage() {
  const location = useLocation();
  useEffect(() => {
    const id = location.state?.scrollTo;
    if (!id) return;
    // Wait one frame so the section is mounted before we scroll.
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.state]);

  return (
    <>
      <Hero />
      <RewardBar />
      <Categories />
      <FeaturedCaps />
      <NewReleases />
      <MatchTheMood />
      <ShopTheLook />
      <Strip />
      <Usps />
      <Newsletter />
    </>
  );
}
