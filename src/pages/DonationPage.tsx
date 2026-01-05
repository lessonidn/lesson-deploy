import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

//-- SLIDER BANNER ---
const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1756102080345-797e02549f97?q=80&w=1170&auto=format&fit=crop",
    link: "/",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600792175842-4fa8ae4b36ba?q=80&w=1167&auto=format&fit=crop",
    link: "/",
  },
];

export default function DonationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === heroSlides.length - 1 ? 0 : prev + 1
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="relative z-40">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                rgba(255,255,255,0.15) 0,
                rgba(255,255,255,0.15) 1px,
                transparent 1px,
                transparent 6px
              )
            `,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-14 text-white grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide mb-4">
              Dukung <span className="text-sky-400 drop-shadow">LESSON</span>
            </h1>
            <p className="text-gray-300 max-w-xl">
              Dukungan Anda membantu kami terus mengembangkan platform bimbel
              online yang berkualitas, terjangkau, dan mudah diakses oleh lebih
              banyak siswa.
            </p>

            <div className="mt-6 flex gap-4">
              <a
                href="https://sociabuzz.com/bimbellesson/tribe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Dukung Sekarang
              </a>

              <Link
                to="/"
                className="inline-block border border-white/20 hover:bg-white/10 px-6 py-3 rounded-xl font-semibold transition"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>

          {/* SLIDER */}
          <div className="relative h-64 md:h-80 overflow-hidden rounded-2xl shadow-xl">
            {heroSlides.map((slide, i) => (
              <img
                key={i}
                src={slide.image}
                alt={`Slide ${i}`}
                className={`
                  absolute inset-0 w-full h-full object-cover
                  transition-opacity duration-700 ease-in-out
                  ${i === currentSlide ? "opacity-100" : "opacity-0"}
                  pointer-events-none
                `}
              />
            ))}

            {/* INDICATORS */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`
                    w-2.5 h-2.5 rounded-full transition
                    ${i === currentSlide
                      ? "bg-white"
                      : "bg-white/40 hover:bg-white/70"}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* WHY SUPPORT */}
        <section className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Akses Edukasi Lebih Luas",
              desc: "Membantu lebih banyak siswa mendapatkan latihan dan materi berkualitas.",
            },
            {
              title: "Pengembangan Fitur",
              desc: "Mendukung pengembangan sistem latihan, ujian, dan evaluasi yang lebih baik.",
            },
            {
              title: "Keberlanjutan Platform",
              desc: "Menjaga LESSON tetap berjalan, stabil, dan terus berkembang.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="
                bg-white/90 backdrop-blur
                rounded-2xl border border-gray-200
                p-6 shadow-sm hover:shadow-lg
                transition
              "
            >
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* HOW TO SUPPORT */}
        <section
          className="
            bg-white/90 backdrop-blur
            rounded-2xl border border-gray-200
            p-8 shadow-sm text-center
          "
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Bagaimana Cara Mendukung?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Anda dapat memberikan dukungan melalui platform Sociabuzz. Setiap
            dukungan, sekecil apa pun, sangat berarti bagi keberlangsungan dan
            pengembangan LESSON.
          </p>

          <a
            href="https://sociabuzz.com/bimbellesson/tribe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
          >
            Donasi via Sociabuzz
          </a>
        </section>

        {/* CLOSING */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Terima Kasih atas Dukungan Anda 🤍
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dukungan Anda membantu kami menciptakan pengalaman belajar yang
            lebih baik bagi generasi penerus.
          </p>
        </section>
      </main>
    </div>
  );
}