import { Check, ChevronRight } from "lucide-react";
const steps = [
  "Brand Brain",
  "Your product",
  "Generate campaign",
  "Campaign results",
];
export function StepProgress({
  step,
  available,
  busy,
  onChange,
}: {
  step: number;
  available: boolean[];
  busy: boolean;
  onChange: (step: number) => void;
}) {
  return (
    <nav className="stepper" aria-label="Campaign progress">
      {steps.map((name, i) => (
        <button
          key={name}
          disabled={busy || !available[i]}
          onClick={() => onChange(i)}
          className={`${step === i ? "current" : ""} ${step > i ? "complete" : ""}`}
          aria-current={step === i ? "step" : undefined}
        >
          <span className="step-number">
            {step > i ? <Check size={14} /> : String(i + 1).padStart(2, "0")}
          </span>
          <span>{name}</span>
          {i < 3 && <ChevronRight className="step-chevron" size={16} />}
        </button>
      ))}
    </nav>
  );
}
