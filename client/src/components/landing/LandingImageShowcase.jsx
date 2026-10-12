import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  {
    src: "/images/landpage/Coastal_craftsman.jpg",
    alt: "Coastal craftsman home",
  },
  { src: "/images/landpage/Coastal_open.jpg", alt: "Open coastal home" },
  {
    src: "/images/landpage/Mid-century_modern.jpg",
    alt: "Mid-century modern interior",
  },
  {
    src: "/images/landpage/Mid-century_modern_house.jpg",
    alt: "Mid-century modern house",
  },
  { src: "/images/landpage/Modern_apartment.jpg", alt: "Modern apartment" },
  {
    src: "/images/landpage/Patio_backyard.jpg",
    alt: "Property patio and backyard",
  },
  { src: "/images/landpage/Townhouse_exterior.jpg", alt: "Townhouse exterior" },
];

const LandingImageShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  return (
    <section
      id="about"
      className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
            Find a place you will love
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Explore beautiful properties and manage your rental journey with
            MucoProps.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-primary/10">
          {images.map((image, index) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className={`w-full h-[280px] sm:h-[420px] lg:h-[520px] object-cover transition-opacity duration-700 ${
                index === activeIndex
                  ? "opacity-100"
                  : "opacity-0 absolute inset-0"
              }`}
            />
          ))}

          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-3 text-white hover:bg-black/65 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-3 text-white hover:bg-black/65 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-white" : "w-2.5 bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingImageShowcase;
