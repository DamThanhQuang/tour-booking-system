"use client";

import { SearchBar } from "./SearchBar";

export default function HeroSection() {
  return (
    <section className="relative h-[90vh] w-full overflow-hidden">
    <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
    >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
    </video>

    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

    <div className="relative z-10 flex h-full items-center justify-center text-center text-white px-4">
        <div>
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-6">
            We Find The Best Tours For You
        </h1>

        <p className="mt-4 text-lg md:text-xl text-white/85 max-w-3xl mx-auto">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.
            Velit officia consequat duis enim velit mollit.
        </p>

        <div className="mt-8 flex justify-center gap-4">
            <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow-lg">
            Discover Now
            </button>

            <button className="px-6 py-3 border border-white/80 text-white hover:bg-white/20 rounded-lg">
            View Hot Tours
            </button>
        </div>
        </div>
    </div>
    </section>
  );
}
