import { useNavigate } from 'react-router-dom'

export default function UpgradeMember() {
  const navigate = useNavigate()

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-14">

        {/* ================= HERO ================= */}
        <section className="text-center mb-14">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Tingkatkan Kualitas Belajarmu dengan Member Premium
          </h1>

          <p className="text-gray-600 max-w-3xl mx-auto mb-8">
            Member Premium dirancang untuk siswa yang ingin belajar lebih terarah,
            memahami konsep dengan baik, dan memiliki progres belajar yang jelas.
          </p>

          <button
            onClick={() => navigate('/member')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded text-lg"
          >
            Upgrade ke Member Premium
          </button>
        </section>

        {/* ================= WHY UPGRADE ================= */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded shadow-sm">
            <h3 className="font-semibold text-lg mb-2">
              Latihan Lebih Terstruktur
            </h3>
            <p className="text-gray-600 text-sm">
              Soal disusun berdasarkan tingkat kesulitan dan tujuan pembelajaran,
              bukan acak.
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow-sm">
            <h3 className="font-semibold text-lg mb-2">
              Pembahasan Lengkap
            </h3>
            <p className="text-gray-600 text-sm">
              Setiap soal dilengkapi pembahasan yang membantu siswa memahami konsep,
              bukan sekadar jawaban.
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow-sm">
            <h3 className="font-semibold text-lg mb-2">
              Progres Belajar Tersimpan
            </h3>
            <p className="text-gray-600 text-sm">
              Hasil latihan tersimpan dan bisa digunakan untuk evaluasi perkembangan
              belajar.
            </p>
          </div>
        </section>

        {/* ================= COMPARISON ================= */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Perbedaan Akses
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Public */}
            <div className="bg-white border rounded p-6">
              <h3 className="font-semibold text-lg mb-4">
                Akses Umum
              </h3>
              <ul className="space-y-3 text-gray-600 text-sm">
                <li>✔ Melihat judul latihan</li>
                <li>✔ Akses latihan terbatas</li>
                <li>✖ Pembahasan lengkap</li>
                <li>✖ Latihan khusus</li>
                <li>✖ Riwayat & progres</li>
              </ul>
            </div>

            {/* Member */}
            <div className="bg-indigo-50 border border-indigo-200 rounded p-6">
              <h3 className="font-semibold text-lg mb-4 text-indigo-700">
                Member Premium
              </h3>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li>✔ Semua latihan terbuka</li>
                <li>✔ Latihan khusus member</li>
                <li>✔ Pembahasan lengkap</li>
                <li>✔ Progres belajar tersimpan</li>
                <li>✔ Belajar lebih terarah</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= MEMBER ONLY SAMPLE ================= */}
        <section className="mb-16 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Akses Materi Khusus Member
          </h2>

          <p className="text-gray-600 mb-6">
            Beberapa latihan hanya tersedia untuk Member Premium
            karena dilengkapi pembahasan dan evaluasi lengkap.
          </p>

          <div className="inline-block bg-white border rounded px-6 py-4">
            <p className="font-medium">🔒 Latihan Pecahan Lanjutan</p>
            <p className="text-sm text-gray-500">
              Khusus Member – Pembahasan & evaluasi lengkap
            </p>
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="text-center bg-white rounded p-10 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">
            Siap Belajar Lebih Serius?
          </h2>

          <p className="text-gray-600 mb-6">
            Upgrade ke Member Premium dan dapatkan akses penuh ke
            latihan, pembahasan, dan progres belajar.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/member')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded"
            >
              Upgrade Sekarang
            </button>

            <button
              onClick={() => navigate('/')}
              className="border px-6 py-3 rounded text-gray-700 hover:bg-gray-100"
            >
              Kembali ke Beranda
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
