import HeroSection from "@/components/home/HeroSection";
import PopularCities from "@/components/home/PopularCity";
import { SearchBar } from "@/components/home/SearchBar";

export default function HomePage() {
    return (
        <>
            <HeroSection/>
            <div className="flex justify-center my-[-60px] z-20 relative">
                <SearchBar />
            </div>
            <PopularCities/>
        </>
    )
}