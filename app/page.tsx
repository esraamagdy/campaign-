"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StepProgress } from "@/components/StepProgress";
import { CampaignResults } from "@/components/CampaignResults";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Upload,
  FileText,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Copy,
  RotateCw,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Command,
  Leaf,
  Target,
  Palette,
  Users,
  MessageCircle,
  Heart,
} from "lucide-react";
import type { Brand, Product, Campaign } from "@/lib/schemas";
import { MAX_DOCUMENT, MAX_IMAGE } from "@/lib/schemas";
const fields: { key: keyof Brand; label: string; icon: typeof Target }[] = [
  { key: "name", label: "Brand name", icon: Leaf },
  { key: "positioning", label: "Brand positioning", icon: Target },
  { key: "audience", label: "Target audience", icon: Users },
  { key: "tone", label: "Tone of voice", icon: MessageCircle },
  { key: "values", label: "Brand values", icon: Heart },
  { key: "messages", label: "Key messages", icon: Sparkles },
  { key: "visual", label: "Visual identity", icon: Palette },
];
export default function Home() {
  const [step, setStep] = useState(0),
    [brand, setBrand] = useState<Brand | null>(null),
    [product, setProduct] = useState<Product>({
      name: "",
      description: "",
      features: "",
      benefits: "",
      price: "",
    }),
    [campaign, setCampaign] = useState<Campaign | null>(null),
    [file, setFile] = useState<File | null>(null),
    [image, setImage] = useState(""),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [demo, setDemo] = useState(false),
    [copied, setCopied] = useState(""),
    [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  function selectFile(f?: File) {
    setError("");
    if (!f) return;
    if (
      !/\.(pdf|docx|txt)$/i.test(f.name) ||
      f.size > MAX_DOCUMENT ||
      !f.size
    ) {
      setError("Choose a nonempty PDF, DOCX, or TXT under 5 MB.");
      return;
    }
    setFile(f);
    setBrand(null);
  }
  async function analyze() {
    if (!file) return;
    setBusy("brand");
    setError("");
    try {
      const data = new FormData();
      data.set("file", file);
      const res = await fetch("/api/brand", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBrand(json.brand);
      setDemo(json.demo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  }
  async function generate(element?: string) {
    if (!brand) return;
    setBusy(element || "campaign");
    setError("");
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          product,
          ...(campaign ? { current: campaign } : {}),
          ...(element ? { element } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCampaign(json.campaign);
      setDemo(json.demo);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  }
  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("Clipboard unavailable. Select and copy the text directly.");
    }
  }
  function uploadImage(f?: File) {
    setError("");
    if (!f) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      f.size > MAX_IMAGE ||
      !f.size
    ) {
      setError("Choose a nonempty JPG, PNG, or WebP under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => setImage(String(reader.result));
      img.onerror = () => setError("This image could not be decoded.");
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  }
  const validBrand = brand && Object.values(brand).every((v) => v.trim());
  const action = (id: string, text: string) => (
    <div className="card-actions">
      <button aria-label={`Copy ${id}`} onClick={() => copy(text, id)}>
        {copied === id ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <button
        disabled={!!busy}
        aria-label={`Regenerate ${id}`}
        onClick={() => generate(id)}
      >
        <RotateCw size={15} className={busy === id ? "spin" : ""} />
      </button>
    </div>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="logo" href="/">
          <span className="logo-mark">
            <Layers size={22} />
          </span>
          forma<span className="logo-dot">.</span>
        </Link>
        <div className="workspace-label">WORKSPACE</div>
        <button
          className="nav-active"
          disabled={!!busy}
          onClick={() => setStep(0)}
        >
          <Sparkles size={18} /> Campaign studio <span>1</span>
        </button>
        <div className="sidebar-project">
          <div className="project-symbol">
            <Command size={17} />
          </div>
          <div>
            Your next big idea<small>Starts with your brand.</small>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="mini-orbit">✳</div>
          <h3>Built around your brand.</h3>
          <p>
            A little intelligence.
            <br />A lot of possibility.
          </p>
          <div className="version">
            FORMA STUDIO <span>V.01</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <span>Campaign studio</span>
          </div>
          <div className="header-right">
            <span className="status-dot" /> All ideas welcome{" "}
            <div className="avatar">
              <Leaf size={15} />
            </div>
          </div>
        </header>
        <main>
          <div className="page-top">
            <div>
              <div className="eyebrow">
                <span /> FROM BRAND TO BIG IDEA
              </div>
              <h1>Your brand. Your next big campaign.</h1>
              <p>Turn what makes you unique into marketing that connects.</p>
            </div>
            <div className="studio-label">
              <Sparkles size={15} /> AI-powered studio
            </div>
          </div>
          <StepProgress
            step={step}
            busy={!!busy}
            available={[
              true,
              !!brand,
              !!validBrand &&
                !!product.name.trim() &&
                !!product.description.trim(),
              !!campaign,
            ]}
            onChange={(i) => {
              setStep(i);
              setError("");
            }}
          />
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="content-heading">
            <div>
              <div className="section-kicker">
                STEP {String(step + 1).padStart(2, "0")}
              </div>
              <h2>
                {
                  [
                    "Let’s get to know your brand.",
                    "Meet the star of your campaign.",
                    "Bring it all together.",
                    "Ideas made for your brand.",
                  ][step]
                }
              </h2>
              <p>
                {
                  [
                    "Great campaigns start with a little understanding. Give us the essentials.",
                    "Add your product and the details that make it worth talking about.",
                    "Your brand DNA + your product. A campaign with a point of view.",
                    "Your campaign is ready to shape, refine, and make your own.",
                  ][step]
                }
              </p>
            </div>
            {step === 3 && (
              <button
                className="secondary"
                onClick={() => copy(JSON.stringify(campaign, null, 2), "all")}
              >
                <Copy size={15} />
                {copied === "all" ? "Copied!" : "Copy campaign"}
              </button>
            )}
          </div>
          {step === 0 && (
            <div className="two-column">
              <section className="panel upload-panel">
                <div className="panel-title">
                  <div className="icon-box">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3>Your brand, in a document</h3>
                    <p>We’ll find the story between the lines.</p>
                  </div>
                </div>
                <input
                  ref={input}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  hidden
                  onChange={(e) => selectFile(e.target.files?.[0])}
                />
                <button
                  disabled={!!busy}
                  className={`dropzone ${drag ? "dragging" : ""}`}
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    if (!busy) selectFile(e.dataTransfer.files[0]);
                  }}
                >
                  <span className="upload-icon">
                    {file ? <FileText size={26} /> : <Upload size={26} />}
                  </span>
                  <strong>
                    {file ? file.name : "Drop your brand document here"}
                  </strong>
                  <span>
                    {file ? (
                      `${(file.size / 1024).toFixed(1)} KB · Click to replace`
                    ) : (
                      <>
                        <b>Browse files</b> or drag and drop
                      </>
                    )}
                  </span>
                  <small>PDF, DOCX, or TXT · Up to 5 MB</small>
                </button>
                <div className="upload-tip">
                  <span>↳</span> Brand guidelines, a pitch deck, or even a
                  simple brand overview.
                </div>
                <div className="panel-footer">
                  <span>
                    <span className="tiny-dot" /> Used only for this session
                  </span>
                  <button
                    className="primary"
                    onClick={analyze}
                    disabled={!file || !!busy}
                  >
                    {busy === "brand" ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <Sparkles size={16} />
                    )}{" "}
                    {busy === "brand" ? "Reading your brand…" : "Analyze brand"}
                    <ArrowRight size={16} />
                  </button>
                </div>
                <p className="privacy-note">
                  With live AI, extracted text is sent to OpenAI for analysis.
                </p>
              </section>
              <aside className="insight-panel">
                <div className="insight-top">
                  <span className="small-tag">THE BRAND BRAIN</span>
                  <div className="brain-art">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="brain-core">
                      <Sparkles size={34} />
                    </div>
                    <span className="art-dot dot-one" />
                    <span className="art-dot dot-two" />
                    <span className="art-star">✦</span>
                  </div>
                  <h3>
                    A shared understanding.
                    <br />A stronger starting point.
                  </h3>
                  <p>
                    Our AI connects the dots to build a clear picture of your
                    brand.
                  </p>
                </div>
                <div className="insight-list">
                  {[
                    "Positioning & purpose",
                    "Your people & your voice",
                    "Values & key messages",
                    "Look, feel & visual direction",
                  ].map((t) => (
                    <div key={t}>
                      <CheckCircle2 size={16} />
                      {t}
                    </div>
                  ))}
                </div>
                <div className="insight-note">
                  Always your brand. Always your final say.
                </div>
              </aside>
              {brand && (
                <section className="panel brand-review">
                  <div className="review-heading">
                    <div>
                      <h3>Your brand DNA</h3>
                      <p>Review and edit every detail before continuing.</p>
                    </div>
                    {demo && (
                      <span className="demo-badge">
                        Demo AI · illustrative analysis
                      </span>
                    )}
                  </div>
                  {demo && (
                    <p className="demo-note">
                      No API key is configured. These are sample suggestions,
                      not an analysis of your document. Replace them with your
                      brand details.
                    </p>
                  )}
                  <div className="brand-grid">
                    {fields.map(({ key, label, icon: Icon }) => (
                      <label key={key}>
                        <span>
                          <Icon size={14} />
                          {label}
                        </span>
                        <textarea
                          aria-label={label}
                          value={brand[key]}
                          onChange={(e) =>
                            setBrand({ ...brand, [key]: e.target.value })
                          }
                          rows={key === "name" ? 1 : 3}
                          maxLength={key === "name" ? 200 : 3000}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="review-bottom">
                    <span>You’re in control. Make it sound like you.</span>
                    <button
                      className="primary"
                      disabled={!validBrand}
                      onClick={() => setStep(1)}
                    >
                      Approve brand & continue
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="two-column">
              <section className="panel product-form">
                <div className="panel-title">
                  <div className="icon-box">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3>The product details</h3>
                    <p>A little context goes a long way.</p>
                  </div>
                </div>
                {(
                  [
                    "name",
                    "description",
                    "features",
                    "benefits",
                    "price",
                  ] as const
                ).map((key) => (
                  <label key={key}>
                    <span>
                      {
                        {
                          name: "Product name *",
                          description: "Description *",
                          features: "Key features",
                          benefits: "Customer benefits",
                          price: "Price (optional)",
                        }[key]
                      }
                    </span>
                    {key === "name" || key === "price" ? (
                      <input
                        maxLength={key === "name" ? 200 : 100}
                        value={product[key]}
                        onChange={(e) =>
                          setProduct({ ...product, [key]: e.target.value })
                        }
                        placeholder={
                          key === "name" ? "e.g. The Everyday Tote" : "e.g. $48"
                        }
                      />
                    ) : (
                      <textarea
                        maxLength={key === "description" ? 4000 : 3000}
                        rows={3}
                        value={product[key]}
                        onChange={(e) =>
                          setProduct({ ...product, [key]: e.target.value })
                        }
                        placeholder={
                          {
                            description:
                              "What is it, and what makes it special?",
                            features: "Materials, design, specifications…",
                            benefits:
                              "How does it make your customer’s day better?",
                          }[key]
                        }
                      />
                    )}
                  </label>
                ))}
                <div className="review-bottom">
                  <button className="text-button" onClick={() => setStep(0)}>
                    Back
                  </button>
                  <button
                    className="primary"
                    disabled={
                      !product.name.trim() || !product.description.trim()
                    }
                    onClick={() => setStep(2)}
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
              <aside className="panel product-preview">
                <div className="section-kicker">PRODUCT PREVIEW</div>
                <input
                  ref={imageInput}
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => uploadImage(e.target.files?.[0])}
                />
                <button
                  className="product-image"
                  onClick={() => imageInput.current?.click()}
                >
                  {image ? (
                    <Image
                      unoptimized
                      width={600}
                      height={450}
                      src={image}
                      alt={product.name || "Product preview"}
                    />
                  ) : (
                    <>
                      <ImageIcon size={34} />
                      <strong>Add a product image</strong>
                      <span>JPG, PNG, WebP · Up to 5 MB</span>
                      <span className="secondary">
                        <Plus size={15} />
                        Upload image
                      </span>
                    </>
                  )}
                </button>
                {image && (
                  <button className="text-button" onClick={() => setImage("")}>
                    Remove image
                  </button>
                )}
                <h3>{product.name || "Your product, in focus."}</h3>
                <p>
                  {product.description ||
                    "Your product preview will come to life here."}
                </p>
                {product.price && <strong>{product.price}</strong>}
                <div className="info-note">
                  Images stay in your browser. Campaign direction uses your
                  product description; image analysis is not included in V1.
                </div>
              </aside>
            </div>
          )}
          {step === 2 && (
            <section className="panel generation-panel">
              <span className="generation-icon">
                <Sparkles size={32} />
              </span>
              <span className="small-tag">
                A LITTLE STRATEGY. A LITTLE MAGIC.
              </span>
              <h2>Ready for your next big idea?</h2>
              <p>
                We’ll connect your brand’s point of view with your product’s
                potential.
              </p>
              <div className="summary-pair">
                <div>
                  <Leaf size={20} />
                  <small>YOUR BRAND</small>
                  <strong>{brand?.name}</strong>
                  <p>{brand?.tone}</p>
                </div>
                <Plus size={20} />
                <div>
                  <Layers size={20} />
                  <small>YOUR PRODUCT</small>
                  <strong>{product.name}</strong>
                  <p>{product.description}</p>
                </div>
              </div>
              <div className="generation-includes">
                1 big idea <span>·</span> 3 social concepts <span>·</span> 3
                visual directions
              </div>
              <button
                className="primary large"
                disabled={!!busy}
                onClick={() => generate()}
              >
                {busy ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <Sparkles size={18} />
                )}{" "}
                {busy ? "Building your campaign…" : "Generate my campaign"}
                <ArrowRight size={18} />
              </button>
              <p className="muted-small">
                You can edit and regenerate everything in the next step.
              </p>
            </section>
          )}
          {step === 3 && campaign && (
            <CampaignResults
              campaign={campaign}
              brandName={brand?.name}
              demo={demo}
              busy={busy}
              onChange={setCampaign}
              onGenerate={() => generate()}
              onEditProduct={() => setStep(1)}
              actions={action}
            />
          )}
          <footer>
            <span>
              <Layers size={14} /> Made for brands with a point of view.
            </span>
            <a
              href="https://platform.openai.com/docs"
              target="_blank"
              rel="noreferrer"
            >
              Powered by possibility <ArrowUpRight size={13} />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
