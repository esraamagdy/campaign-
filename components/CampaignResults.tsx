import type { ReactNode } from "react";
import { Leaf, RotateCw, Sparkles } from "lucide-react";
import { AdImage } from "./AdImage";
import type { Campaign, ImageState } from "@/lib/schemas";
export function CampaignResults({
  campaign,
  brandName,
  demo,
  busy,
  onChange,
  onGenerate,
  onEditProduct,
  actions,
  imageStates,
  onImageGenerate,
}: {
  imageStates: ImageState[];
  onImageGenerate: (index: number) => void;
  campaign: Campaign;
  brandName?: string;
  demo: boolean;
  busy: string;
  onChange: (value: Campaign) => void;
  onGenerate: () => void;
  onEditProduct: () => void;
  actions: (id: string, text: string) => ReactNode;
}) {
  return (
    <fieldset disabled={!!busy} className="results">
      {demo && (
        <div className="demo-note">
          <Sparkles size={16} /> Demo AI output — sample campaign content.
          Images show the uploaded reference only. Configure a server API key
          for real strategy and advertising images.
        </div>
      )}
      <section className="campaign-hero">
        <div className="section-kicker">THE BIG IDEA</div>
        {actions("name", campaign.name)}
        <input
          aria-label="Campaign name"
          value={campaign.name}
          onChange={(e) => onChange({ ...campaign, name: e.target.value })}
        />
        <div className="hero-idea">
          <textarea
            aria-label="Big idea"
            value={campaign.idea}
            onChange={(e) => onChange({ ...campaign, idea: e.target.value })}
          />
          {actions("idea", campaign.idea)}
        </div>
        <span className="hero-tag">
          <Leaf size={13} />
          {brandName}
        </span>
      </section>
      <div className="strategy-grid">
        {(["objective", "audience", "message"] as const).map((key) => (
          <section className="panel result-card" key={key}>
            <div className="section-kicker">
              {key === "message" ? "KEY MESSAGE" : key.toUpperCase()}
            </div>
            {actions(key, campaign[key])}
            <textarea
              aria-label={key}
              rows={5}
              value={campaign[key]}
              onChange={(e) => onChange({ ...campaign, [key]: e.target.value })}
            />
          </section>
        ))}
      </div>
      <div className="results-heading">
        <h3>Three concepts. One unmistakable brand.</h3>
        <span>03 POST CONCEPTS</span>
      </div>
      <div className="strategy-grid">
        {campaign.posts.map((post, i) => (
          <section className="panel result-card ad-card" key={i}>
            <AdImage
              state={imageStates[i] || {}}
              index={i}
              disabled={!!busy}
              onGenerate={() => onImageGenerate(i)}
            />
            <div className="post-top">
              <span className="post-number">0{i + 1}</span>
              {actions(`post${i}`, Object.values(post).join("\n\n"))}
            </div>
            {(Object.keys(post) as (keyof typeof post)[]).map((key) => (
              <label key={key}>
                <span>
                  {key === "title" ? "CONCEPT NAME" : key.toUpperCase()}
                </span>
                <div className="editable-ad-field">
                  <textarea
                    aria-label={`Post ${i + 1} ${key}`}
                    rows={key === "title" ? 1 : 3}
                    value={post[key]}
                    onChange={(e) => {
                      const posts = [...campaign.posts];
                      posts[i] = { ...post, [key]: e.target.value };
                      onChange({ ...campaign, posts });
                    }}
                  />
                  {actions(`post${i}.${key}`, post[key])}
                </div>
              </label>
            ))}
          </section>
        ))}
      </div>
      <div className="results-heading">
        <h3>A vision you can bring to life.</h3>
        <span>03 VISUAL DIRECTIONS</span>
      </div>
      <div className="strategy-grid">
        {campaign.visuals.map((visual, i) => (
          <section className="panel result-card" key={i}>
            <div className="section-kicker">
              {["HERO", "LIFESTYLE", "CREATIVE"][i]} ART DIRECTION
            </div>
            {actions(`visual${i}`, Object.values(visual).join("\n\n"))}
            {(Object.keys(visual) as (keyof typeof visual)[]).map((key) => (
              <label key={key}>
                <span>
                  {key === "prompt"
                    ? "IMAGE-GENERATION PROMPT"
                    : key.toUpperCase()}
                </span>
                <textarea
                  aria-label={`Visual ${i + 1} ${key}`}
                  rows={key === "prompt" ? 6 : 2}
                  value={visual[key]}
                  onChange={(e) => {
                    const visuals = [...campaign.visuals];
                    visuals[i] = { ...visual, [key]: e.target.value };
                    onChange({ ...campaign, visuals });
                  }}
                />
              </label>
            ))}
          </section>
        ))}
      </div>
      <div className="results-bottom">
        <button className="secondary" disabled={!!busy} onClick={onEditProduct}>
          Edit product
        </button>
        <button className="primary" disabled={!!busy} onClick={onGenerate}>
          <RotateCw size={16} className={busy === "campaign" ? "spin" : ""} />
          Regenerate campaign
        </button>
      </div>
    </fieldset>
  );
}
