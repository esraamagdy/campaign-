import Image from "next/image";
import { Download, RotateCw, Loader2, ImagePlus } from "lucide-react";
import type { ImageState } from "@/lib/schemas";
export function AdImage({
  state,
  index,
  onGenerate,
  disabled,
}: {
  state: ImageState;
  index: number;
  onGenerate: () => void;
  disabled: boolean;
}) {
  const type = ["Hero", "Lifestyle", "Creative"][index];
  return (
    <div className="ad-image-section">
      <div className={`ad-image visual-${index}`}>
        {state.image ? (
          <Image
            unoptimized
            src={state.image.dataUrl}
            width={1024}
            height={1024}
            alt={`${type} advertising image`}
          />
        ) : (
          <div className="image-empty">
            <ImagePlus size={30} />
            <span>{type} advertising image</span>
          </div>
        )}
        {state.loading && (
          <div className="image-loading" role="status">
            <Loader2 className="spin" size={24} />
            <span>Creating {type.toLowerCase()} image…</span>
            <small>This may take a few minutes.</small>
          </div>
        )}
      </div>
      <div className="image-toolbar">
        <span className="section-kicker">{type.toUpperCase()}</span>
        <div>
          <button
            className="text-button"
            disabled={disabled || state.loading}
            onClick={onGenerate}
            aria-label={`Regenerate ${type} image`}
          >
            <RotateCw size={13} /> {state.image ? "Regenerate" : "Generate"}
          </button>
          {state.image && (
            <a
              className="text-button"
              href={state.image.dataUrl}
              download={`forma-${type.toLowerCase()}.${state.image.dataUrl.startsWith("data:image/jpeg") ? "jpg" : state.image.dataUrl.startsWith("data:image/webp") ? "webp" : "png"}`}
              aria-label={`Download ${type} image`}
            >
              <Download size={13} />
              Download
            </a>
          )}
        </div>
      </div>
      {state.image?.demo && (
        <p className="image-note">
          Demo reference only — not an AI-generated advertisement.
        </p>
      )}
      {state.stale && (
        <p className="image-note">
          Direction changed. Regenerate this image to match.
        </p>
      )}
      {state.error && (
        <p className="image-error" role="alert">
          {state.error}{" "}
          {state.image ? "Your previous image is still available." : ""}
        </p>
      )}
      {!state.image?.demo && state.image && (
        <p className="image-note">
          AI-generated · review product and branding accuracy.
        </p>
      )}
    </div>
  );
}
