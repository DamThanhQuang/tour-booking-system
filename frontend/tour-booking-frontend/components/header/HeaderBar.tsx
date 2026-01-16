"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";
//import MobileMenu from "./MobileMenu";

export default function HeaderBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-transparent shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-white-500">
          TravelBooking
        </Link>

        {/* Desktop menu */}
        <nav className="hidden md:flex items-center gap-8">
            <NavLinks/>
            <UserMenu/>
        </nav>

        {/* Mobile menu */}
        {/* <div className="md:hidden">
          <MobileMenu />
        </div> */}
      </div>
    </header>
  );
}
