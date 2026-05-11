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
