import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Building2, PenLine, CreditCard, User, FileText, Shield, ChevronLeft, ArrowRight, CheckCircle, Save, Check } from "lucide-react";
import { Logo } from "@/components/portal/Logo";
import { Stepper } from "@/components/portal/Stepper";
import { CountdownTimer } from "@/components/portal/CountdownTimer";
import { Button } from "@/components/portal/Button";
import { Modal } from "@/components/portal/Modal";
import { NAVY } from "@/lib/constants";
import { defaultDocumentForm } from "@/lib/document-form-defaults";
import type { DocumentFormData } from "@/lib/types";
import type { Submission } from "@/lib/types";
import { getSubmissionByToken, getDraft, saveDraft, submitDocument, markSubmissionOpened, isLinkExpired } from "@/lib/storage";
import { STEP_SCHEMAS } from "@/schemas/document-form";
import {
  CompanyInfoStep, SignatoriesStep, BankReferencesStep,
  TradeCreditStep, DocumentsStep, DeclarationStep,
} from "./DocumentFormSteps";
import { LiveDocumentPanel, LiveDocumentPanelMobile } from "@/components/portal/LiveDocumentPanel";
import { PdfFormPreview } from "@/components/portal/PdfFormPreview";
import { AnimatedIconSwap } from "@/components/portal/AnimatedIconSwap";
import { useActionFeedback } from "@/hooks/useActionFeedback";

const STEPS = [
  { n: 1, label: "Company", icon: Building2 },
  { n: 2, label: "LPO Sign", icon: PenLine },
  { n: 3, label: "Cheques", icon: PenLine },
  { n: 4, label: "Bank", icon: CreditCard },
  { n: 5, label: "Credit Ref", icon: User },
  { n: 6, label: "Documents", icon: FileText },
  { n: 7, label: "Declaration", icon: Shield },
];

const STEP_TITLES = [
  "Company Information",
  "Authorized Person to Sign LPO",
  "Authorized Person to Sign Cheques",
  "Bank References",
  "Trade Credit References",
  "Documents Checklist",
  "Declaration & Credit Information",
];

function stepStorageKey(token: string) {
  return `ahamson_form_step_${token}`;
}

export function DocumentFormPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DocumentFormData>(defaultDocumentForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const { active: draftSaved, trigger: triggerDraftSaved } = useActionFeedback();
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const sub = await getSubmissionByToken(token);
      if (!alive) return;
      if (!sub) { setSubmission(null); setLoading(false); return; }
      if (isLinkExpired(sub) || sub.status === "expired") { navigate("/client/expired"); return; }
      if (sub.status === "submitted") { navigate(`/client/preview/${token}`); return; }
      const draft = await getDraft(token);
      if (!alive) return;
      setSubmission(sub);
      setForm(draft ?? defaultDocumentForm());
      const savedStep = Number(localStorage.getItem(stepStorageKey(token)) || "1");
      if (draft && savedStep >= 1 && savedStep <= 7) setStep(savedStep);
      setLoading(false);
      await markSubmissionOpened(token);
    })();
    return () => { alive = false; };
  }, [token, navigate]);

  useEffect(() => {
    if (!token || loading) return;
    localStorage.setItem(stepStorageKey(token), String(step));
  }, [token, step, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <p className="text-[#64748B]">Loading document…</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <p className="text-[#64748B]">Invalid or expired document link.</p>
      </div>
    );
  }

  function goToStep(n: number) {
    setErrors({});
    setStep(n);
  }

  function validateCurrentStep(): boolean {
    const schema = STEP_SCHEMAS[step - 1];
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => { fieldErrors[i.path.join(".")] = i.message; });
      setErrors(fieldErrors);
      requestAnimationFrame(() => {
        document.querySelector(".text-red-500, .border-red-500")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return false;
    }
    setErrors({});
    return true;
  }

  async function persistDraft(data: DocumentFormData = formRef.current) {
    if (!token) return;
    await saveDraft(token, data);
  }

  async function next() {
    if (!validateCurrentStep()) return;
    try {
      await persistDraft();
    } catch {
      /* still allow navigation; draft save is best-effort on next */
    }
    goToStep(Math.min(step + 1, 7));
  }

  function prev() {
    goToStep(Math.max(step - 1, 1));
  }

  async function handleSaveDraft() {
    if (!token || savingDraft) return;
    setSavingDraft(true);
    setDraftError(null);
    try {
      await persistDraft();
      triggerDraftSaved();
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("submitted")) {
        navigate(`/client/preview/${token}`);
        return;
      }
      setDraftError(err instanceof Error ? err.message : "Could not save draft. Please try again.");
    } finally {
      setSavingDraft(false);
    }
  }

  function handleSubmit() {
    if (!validateCurrentStep()) return;
    setShowConfirm(true);
  }

  async function confirmSubmit() {
    try {
      await submitDocument(token!, form);
      localStorage.removeItem(stepStorageKey(token!));
      setShowConfirm(false);
      navigate(`/client/preview/${token}`);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("submitted")) {
        setShowConfirm(false);
        navigate(`/client/preview/${token}`);
      }
    }
  }

  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#F4F6FA] font-['Inter']">
      <header className="sticky top-0 z-30 border-b border-white/10" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
        <div className="w-full px-3 sm:px-4 lg:px-5 py-2 flex items-center justify-between flex-wrap gap-2">
          <Logo light />
          <CountdownTimer expiresAt={submission.expiresAt} onExpired={() => navigate("/client/expired")} />
        </div>
        <div className="h-0.5 bg-white/10"><div className="h-full bg-[#F7931E] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      </header>

      <div className="w-full py-2 sm:py-3 px-3 sm:px-4 lg:px-5">
        <div className="grid xl:grid-cols-2 gap-3 xl:gap-4 items-start w-full">
          <div className="min-w-0 w-full xl:sticky xl:top-[4.5rem] xl:h-[calc(100vh-108px)] flex flex-col gap-2">
            <div className="flex-shrink-0">
              <Stepper steps={STEPS} current={step} onStepClick={goToStep} />
            </div>

            <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 shadow-xl overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="px-4 py-2.5 relative overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
                <h2 className="font-['Playfair_Display'] text-base font-bold text-white leading-tight">{STEP_TITLES[step - 1]}</h2>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin">
                {step === 1 && <CompanyInfoStep data={form} onChange={setForm} errors={errors} />}
                {step === 2 && <SignatoriesStep data={form} onChange={setForm} field="lpoSignatories" title="Authorized persons to sign LPO" errors={errors} />}
                {step === 3 && <SignatoriesStep data={form} onChange={setForm} field="chequeSignatories" title="Authorized persons to sign Cheques" errors={errors} />}
                {step === 4 && <BankReferencesStep data={form} onChange={setForm} errors={errors} />}
                {step === 5 && <TradeCreditStep data={form} onChange={setForm} errors={errors} />}
                {step === 6 && <DocumentsStep data={form} onChange={setForm} errors={errors} />}
                {step === 7 && <DeclarationStep data={form} onChange={setForm} errors={errors} />}
              </div>

              <div className="px-4 py-2.5 border-t border-[#0B1F3A]/6 bg-[#F8F9FC] flex flex-col gap-2 flex-shrink-0">
                {draftError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {draftError}
                  </p>
                )}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button onClick={prev} disabled={step === 1}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#0B1F3A]/12 text-[#64748B] text-sm font-semibold disabled:opacity-30 hover:bg-white transition-all">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      className={draftSaved ? "!text-emerald-600" : undefined}
                      icon={
                        <AnimatedIconSwap
                          active={draftSaved}
                          idle={<Save className="w-4 h-4" />}
                          activeIcon={<Check className="w-4 h-4" strokeWidth={2.5} />}
                        />
                      }
                    >
                      {savingDraft ? "Saving…" : draftSaved ? "Saved" : <><span className="sm:hidden">Draft</span><span className="hidden sm:inline">Save Draft</span></>}
                    </Button>
                    {step < 7 ? (
                      <Button variant="gold" icon={<ArrowRight className="w-4 h-4" />} onClick={next}>Next</Button>
                    ) : (
                      <Button icon={<CheckCircle className="w-4 h-4" />} onClick={handleSubmit}>
                        <span className="sm:hidden">Submit</span>
                        <span className="hidden sm:inline">Submit Document</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <LiveDocumentPanel data={form} companyName={submission.clientCompany} activeSection={step} />
        </div>

        <LiveDocumentPanelMobile data={form} companyName={submission.clientCompany} activeSection={step} />
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} wide title="Review Your Document" >
        {/* Edge-to-edge preview — cancel the modal body padding */}
        <div className="-mx-4 sm:-mx-5 -mt-4 sm:-mt-5 max-h-[62vh] overflow-y-auto bg-[#DDE2E8] p-1.5 scrollbar-thin">
          <PdfFormPreview data={form} pageNumber={1} />
        </div>
        <div className="-mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 border-t border-[#0B1F3A]/8 bg-[#F8F9FC] flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[#64748B] text-xs flex-1 min-w-[200px]">Once submitted, this document cannot be edited. Are you sure you want to proceed?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="gold" icon={<CheckCircle className="w-4 h-4" />} onClick={confirmSubmit}>Yes, Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
