import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Building2, PenLine, CreditCard, User, FileText, Shield, ChevronLeft, ArrowRight, CheckCircle, Save, Check } from "lucide-react";
import { Logo, PortalWord } from "@/components/portal/Logo";
import { Stepper } from "@/components/portal/Stepper";
import { CountdownTimer } from "@/components/portal/CountdownTimer";
import { Button } from "@/components/portal/Button";
import { Modal } from "@/components/portal/Modal";
import { NAVY, GOLD } from "@/lib/constants";
import { defaultDocumentForm } from "@/lib/document-form-defaults";
import type { DocumentFormData } from "@/lib/types";
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

export function DocumentFormPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const submission = getSubmissionByToken(token ?? "");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DocumentFormData>(() => getDraft(token ?? "") ?? defaultDocumentForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const { active: draftSaved, trigger: triggerDraftSaved } = useActionFeedback();

  useEffect(() => {
    if (!token) return;
    if (token === "expired-demo") { navigate("/client/expired"); return; }
    if (!submission) return;
    if (isLinkExpired(token) || submission.status === "expired") { navigate("/client/expired"); return; }
    if (submission.status === "submitted") { navigate(`/client/preview/${token}`); return; }
    markSubmissionOpened(token);
  }, [token, submission, navigate]);

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <p className="text-[#64748B]">Invalid or expired document link.</p>
      </div>
    );
  }

  function validateCurrentStep(): boolean {
    const schema = STEP_SCHEMAS[step - 1];
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => { fieldErrors[i.path.join(".")] = i.message; });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  function next() {
    if (!validateCurrentStep()) return;
    setStep(s => Math.min(s + 1, 7));
  }

  function prev() { setStep(s => Math.max(s - 1, 1)); }

  function handleSaveDraft() {
    saveDraft(token!, form);
    triggerDraftSaved();
  }

  function handleSubmit() {
    if (!validateCurrentStep()) return;
    setShowConfirm(true);
  }

  function confirmSubmit() {
    submitDocument(token!, form);
    setShowConfirm(false);
    navigate(`/client/preview/${token}`);
  }

  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#F4F6FA] font-['Inter']">
      <header className="sticky top-0 z-30 border-b border-white/10" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
        <div className="px-6 py-3 flex items-center justify-between max-w-[1600px] mx-auto flex-wrap gap-3">
          <Logo light />
          <CountdownTimer expiresAt={submission.expiresAt} onExpired={() => navigate("/client/expired")} />
        </div>
        <div className="h-0.5 bg-white/10"><div className="h-full bg-[#F7931E] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      </header>

      <div className="max-w-[1600px] mx-auto py-5 px-4">
        <div className="text-center mb-4 xl:text-left">
          <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest font-bold">Client Registration Form</p>
          <h1 className="font-display text-xl font-bold text-[#0B1F3A] leading-snug">
            Ahamson Document <PortalWord className="text-[1.06em]" />
          </h1>
        </div>

        <div className="grid xl:grid-cols-2 gap-5 items-start">
          <div>
            <Stepper steps={STEPS} current={step} />

            <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 shadow-xl overflow-hidden">
          <div className="px-6 py-3.5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Step {step} of {STEPS.length}</p>
            <h2 className="font-['Playfair_Display'] text-lg font-bold text-white">{STEP_TITLES[step - 1]}</h2>
            <p className="text-white/40 text-[10px] mt-0.5">Fields marked with <span className="text-[#F7931E]">*</span> are required</p>
          </div>

          <div className="p-5 lg:p-6">
            {step === 1 && <CompanyInfoStep data={form} onChange={setForm} errors={errors as never} />}
            {step === 2 && <SignatoriesStep data={form} onChange={setForm} field="lpoSignatories" title="Authorized persons to sign LPO" />}
            {step === 3 && <SignatoriesStep data={form} onChange={setForm} field="chequeSignatories" title="Authorized persons to sign cheques" />}
            {step === 4 && <BankReferencesStep data={form} onChange={setForm} />}
            {step === 5 && <TradeCreditStep data={form} onChange={setForm} />}
            {step === 6 && <DocumentsStep data={form} onChange={setForm} />}
            {step === 7 && <DeclarationStep data={form} onChange={setForm} errors={errors as never} />}
          </div>

          <div className="px-5 lg:px-6 py-3.5 border-t border-[#0B1F3A]/6 bg-[#F8F9FC] flex items-center justify-between flex-wrap gap-2">
            <button onClick={prev} disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#0B1F3A]/12 text-[#64748B] text-sm font-semibold disabled:opacity-30 hover:bg-white transition-all">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleSaveDraft}
                className={draftSaved ? "!text-emerald-600" : undefined}
                icon={
                  <AnimatedIconSwap
                    active={draftSaved}
                    idle={<Save className="w-4 h-4" />}
                    activeIcon={<Check className="w-4 h-4" strokeWidth={2.5} />}
                  />
                }
              >
                {draftSaved ? "Saved" : "Save Draft"}
              </Button>
              {step < 7 ? (
                <Button variant="gold" icon={<ArrowRight className="w-4 h-4" />} onClick={next}>Next</Button>
              ) : (
                <Button icon={<CheckCircle className="w-4 h-4" />} onClick={handleSubmit}>Submit Document</Button>
              )}
            </div>
          </div>
            </div>
          </div>

          <LiveDocumentPanel data={form} companyName={submission.clientCompany} activeSection={step} />
        </div>

        <LiveDocumentPanelMobile data={form} companyName={submission.clientCompany} activeSection={step} />

        <p className="text-center text-[#94A3B8] text-xs mt-4">No login required · Secure encrypted submission · Ahamson &copy; 2025</p>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} wide title="Review Your Document" subtitle="Official Client Registration Form — filled with your data">
        <div className="max-h-[55vh] overflow-y-auto rounded-xl bg-[#DDE2E8] p-3 mb-5 -mx-1 scrollbar-thin">
          <PdfFormPreview data={form} pageNumber={1} />
        </div>
        <p className="text-[#64748B] text-sm mb-5">Once submitted, this document cannot be edited. Are you sure you want to proceed?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="gold" icon={<CheckCircle className="w-4 h-4" />} onClick={confirmSubmit}>Yes, Submit</Button>
        </div>
      </Modal>
    </div>
  );
}
