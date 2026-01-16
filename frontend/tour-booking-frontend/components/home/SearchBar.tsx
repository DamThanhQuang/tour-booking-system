"use client";

import { useState } from 'react';
import { MapPin, Users, Calendar } from 'lucide-react';

export function SearchBar() {
  const [formData, setFormData] = useState({
    location: "",
    guests: "",
    date: ""
  });

  const handleSearch = () => {
    // Implement search logic here
    console.log("Searching with data:", formData);
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-3 md:p-4">
      <div className="flex items-center gap-3 md:gap-5">
        {/* Location */}
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-cyan-600 font-semibold text-xs">
            <MapPin size={16} />
            Location
          </label>
          <input
            type="text"
            placeholder="Search For A Destination"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg border-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
          />
        </div>

        <div className='w-[1px] h-4 bg-gray-200'></div>

        {/* Guests */}
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-cyan-600 font-semibold text-xs">
            <Users size={16} />
            Guests
          </label>
          <input
            type="text"
            placeholder="How many Guests?"
            value={formData.guests}
            onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 placeholder:text-gray-400 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
          />
        </div>

        <div className='w-[1px] h-4 bg-gray-200'></div>

        {/* Date */}
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-cyan-600 font-semibold text-xs">
            <Calendar size={16} />
            Date
          </label>
          <input
            type="text"
            placeholder="Pick a date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 placeholder:text-gray-400 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="bg-yellow-300 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-5 rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
        >
          Search
        </button>
      </div>
    </div>
  );
}