import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';

type MediaFile = {
  path: string;
  publicUrl: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  bucket?: string;
};

const FOLDERS = ['questions', 'categories', 'banners', 'misc', 'choices'];

export default function MediaPickerModal({ open, onClose, onSelect, bucket }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const all: MediaFile[] = [];

    const storageBucket = bucket || 'media'; // ✅ DEFAULT AMAN

    for (const folder of FOLDERS) {
      const { data } = await supabase.storage
        .from(storageBucket)
        .list(folder, { limit: 100 });

      if (!data) continue;

      for (const f of data) {
        // ✅ skip folder atau file kosong
        if (!f.name || f.metadata?.size === 0) continue;

        const path = `${folder}/${f.name}`;
        const { data: url } = supabase.storage
          .from(storageBucket)
          .getPublicUrl(path);

        if (url?.publicUrl) {
          all.push({ path, publicUrl: url.publicUrl });
        }
      }
    }

    // ✅ file terbaru di depan
    const sorted = all.sort((a, b) => b.path.localeCompare(a.path));

    setFiles(sorted);
    setLoading(false);
  }, [bucket]); // ✅ stabil, hanya berubah kalau bucket berubah

  useEffect(() => {
    if (open) loadMedia();
  }, [open, loadMedia]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl rounded shadow-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Pilih Gambar</h2>
          <button onClick={onClose} className="text-gray-600">✕</button>
        </div>

        {loading && <p>Memuat...</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto">
          {files.map(f => (
            <button
              key={f.path}
              onClick={() => {
                onSelect(f.publicUrl);
                onClose();
              }}
              className="border rounded hover:ring-2 hover:ring-indigo-500 p-2 flex items-center justify-center h-32"
            >
              <img
                src={f.publicUrl}
                alt=""
                className="object-contain max-w-full max-h-full"
              />
            </button>
          ))}
        </div>

        {files.length === 0 && !loading && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Belum ada media
          </p>
        )}
      </div>
    </div>
  );
}