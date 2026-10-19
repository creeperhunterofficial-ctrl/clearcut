import { useRef, useState } from "react";
import { UploadCloud, AlertTriangle } from "lucide-react";
import { DEFAULTS, formatPaise } from "../lib/config";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }
    const maxBytes = DEFAULTS.maxUploadMb * 1024 * 1024;
    if (f.size > maxBytes) {
      setError(
        `File is too large. Maximum is ${DEFAULTS.maxUploadMb} MB.`
      );
      return;
    }
    setFile(f);
    // Duration is validated server-side before a job starts.
  };

  const priceFor = () => {
    // Placeholder: real duration check happens server-side.
    return formatPaise(DEFAULTS.price30sPaise);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">New video job</h1>
      <p className="text-slate-400 mt-1">
        {formatPaise(DEFAULTS.price30sPaise)} for up to 30s ·{" "}
        {formatPaise(DEFAULTS.price60sPaise)} for up to 60s
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0]);
        }}
        className="mt-6 cursor-pointer rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900 p-10 text-center hover:border-emerald-500/60"
      >
        <UploadCloud className="mx-auto h-10 w-10 text-slate-500" />
        <p className="mt-3 font-semibold">
          {file ? file.name : "Drop a video here or tap to choose"}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          MP4 / MOV / WebM · max {DEFAULTS.maxUploadMb} MB · max{" "}
          {DEFAULTS.maxVideoSeconds}s
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400 flex items-center gap-2" role="alert">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}

      {file && !error && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Estimated price</div>
              <div className="text-sm text-slate-400">
                Final price is set server-side after duration validation.
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {priceFor()}
            </div>
          </div>
          <button
            disabled
            title="Processing backend not connected yet"
            className="mt-4 w-full rounded-lg bg-slate-700 py-2.5 font-bold text-slate-400 cursor-not-allowed"
          >
            Start processing — unavailable
          </button>
          <p className="mt-2 text-xs text-slate-500 text-center">
            The video-processing service is not connected yet. This button will
            activate once the backend is live and tested.
          </p>
        </div>
      )}
    </div>
  );
}
