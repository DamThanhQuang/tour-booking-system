export default function PopularCities() {
  const cities = [
    'New York',
    'California',
    'Alaska',
    'Sydney',
    'Dubai',
    'London',
    'Tokyo',
    'Delhi',
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Explore Popular Cities
        </h2>
        <p className="mt-4 text-gray-500 max-w-xl mx-auto">
          Discover top destinations and unforgettable experiences
        </p>

        {/* Tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {cities.map((city) => (
            <button
              key={city}
              className={`px-5 py-2 rounded-full border text-sm font-medium transition
                ${
                  city === 'Alaska'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Alaska card */}
        {/* <AlaskaSection /> */}
      </div>
    </section>
  );
}
