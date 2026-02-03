import { Link } from 'react-router-dom'
import logo from '../asset/leaf.png'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================= HEADER ================= */}
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
              Tentang <span className="text-white drop-shadow">LES</span>
                <span className="text-sky-400 glow-son relative">
                  SON
                  <img
                    src={logo}
                    alt="logo daun"
                    className="absolute -top-6 -right-3 h-7"
                  />
                </span>
            </h1>
            <p className="text-gray-300 max-w-xl">
              LESSON adalah platform bimbel online modern yang membantu siswa
              belajar lebih terarah melalui latihan, ujian, dan materi yang
              terstruktur.
            </p>

            <div className="mt-6 flex gap-4">
              <Link
                to="/category"
                className="inline-block bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Mulai Latihan
              </Link>

              <Link
                to="/"
                className="inline-block border border-white/20 hover:bg-white/10 px-6 py-3 rounded-xl font-semibold transition"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>

          <div>
            <img
              src="https://images.unsplash.com/photo-1625111381887-458fce74a923?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Belajar Online"
              className="rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* VISION & MISSION */}
        <section className="grid md:grid-cols-2 gap-8">
          <div
            className="
              bg-white/90 backdrop-blur
              rounded-2xl border border-gray-200
              p-6 shadow-sm
            "
          >
            <h2 className="text-xl font-bold text-gray-800 border-l-4 border-sky-500 pl-3 mb-3">
              Visi Kami
            </h2>
            <p className="text-gray-600">
              Menjadi platform bimbel online terpercaya yang membantu siswa
              Indonesia belajar lebih efektif, mandiri, dan percaya diri
              menghadapi ujian.
            </p>
          </div>

          <div
            className="
              bg-white/90 backdrop-blur
              rounded-2xl border border-gray-200
              p-6 shadow-sm
            "
          >
            <h2 className="text-xl font-bold text-gray-800 border-l-4 border-sky-500 pl-3 mb-3">
              Misi Kami
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Menyediakan latihan dan ujian yang terstruktur</li>
              <li>Membantu siswa belajar dengan ritme yang tepat</li>
              <li>Menghadirkan pengalaman belajar modern & mudah diakses</li>
            </ul>
          </div>
        </section>

        {/* WHY LESSON */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Kenapa Memilih <span className="text-outline">LES</span>
                <span className="text-sky-400 relative">
                  SON
                </span> ?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Materi Terstruktur',
                desc: 'Latihan disusun berdasarkan kategori dan tingkat kesulitan.',
              },
              {
                title: 'Akses Fleksibel',
                desc: 'Belajar kapan saja dan di mana saja tanpa batas.',
              },
              {
                title: 'Fokus ke Hasil',
                desc: 'Dirancang untuk membantu siswa siap menghadapi ujian.',
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
          </div>
        </section>

        {/* CLOSING */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Bersama <span className="text-outline">LES</span>
                <span className="text-sky-400 relative">
                  SON
                </span>, Belajar Jadi Lebih Terarah
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kami percaya bahwa setiap siswa punya potensi besar. Dengan
            pendekatan yang tepat dan latihan yang konsisten, hasil terbaik
            bisa dicapai.
          </p>
        </section>
      </main>
    </div>
  )
}
