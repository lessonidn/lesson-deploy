"use client";
import { useState } from "react";

export default function RequestSoalWA() {
  const [open, setOpen] = useState(false);
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");

  const phone = "6285122229986"; // GANTI nomor WA
  const message = `Halo Admin,%0ASaya ingin request soal:%0A• Kelas: ${kelas || "-"}%0A• Mapel: ${mapel || "-"}`;

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 
        bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg 
        hover:-translate-y-1 transition"
      >
        <img src="/whatsapp.png" className="w-6 h-6" />
        Request Soal
      </button>

      {/* POPUP */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[9999] w-72 
        bg-white rounded-xl shadow-xl border p-4 space-y-3">

          <div className="flex justify-between items-center">
            <h4 className="font-semibold flex items-center gap-2">
              <img src="/leaf.png" className="w-5 h-5" />
              Request Soal</h4>
            <button onClick={() => setOpen(false)} className="text-gray-400">✕</button>
          </div>

          {/* KELAS */}
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Pilih Kelas</option>
            <option>Kelas 1</option>
            <option>Kelas 2</option>
            <option>Kelas 3</option>
            <option>Kelas 4</option>
            <option>Kelas 5</option>
            <option>Kelas 6</option>
            <option>Kelas 7</option>
            <option>Kelas 8</option>
            <option>Kelas 9</option>
            <option>Kelas 10</option>
            <option>Kelas 11</option>
            <option>Kelas 12</option>
          </select>

          {/* MAPEL */}
          <select
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Pilih Mapel</option>
            <option>Matematika</option>
            <option>Bahasa Indonesia</option>
            <option>Bahasa Inggris</option>
            <option>IPA</option>
            <option>IPS</option>
            <option>Fisika</option>
            <option>Kimia</option>
            <option>Biologi</option>
          </select>

          {/* CTA */}
          <a
            href={`https://wa.me/${phone}?text=${message}`}
            target="_blank"
            className="block text-center bg-[#25D366] text-white 
            py-2 rounded-md font-semibold hover:opacity-90"
          >
            Kirim via WhatsApp
          </a>
        </div>
      )}
    </>
  );
}
