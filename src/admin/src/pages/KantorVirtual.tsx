// KantorVirtual.tsx — Halaman Kantor Virtual 3D untuk Vite + React (BimbelLesson)
// Port dari kantor-live.html (versi satu-file HTML) ke komponen React .tsx.
//
// Cara pakai:
//   1. npm i three        (dan untuk TypeScript: npm i -D @types/three)
//   2. Taruh file ini + KantorVirtual.css di src/pages/ (atau src/components/)
//   3. Daftarkan route, mis. di router:  <Route path="/kantor" element={<KantorVirtual />} />
//
// Backend TIDAK berubah sama sekali:
//   - State kantor dibaca dari bucket publik Supabase "office-state/state.json" (di-push VM tiap ±1 menit)
//   - Perintah  -> POST /rest/v1/office_commands   (perlu sql_perintah.sql — file & isi SAMA seperti sebelumnya)
//   - Upload    -> POST bucket "office-uploads" + POST /rest/v1/office_uploads
//                  (perlu sql_upload.sql — file & isi SAMA seperti sebelumnya, tidak perlu diganti)

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./KantorVirtual.css";

const SB_URL = "https://lczaqdhmgkeauazzxwxa.supabase.co";
const STATE_URL = SB_URL + "/storage/v1/object/public/office-state/state.json";
const HASIL_JSON_URL = SB_URL + "/storage/v1/object/public/office-state/hasil.json";
const HASIL_MD_URL = SB_URL + "/storage/v1/object/public/office-state/hasil-terbaru.md";

type HasilInfo = { proyek: string; folder: string; file: string; selesai: string };

/* ================= Tipe data state.json ================= */
type Tugas = {
  id: number;
  judul: string;
  divisi: string;
  status: string; // antre | proses | review | selesai
  catatan_review?: string;
};
type AgentState = {
  nama: string;
  emoji: string;
  meja: string;
  status: string; // kerja | review | selesai | nganggur
  lagi?: string;
};
type KantorState = {
  proyek?: string;
  tugas: Tugas[];
  log: string[];
  agents: Record<string, AgentState>;
};

const KOLOM: Array<[string, string]> = [
  ["antre", "📥 Antre"],
  ["proses", "⚙️ Proses"],
  ["review", "🧐 Review"],
  ["selesai", "✅ Selesai"],
];
const WARNA_AGENT: Record<string, number> = {
  manajer: 0x3b82f6,
  riset: 0xa855f7,
  eksekutor: 0xf97316,
  reviewer: 0xec4899,
};
const WARNA_RING: Record<string, number> = {
  kerja: 0x34d399,
  review: 0xfbbf24,
  selesai: 0x60a5fa,
  nganggur: 0x64748b,
};
const DESK_X: Record<string, number> = { manajer: -8.4, riset: -2.8, eksekutor: 2.8, reviewer: 8.4 };
const RAPAT_SPOT: Array<[number, number]> = [[-1.3, 0.4], [1.3, 0.4], [-1.3, 2.6], [1.3, 2.6]];
const SOFA_SPOT: Array<[number, number]> = [[7.4, 4.6], [8.7, 4.6], [9.9, 4.6], [8.7, 6.4]];
const IDLE_SPOT: Array<[number, number]> = [[-9.2, 4.4], [-4.5, 6.6], [5.8, 3.6], [-10.6, -0.5], [0, -6.2]];

type SceneFn = (s: KantorState, tik: number) => void;

export default function KantorVirtual() {
  const [judul, setJudul] = useState("Memuat…");
  const [data, setData] = useState<KantorState | null>(null);

  // Form perintah
  const [sbKey, setSbKey] = useState(() => localStorage.getItem("kantor_sbKey") || "");
  const [kode, setKode] = useState(() => localStorage.getItem("kantor_kode") || "");
  const [perintah, setPerintah] = useState("");
  const [statusKirim, setStatusKirim] = useState("");

  // Form upload exam
  const fileRef = useRef<HTMLInputElement>(null);
  const [namaFile, setNamaFile] = useState("");
  const [catatan, setCatatan] = useState("");
  const [statusUpload, setStatusUpload] = useState("");

  // Hasil terakhir (laporan akhir proyek terakhir, di-push VM ke bucket)
  const [hasil, setHasil] = useState<HasilInfo | null>(null);
  const [previewHasil, setPreviewHasil] = useState(false);
  const [teksHasil, setTeksHasil] = useState("");

  const sceneRef = useRef<HTMLDivElement>(null);
  const gagalRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const sceneFnRef = useRef<SceneFn | null>(null);
  const tikRef = useRef(0);

  /* ================= Ambil state kantor tiap 2 detik ================= */
  useEffect(() => {
    let hidup = true;
    const muat = async () => {
      try {
        const r = await fetch(STATE_URL + "?ts=" + Date.now());
        if (!r.ok) throw new Error("state tidak terbaca");
        const s = (await r.json()) as KantorState;
        if (!hidup) return;
        tikRef.current++;
        setData(s);
        setJudul("Proyek: " + (s.proyek || "-"));
        sceneFnRef.current?.(s, tikRef.current);
      } catch {
        if (hidup) setJudul("Kantor kosong — belum ada proyek berjalan.");
      }
    };
    muat();
    const iv = setInterval(muat, 2000);
    return () => {
      hidup = false;
      clearInterval(iv);
    };
  }, []);

  // Log selalu scroll ke bawah
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data]);

  /* ================= Hasil terakhir: cek manifest tiap 15 detik ================= */
  useEffect(() => {
    let hidup = true;
    const muatHasil = async () => {
      try {
        const r = await fetch(HASIL_JSON_URL + "?ts=" + Date.now());
        if (!r.ok) return;
        const h = (await r.json()) as HasilInfo;
        if (hidup && h && h.file) setHasil(h);
      } catch {
        /* belum ada hasil — tombol tetap nonaktif */
      }
    };
    muatHasil();
    const iv = setInterval(muatHasil, 15000);
    return () => {
      hidup = false;
      clearInterval(iv);
    };
  }, []);

  const bukaPreviewHasil = async () => {
    setTeksHasil("Memuat laporan…");
    setPreviewHasil(true);
    try {
      const r = await fetch(HASIL_MD_URL + "?ts=" + Date.now());
      if (!r.ok) throw new Error("gagal memuat");
      setTeksHasil(await r.text());
    } catch {
      setTeksHasil("❌ Laporan tidak bisa dimuat. Coba lagi sebentar lagi.");
    }
  };

  /* ================= Kirim perintah ke kantor ================= */
  const kirimPerintah = async () => {
    const key = sbKey.trim();
    const kd = kode.trim();
    const txt = perintah.trim();
    if (!key) { setStatusKirim("Isi dulu kunci anon Supabase (Dashboard → Settings → API → anon public)."); return; }
    if (!kd) { setStatusKirim("Isi dulu kode rahasia kantor."); return; }
    if (!txt) { setStatusKirim("Tulis dulu perintahnya."); return; }
    localStorage.setItem("kantor_sbKey", key);
    localStorage.setItem("kantor_kode", kd);
    setStatusKirim("📤 Mengirim…");
    try {
      const r = await fetch(SB_URL + "/rest/v1/office_commands", {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ perintah: txt, kode: kd }),
      });
      if (r.ok) {
        setStatusKirim("✅ Terkirim! Kantor menjemput dalam ±1–2 menit — pantau papan tugas & log di bawah.");
        setPerintah("");
      } else if (r.status === 401 || r.status === 403) {
        setStatusKirim("❌ Kunci anon salah / belum berizin (401/403).");
      } else if (r.status === 404) {
        setStatusKirim("❌ Tabel office_commands belum ada — SQL-nya belum dijalankan di dashboard.");
      } else {
        setStatusKirim("❌ Gagal (" + r.status + "). Coba lagi.");
      }
    } catch (e) {
      setStatusKirim("❌ Gagal terkirim: " + (e as Error).message);
    }
  };

  /* ================= Upload lembar exam ================= */
  const pilihFile = () => {
    const f = fileRef.current?.files?.[0];
    setNamaFile(f ? "📎 " + f.name + " (" + Math.max(1, Math.round(f.size / 1024)) + " KB)" : "");
  };

  const kirimUpload = async () => {
    const key = (sbKey || localStorage.getItem("kantor_sbKey") || "").trim();
    const kd = (kode || localStorage.getItem("kantor_kode") || "").trim();
    const f = fileRef.current?.files?.[0];
    if (!key) { setStatusUpload("Isi dulu kunci anon Supabase di blok perintah di atas."); return; }
    if (!kd) { setStatusUpload("Isi dulu kode rahasia kantor di blok perintah di atas."); return; }
    if (!f) { setStatusUpload("Pilih dulu file lembar exam-nya."); return; }
    if (f.size > 50 * 1024 * 1024) { setStatusUpload("❌ File terlalu besar (maks 50 MB)."); return; }
    localStorage.setItem("kantor_sbKey", key);
    localStorage.setItem("kantor_kode", kd);
    const aman = f.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const path = Date.now() + "-" + aman;
    setStatusUpload("📤 Mengupload file…");
    try {
      const r1 = await fetch(SB_URL + "/storage/v1/object/office-uploads/" + encodeURIComponent(path), {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: "Bearer " + key,
          "Content-Type": f.type || "application/octet-stream",
          "x-upsert": "false",
        },
        body: f,
      });
      if (!r1.ok) {
        if (r1.status === 401 || r1.status === 403)
          setStatusUpload("❌ Upload ditolak (401/403) — kunci anon salah atau sql_upload.sql belum dijalankan.");
        else if (r1.status === 404)
          setStatusUpload("❌ Bucket office-uploads belum ada — jalankan sql_upload.sql dulu di dashboard Supabase.");
        else if (r1.status === 409)
          setStatusUpload("❌ Nama file bentrok — coba klik Upload sekali lagi.");
        else setStatusUpload("❌ Upload gagal (" + r1.status + "). Coba lagi.");
        return;
      }
      setStatusUpload("📤 File terupload — mencatat antrean…");
      const r2 = await fetch(SB_URL + "/rest/v1/office_uploads", {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          nama_file: f.name,
          storage_path: path,
          mime: f.type || "",
          ukuran: f.size,
          catatan: catatan.trim(),
          kode: kd,
        }),
      });
      if (!r2.ok) {
        setStatusUpload(
          "⚠️ File terupload tapi pencatatan antrean gagal (" + r2.status +
            ") — tabel office_uploads mungkin belum dibuat (sql_upload.sql). Kabari Muse di chat."
        );
        return;
      }
      setStatusUpload("✅ Terkirim! Agent menjemput dalam ±2–5 menit, soal ditulis sebagai Draft di BimbelLesson, hasilnya dikabari lewat chat.");
      if (fileRef.current) fileRef.current.value = "";
      setNamaFile("");
      setCatatan("");
    } catch (e) {
      setStatusUpload("❌ Gagal terkirim: " + (e as Error).message);
    }
  };

  /* ================= Adegan 3D (Three.js) ================= */
  useEffect(() => {
    const wadah = sceneRef.current;
    if (!wadah) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      if (gagalRef.current) gagalRef.current.style.display = "block";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wadah.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f1a);
    scene.fog = new THREE.Fog(0x0b0f1a, 34, 60);
    const kamera = new THREE.PerspectiveCamera(45, 2, 0.1, 200);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const matahari = new THREE.DirectionalLight(0xfff2d8, 0.95);
    matahari.position.set(10, 16, 8);
    matahari.castShadow = true;
    matahari.shadow.mapSize.set(2048, 2048);
    matahari.shadow.camera.left = -16;
    matahari.shadow.camera.right = 16;
    matahari.shadow.camera.top = 16;
    matahari.shadow.camera.bottom = -16;
    scene.add(matahari);
    const isi = new THREE.DirectionalLight(0xbcd4ff, 0.25);
    isi.position.set(-8, 10, -6);
    scene.add(isi);

    const M = {
      lantai: new THREE.MeshStandardMaterial({ color: 0x3b4a75, roughness: 0.9 }),
      karpet: new THREE.MeshStandardMaterial({ color: 0x27335a, roughness: 1 }),
      dinding: new THREE.MeshStandardMaterial({ color: 0x232c47, roughness: 0.95 }),
      kayu: new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.7 }),
      kayuGelap: new THREE.MeshStandardMaterial({ color: 0x5f4630, roughness: 0.7 }),
      putih: new THREE.MeshStandardMaterial({ color: 0xe8ecf4, roughness: 0.6 }),
      layar: new THREE.MeshStandardMaterial({ color: 0x0e2233, emissive: 0x3d7ea6, emissiveIntensity: 0.8 }),
      plastik: new THREE.MeshStandardMaterial({ color: 0x39415e, roughness: 0.6 }),
      daun: new THREE.MeshStandardMaterial({ color: 0x2f9e6e, roughness: 0.9 }),
      pot: new THREE.MeshStandardMaterial({ color: 0xb0562f, roughness: 0.8 }),
      sofa: new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.95 }),
      kulit: new THREE.MeshStandardMaterial({ color: 0xf2c79b, roughness: 0.65 }),
      rambut: new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.85 }),
    };
    function kotak(
      w: number, h: number, d: number, mat: THREE.Material,
      x: number, y: number, z: number, parent?: THREE.Object3D
    ) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      (parent || scene).add(m);
      return m;
    }

    /* --- Ruangan --- */
    const lantaiMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 16), M.lantai);
    lantaiMesh.position.y = -0.15;
    lantaiMesh.receiveShadow = true;
    scene.add(lantaiMesh);
    const karpet = new THREE.Mesh(new THREE.CircleGeometry(4.6, 40), M.karpet);
    karpet.rotation.x = -Math.PI / 2;
    karpet.position.set(0, 0.012, 1.5);
    karpet.receiveShadow = true;
    scene.add(karpet);
    kotak(24, 4.4, 0.3, M.dinding, 0, 2.2, -8.1); // dinding belakang
    kotak(0.3, 4.4, 16, M.dinding, -12.1, 2.2, 0); // dinding kiri
    for (let i = 0; i < 4; i++) {
      const j = kotak(
        2.6, 1.7, 0.1,
        new THREE.MeshStandardMaterial({ color: 0x9fc6ee, emissive: 0x6ea8dd, emissiveIntensity: 0.55 }),
        -8.4 + i * 5.6, 2.7, -7.93
      );
      j.castShadow = false;
    }
    // papan tulis di dinding kiri
    (() => {
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = 320;
      const c = cv.getContext("2d")!;
      c.fillStyle = "#f4f7f2"; c.fillRect(0, 0, 512, 320);
      c.fillStyle = "#274156"; c.font = "bold 44px sans-serif"; c.fillText("KANTOR VIRTUAL", 36, 70);
      c.font = "30px sans-serif"; c.fillStyle = "#3d6076";
      c.fillText("• pecah proyek jadi tugas", 36, 140);
      c.fillText("• kerjakan satu per satu", 36, 195);
      c.fillText("• review dulu, baru selesai ✔", 36, 250);
      const tex = new THREE.CanvasTexture(cv);
      const papan = new THREE.Mesh(
        new THREE.PlaneGeometry(4.6, 2.9),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 })
      );
      papan.position.set(-11.93, 2.3, -1);
      papan.rotation.y = Math.PI / 2;
      scene.add(papan);
    })();

    /* --- Meja kerja + kursi + monitor --- */
    function buatMeja(x: number, z: number) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      scene.add(g);
      kotak(2.5, 0.12, 1.15, M.kayu, 0, 0.98, 0, g);
      kotak(0.12, 0.98, 1.05, M.kayuGelap, -1.15, 0.49, 0, g);
      kotak(0.12, 0.98, 1.05, M.kayuGelap, 1.15, 0.49, 0, g);
      const mon = kotak(1.05, 0.62, 0.06, M.layar, 0, 1.42, -0.28, g);
      mon.rotation.x = -0.06;
      kotak(0.14, 0.36, 0.14, M.plastik, 0, 1.2, -0.28, g);
      kotak(0.8, 0.04, 0.3, M.plastik, 0, 1.06, 0.18, g);
      kotak(0.62, 0.1, 0.58, M.plastik, 0, 0.55, 0.95, g);
      kotak(0.62, 0.75, 0.1, M.plastik, 0, 1.05, 1.22, g);
      kotak(0.09, 0.5, 0.09, M.plastik, 0, 0.25, 0.95, g);
      return g;
    }
    for (const dx of Object.values(DESK_X)) buatMeja(dx, -5.6);

    /* --- Meja rapat --- */
    (() => {
      const g = new THREE.Group();
      g.position.set(0, 0, 1.5);
      scene.add(g);
      kotak(3.6, 0.12, 1.8, M.kayu, 0, 0.92, 0, g);
      kotak(0.14, 0.92, 1.5, M.kayuGelap, -1.6, 0.46, 0, g);
      kotak(0.14, 0.92, 1.5, M.kayuGelap, 1.6, 0.46, 0, g);
      kotak(0.5, 0.3, 0.35, M.putih, -0.8, 1.13, 0, g);
      kotak(0.5, 0.06, 0.35, new THREE.MeshStandardMaterial({ color: 0xd64545 }), 0.7, 1.01, 0.2, g);
      for (const [sx, sz] of [[-1.3, -1.35], [1.3, -1.35], [-1.3, 1.35], [1.3, 1.35]] as Array<[number, number]>)
        kotak(0.5, 0.45, 0.5, M.plastik, sx, 0.23, sz, g);
    })();

    /* --- Sofa + meja kopi --- */
    (() => {
      const g = new THREE.Group();
      g.position.set(8.7, 0, 5.6);
      g.rotation.y = Math.PI;
      scene.add(g);
      kotak(3.2, 0.55, 1.1, M.sofa, 0, 0.32, 0, g);
      kotak(3.2, 0.85, 0.28, M.sofa, 0, 0.85, -0.45, g);
      kotak(0.3, 0.5, 1.1, M.sofa, -1.6, 0.5, 0, g);
      kotak(0.3, 0.5, 1.1, M.sofa, 1.6, 0.5, 0, g);
      kotak(1.1, 0.08, 0.6, M.kayu, 0, 0.3, 1.35, g);
    })();

    /* --- Sudut kopi / pantry --- */
    (() => {
      const g = new THREE.Group();
      g.position.set(-9.4, 0, 5.9);
      scene.add(g);
      kotak(2.6, 0.95, 0.8, M.kayuGelap, 0, 0.48, 0, g);
      kotak(0.55, 0.6, 0.5, M.plastik, -0.6, 1.26, 0, g);
      kotak(0.3, 0.18, 0.3, new THREE.MeshStandardMaterial({ color: 0xd64545 }), 0.5, 1.05, 0, g);
    })();

    /* --- Tanaman --- */
    function tanaman(x: number, z: number) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      scene.add(g);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 12), M.pot);
      pot.position.y = 0.23;
      pot.castShadow = true;
      g.add(pot);
      for (const [ox, oy, oz, r] of [[0, 1.0, 0, 0.5], [0.3, 0.8, 0.15, 0.36], [-0.28, 0.85, -0.1, 0.4]] as Array<[number, number, number, number]>) {
        const d = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M.daun);
        d.position.set(ox, oy, oz);
        d.castShadow = true;
        g.add(d);
      }
    }
    tanaman(-11.2, -6.9);
    tanaman(11.2, -6.9);
    tanaman(-11.2, 6.9);
    tanaman(11.4, 1.5);

    /* --- Sprite teks (nama & gelembung) --- */
    type SpriteData = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture };
    function buatSprite(w: number, h: number) {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = Math.round((256 * h) / w);
      const tex = new THREE.CanvasTexture(cv);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.scale.set(w, h, 1);
      sp.renderOrder = 20;
      sp.userData = { cv, tex } as SpriteData;
      return sp;
    }
    function bulat(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      // roundRect belum ada di semua lib TS lama — gambar manual supaya aman
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function gambarLabel(sp: THREE.Sprite, teks: string, bg: string, fg: string, fontPx: number) {
      const { cv, tex } = sp.userData as SpriteData;
      const c = cv.getContext("2d")!;
      c.clearRect(0, 0, cv.width, cv.height);
      c.fillStyle = bg;
      bulat(c, 4, 4, cv.width - 8, cv.height - 8, 26);
      c.fill();
      c.fillStyle = fg;
      c.font = `bold ${fontPx}px sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(teks, cv.width / 2, cv.height / 2 + 2);
      tex.needsUpdate = true;
    }
    function gambarGelembung(sp: THREE.Sprite, teks: string) {
      const { cv, tex } = sp.userData as SpriteData;
      const c = cv.getContext("2d")!;
      c.clearRect(0, 0, cv.width, cv.height);
      if (!teks) { tex.needsUpdate = true; return; }
      c.fillStyle = "#f4f6fb";
      bulat(c, 4, 4, cv.width - 8, cv.height - 20, 22);
      c.fill();
      c.beginPath();
      c.moveTo(cv.width / 2 - 12, cv.height - 18);
      c.lineTo(cv.width / 2 + 12, cv.height - 18);
      c.lineTo(cv.width / 2, cv.height - 2);
      c.closePath();
      c.fill();
      c.fillStyle = "#131a2a";
      c.font = "25px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      const kata = teks.split(" ");
      const baris: string[] = [];
      let b = "";
      for (const k of kata) {
        if ((b + " " + k).trim().length > 21) { baris.push(b.trim()); b = k; }
        else b += " " + k;
      }
      if (b.trim()) baris.push(b.trim());
      baris.slice(0, 2).forEach((t, i) => c.fillText(t, cv.width / 2, 34 + i * 30));
      tex.needsUpdate = true;
    }

    /* --- Agent 3D --- */
    type AgentRec = {
      g: THREE.Group;
      ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
      gelembung: THREE.Sprite;
      target: THREE.Vector3;
      hadapTetap: number | null | undefined;
      teksGelembung: string;
      status: string;
      plate?: boolean;
    };
    const agents3d: Record<string, AgentRec> = {};
    function buatAgent(id: string, a: AgentState): AgentRec {
      const g = new THREE.Group();
      scene.add(g);
      const warna = new THREE.MeshStandardMaterial({ color: WARNA_AGENT[id] ?? 0x94a3b8, roughness: 0.6 });
      const badan = new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.5, 6, 14), warna);
      badan.position.y = 0.88;
      badan.castShadow = true;
      g.add(badan);
      const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), M.kulit);
      kepala.position.y = 1.62;
      kepala.castShadow = true;
      g.add(kepala);
      const rambut = new THREE.Mesh(
        new THREE.SphereGeometry(0.315, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
        M.rambut
      );
      rambut.position.y = 1.66;
      g.add(rambut);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.44, 0.56, 32),
        new THREE.MeshBasicMaterial({ color: WARNA_RING.nganggur, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      g.add(ring);
      const label = buatSprite(2.5, 0.62);
      label.position.y = 2.3;
      g.add(label);
      gambarLabel(label, `${a.emoji} ${a.nama}`, "rgba(10,14,24,0.80)", "#ffffff", 30);
      const gelembung = buatSprite(2.9, 1.15);
      gelembung.position.y = 3.15;
      gelembung.visible = false;
      g.add(gelembung);
      const dx = DESK_X[id] ?? 0;
      g.position.set(dx, 0, -4.5);
      const rec: AgentRec = {
        g, ring, gelembung,
        target: new THREE.Vector3(dx, 0, -4.5),
        hadapTetap: Math.PI,
        teksGelembung: "__init",
        status: "",
      };
      agents3d[id] = rec;
      return rec;
    }
    function targetAgent(id: string, a: AgentState, idx: number, tikNow: number): [number, number, number | null] {
      if (a.status === "kerja") return [DESK_X[id] ?? 0, -4.5, Math.PI];
      if (a.status === "review") {
        const [ox, oz] = RAPAT_SPOT[idx % RAPAT_SPOT.length];
        return [ox, 1.5 + oz, Math.atan2(0 - ox, 1.5 - (1.5 + oz))];
      }
      if (a.status === "selesai") {
        const [sx, sz] = SOFA_SPOT[idx % SOFA_SPOT.length];
        return [sx, sz, Math.PI];
      }
      const spot = IDLE_SPOT[(Math.floor(tikNow / 7) + idx * 2) % IDLE_SPOT.length];
      return [spot[0], spot[1], null];
    }

    sceneFnRef.current = (s: KantorState, tikNow: number) => {
      const ids = Object.keys(s.agents);
      ids.forEach((id, idx) => {
        const a = s.agents[id];
        const rec = agents3d[id] || buatAgent(id, a);
        const [tx, tz, hadapTetap] = targetAgent(id, a, idx, tikNow);
        rec.target.set(tx, 0, tz);
        rec.hadapTetap = hadapTetap;
        rec.ring.material.color.setHex(WARNA_RING[a.status] ?? 0x64748b);
        const teks = a.status === "kerja" || a.status === "review" ? a.lagi || "" : "";
        if (teks !== rec.teksGelembung) {
          rec.teksGelembung = teks;
          rec.gelembung.visible = !!teks;
          if (teks) gambarGelembung(rec.gelembung, teks);
        }
        rec.status = a.status;
        if (!rec.plate) {
          rec.plate = true;
          const p = buatSprite(2.3, 0.55);
          p.position.set(DESK_X[id] ?? 0, 2.6, -6.1);
          scene.add(p);
          gambarLabel(p, a.meja, "rgba(35,47,77,0.85)", "#aebadd", 27);
        }
      });
    };

    /* --- Kamera orbit sederhana --- */
    let az = -0.62, pol = 0.98, rad = 17.5;
    let azT = az, polT = pol, radT = rad;
    const targetCam = new THREE.Vector3(0, 0.6, 0);
    let seret = false, px = 0, py = 0;
    const el = renderer.domElement;
    el.style.touchAction = "none";
    const onDown = (e: PointerEvent) => { seret = true; px = e.clientX; py = e.clientY; el.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (!seret) return;
      azT -= (e.clientX - px) * 0.005;
      polT -= (e.clientY - py) * 0.004;
      polT = Math.max(0.35, Math.min(1.3, polT));
      px = e.clientX; py = e.clientY;
    };
    const onUp = () => { seret = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radT = Math.max(10, Math.min(30, radT + e.deltaY * 0.02));
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    function ukuran() {
      const w = wadah!.clientWidth, h = wadah!.clientHeight;
      renderer.setSize(w, h);
      kamera.aspect = w / h;
      kamera.updateProjectionMatrix();
    }
    ukuran();
    window.addEventListener("resize", ukuran);

    const jam = new THREE.Clock();
    let raf = 0;
    function putar() {
      raf = requestAnimationFrame(putar);
      const dt = Math.min(jam.getDelta(), 0.05);
      const t = jam.elapsedTime;
      az += (azT - az) * 0.08;
      pol += (polT - pol) * 0.08;
      rad += (radT - rad) * 0.1;
      kamera.position.set(
        targetCam.x + rad * Math.sin(pol) * Math.sin(az),
        targetCam.y + rad * Math.cos(pol),
        targetCam.z + rad * Math.sin(pol) * Math.cos(az)
      );
      kamera.lookAt(targetCam);
      for (const rec of Object.values(agents3d)) {
        const p = rec.g.position;
        const tg = rec.target;
        const dx = tg.x - p.x, dz = tg.z - p.z;
        const jarak = Math.hypot(dx, dz);
        if (jarak > 0.06) {
          const cepat = 2.3 * dt;
          const langkah = Math.min(jarak, cepat);
          p.x += (dx / jarak) * langkah;
          p.z += (dz / jarak) * langkah;
          const hadap = Math.atan2(dx, dz);
          let beda = hadap - rec.g.rotation.y;
          while (beda > Math.PI) beda -= Math.PI * 2;
          while (beda < -Math.PI) beda += Math.PI * 2;
          rec.g.rotation.y += beda * Math.min(1, dt * 10);
          rec.g.position.y = Math.abs(Math.sin(t * 11 + p.x)) * 0.07;
          rec.g.rotation.x = 0.05;
        } else {
          rec.g.position.y *= 0.8;
          rec.g.rotation.x *= 0.8;
          if (rec.hadapTetap !== null && rec.hadapTetap !== undefined) {
            let beda = rec.hadapTetap - rec.g.rotation.y;
            while (beda > Math.PI) beda -= Math.PI * 2;
            while (beda < -Math.PI) beda += Math.PI * 2;
            rec.g.rotation.y += beda * Math.min(1, dt * 6);
          }
        }
        if (rec.status === "kerja") rec.ring.scale.setScalar(1 + Math.sin(t * 5) * 0.07);
      }
      renderer.render(scene, kamera);
    }
    putar();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", ukuran);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      sceneFnRef.current = null;
      renderer.dispose();
      if (renderer.domElement.parentElement === wadah) wadah.removeChild(renderer.domElement);
    };
  }, []);

  /* ================= Render ================= */
  const total = data?.tugas.length ?? 0;
  const selesai = data?.tugas.filter((t) => t.status === "selesai").length ?? 0;
  const persen = total ? Math.round((100 * selesai) / total) : 0;

  return (
    <div className="kantor-virtual">
      <h1>🏢 Kantor Virtual <span className="kv-live">● live</span></h1>
      <div className="kv-sub">{judul}</div>

      <h2>💬 Perintah dari PC</h2>
      <div className="kv-kolom">
        <div className="kv-form">
          <input
            className="kv-input"
            type="password"
            placeholder="🔑 Kunci anon Supabase (sekali isi, tersimpan di browser ini)"
            value={sbKey}
            onChange={(e) => setSbKey(e.target.value)}
          />
          <input
            className="kv-input"
            type="password"
            placeholder="🔒 Kode rahasia kantor (sekali isi, tersimpan di browser ini)"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
          />
          <textarea
            className="kv-input"
            rows={2}
            placeholder="Tulis perintah proyek untuk kantor… mis. Buat draft brosur TokoKu"
            value={perintah}
            onChange={(e) => setPerintah(e.target.value)}
          />
          <button className="kv-btn" onClick={kirimPerintah}>🚀 Kirim ke kantor</button>
          <div className="kv-sub kv-nomargin">{statusKirim}</div>
        </div>
      </div>

      <h2>📤 Upload Lembar Exam</h2>
      <div className="kv-kolom">
        <div className="kv-form">
          <div className="kv-sub kv-nomargin">
            Kirim lembar exam sesuai template (foto / PDF / Word / teks — file lama apa adanya juga boleh).
            Agent akan menulisnya sebagai <b>Draft</b> di BimbelLesson untuk kamu tinjau &amp; publish.
            Memakai kunci anon + kode rahasia yang sama seperti blok perintah di atas.
          </div>
          <input
            ref={fileRef}
            className="kv-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.webp"
            onChange={pilihFile}
          />
          <div className="kv-sub kv-nomargin">{namaFile}</div>
          <input
            className="kv-input"
            type="text"
            placeholder="Catatan (opsional): mis. Sub-kategori: Aljabar • durasi 60 menit"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
          <button className="kv-btn kv-btn-upload" onClick={kirimUpload}>📤 Upload &amp; proses jadi Draft</button>
          <div className="kv-sub kv-nomargin">{statusUpload}</div>
        </div>
      </div>

      <h2>📄 Hasil Terakhir</h2>
      <div className="kv-kolom">
        <div className="kv-form">
          <div className="kv-sub kv-nomargin">
            {hasil
              ? <>Laporan akhir proyek: <b>{hasil.proyek || "-"}</b></>
              : "Belum ada proyek yang selesai — hasil akan muncul di sini setelah kantor menyelesaikan proyek pertamamu."}
          </div>
          <div className="kv-hasil-aksi">
            <button className="kv-btn" onClick={bukaPreviewHasil} disabled={!hasil}>👁️ Preview</button>
            <a
              className={"kv-btn kv-btn-unduh" + (hasil ? "" : " kv-btn-mati")}
              href={hasil ? HASIL_MD_URL : undefined}
              download="LAPORAN_AKHIR.md"
              onClick={(e) => { if (!hasil) e.preventDefault(); }}
            >⬇️ Download</a>
          </div>
        </div>
      </div>

      <div className="kv-progress"><div style={{ width: persen + "%" }} /></div>

      <h2>🗺️ Kantor 3D</h2>
      <div className="kv-scene" ref={sceneRef}>
        <div className="kv-gagal3d" ref={gagalRef}>
          Browser tidak bisa menampilkan 3D (WebGL mati / pustaka gagal dimuat).<br />
          Papan tugas dan log di bawah tetap jalan.
        </div>
        <div className="kv-petunjuk">🖱️ seret = putar kamera • scroll = zoom</div>
      </div>
      <div className="kv-legenda">
        <span className="lg-kerja">Kerja</span>
        <span className="lg-review">Review</span>
        <span className="lg-selesai">Selesai</span>
        <span className="lg-nganggur">Nganggur</span>
      </div>

      <h2>📋 Papan Tugas</h2>
      <div className="kv-papan">
        {KOLOM.map(([key, label]) => (
          <div className="kv-kolom" key={key}>
            <h3>{label}</h3>
            {(data?.tugas ?? [])
              .filter((t) => t.status === key)
              .map((t) => (
                <div className="kv-kartu" key={t.id}>
                  <div className="t">#{t.id} {t.judul}</div>
                  <div className="d">{t.catatan_review ? "📝 " + t.catatan_review : ""}</div>
                  <span className="kv-chip">{t.divisi}</span>
                </div>
              ))}
          </div>
        ))}
      </div>

      <h2>📝 Log Kantor</h2>
      <div className="kv-log" ref={logRef}>
        {(data?.log ?? []).slice(-25).map((x, i) => (
          <div key={i}>{x}</div>
        ))}
      </div>

      {previewHasil && (
        <div className="kv-overlay" onClick={() => setPreviewHasil(false)}>
          <div className="kv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kv-modal-head">
              <b>📄 {hasil?.proyek || "Hasil terakhir"}</b>
              <button className="kv-btn kv-btn-tutup" onClick={() => setPreviewHasil(false)}>✖ Tutup</button>
            </div>
            <pre className="kv-modal-isi">{teksHasil}</pre>
            <a className="kv-btn kv-btn-unduh" href={HASIL_MD_URL} download="LAPORAN_AKHIR.md">⬇️ Download laporan (.md)</a>
          </div>
        </div>
      )}
    </div>
  );
}
