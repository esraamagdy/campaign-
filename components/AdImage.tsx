import { useState } from "react";
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
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const displayFailed = !!state.image && failedSource === state.image.dataUrl;
  return (
    <div className="ad-image-section">
      <div className={`ad-image visual-${index}`}>
        {state.image && !displayFailed ? (
          <Image
            unoptimized
            src={state.image.dataUrl}
            width={1024}
            height={1024}
            alt={`${type} advertising image`}
            onLoad={() => setFailedSource(null)}
            onError={() => {
              setFailedSource(state.image!.dataUrl);
              console.warn("[forma:image]", {
                stage: "browser_decode",
                code: "image_decode_failed",
                index,
                requestId: state.image?.requestId,
              });
            }}
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
      {displayFailed && (
        <p className="image-error" role="alert">
          The browser could not display the returned image. No new generation
          was requested.
          {state.image?.requestId
            ? ` Reference: ${state.image.requestId}.`
            : ""}
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
