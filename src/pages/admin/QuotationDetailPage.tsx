import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { Button } from "@/components/portal/Button";
import { FormField, Input, Textarea } from "@/components/portal/FormField";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { ActivityLogPanel } from "@/components/portal/ActivityLogPanel";
import { QuotationPdfDownloads } from "@/components/portal/QuotationPdfDownloads";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getQuotation, runQuotationAction, saveQuotation } from "@/lib/storage";
import { LOST_REASONS, canDo } from "@/lib/quotation-status";
import { NAVY } from "@/lib/constants";
import { cn } from "@/lib/utils";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
        {title}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

export function QuotationDetailPage() {
  const { id } = useParams();
  const quoteId = Number(id);
  const navigate = useNavigate();

  const { data, setData, loading, error, refresh } = useApiQuery(
    () => getQuotation(quoteId),
    [quoteId],
    Number.isFinite(quoteId),
  );

  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().slice(0, 10));
  const [followupRemarks, setFollowupRemarks] = useState("");
  const [lostReason, setLostReason] = useState<string>(LOST_REASONS[0]);
  const [lostRemarks, setLostRemarks] = useState("");
  const [approvalAction, setApprovalAction] = useState("approve");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [oem, setOem] = useState("");
  const [orderDetails, setOrderDetails] = useState("");
  const [poName, setPoName] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [invoiceName, setInvoiceName] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  async function run(name: string, fn: () => Promise<typeof data>) {
    setBusy(name);
    setActionError("");
    try {
      const updated = await fn();
      if (updated) setData(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy("");
    }
  }

  if (!Number.isFinite(quoteId)) {
    return <div className="p-6">Invalid quotation</div>;
  }

  const q = data;
  const actions = q?.allowedActions ?? [];
  const hasAnyAction = [
    "submit-budgetary", "followups", "close-lost", "start-formal", "open-formal-child",
    "submit-finance", "finance-review", "submit-formal", "oem-draft",
    "submit-order-approval", "sales-head-review", "place-oem-order",
    "deliver", "close-deal", "reopen-revisions", "edit",
  ].some(a => actions.includes(a));

  return (
    <>
      <PageHeader
        title={q ? q.quoteNumber : "Quotation"}
        subtitle={q ? `${q.phase} · ${q.status}` : "Loading…"}
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate("/admin/quotations")}>
            Back
          </Button>
          {q && (
            <QuotationPdfDownloads
              quote={q}
              onError={(message) => setActionError(message)}
            />
          )}
          <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={refresh}>
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full space-y-4">
        <ApiErrorAlert message={error ?? actionError ?? null} onRetry={refresh} />
        {loading && !q && <p className="text-sm text-[#64748B]">Loading quotation…</p>}

        {q && hasAnyAction && (
          <div className={cn(
            "rounded-2xl border px-4 py-3",
            canDo(actions, "finance-review") || canDo(actions, "sales-head-review")
              ? "bg-amber-50 border-amber-200"
              : "bg-[#FFF8F0] border-[#F7931E]/35",
          )}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8] mb-1">
              {canDo(actions, "finance-review") || canDo(actions, "sales-head-review")
                ? "Approval request waiting for you"
                : "Action required"}
            </p>
            <p className="text-sm font-semibold text-[#0B1F3A]">
              {q.actionHint || "Use the workflow cards below to continue this quotation."}
            </p>
          </div>
        )}

        {q && (
          <div className="grid xl:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card title="Quote details">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-[#94A3B8] text-xs uppercase">Partner</span><p className="font-semibold">{q.partner || "—"}</p></div>
                  <div><span className="text-[#94A3B8] text-xs uppercase">End User</span><p className="font-semibold">{q.endUser || "—"}</p></div>
                  <div><span className="text-[#94A3B8] text-xs uppercase">Sales Person</span><p className="font-semibold">{q.salesPerson || "—"}</p></div>
                  <div><span className="text-[#94A3B8] text-xs uppercase">Brand / Products</span><p className="font-semibold">{q.brand} {q.products}</p></div>
                  <div><span className="text-[#94A3B8] text-xs uppercase">Deal Value</span><p className="font-semibold">{q.dealValue || "—"}</p></div>
                  <div><span className="text-[#94A3B8] text-xs uppercase">GP</span><p className="font-semibold">{q.gpValue || "—"}</p></div>
                  <div className="col-span-2"><span className="text-[#94A3B8] text-xs uppercase">Details</span><p>{q.details || "—"}</p></div>
                  {q.parentQuoteId != null && (
                    <div className="col-span-2">
                      <Button variant="outline" onClick={() => navigate(`/admin/quotations/${q.parentQuoteId}`)}>
                        Open parent budgetary quote
                      </Button>
                    </div>
                  )}
                  {q.childQuoteId != null && (
                    <div className="col-span-2">
                      <Button variant="outline" onClick={() => navigate(`/admin/quotations/${q.childQuoteId}`)}>
                        Open linked formal quote #{q.childQuoteId}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card title="Follow-up history">
                {!q.followups?.length && <p className="text-sm text-[#94A3B8]">No follow-ups yet</p>}
                <div className="space-y-2">
                  {q.followups?.map((f, i) => (
                    <div key={i} className="rounded-xl border border-[#0B1F3A]/8 bg-[#F8F9FC] px-3 py-2 text-sm">
                      <p className="font-semibold text-[#0B1F3A]">{f.date} · {f.by || "Sales"}</p>
                      <p className="text-[#64748B]">{f.remarks}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Approvals">
                {!q.approvals?.length && <p className="text-sm text-[#94A3B8]">No approvals yet</p>}
                <div className="space-y-2">
                  {q.approvals?.map((a, i) => (
                    <div key={i} className="rounded-xl border border-[#0B1F3A]/8 px-3 py-2 text-sm">
                      <p className="font-semibold">{a.type} · {a.action} · {a.by}</p>
                      <p className="text-[#64748B]">{a.remarks || "—"}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <ActivityLogPanel logs={q.activityLogs ?? []} maxHeightClass="max-h-44" />
            </div>

            <div className="space-y-4">
              {!hasAnyAction && (
                <Card title="Workflow">
                  <p className="text-sm text-[#64748B]">
                    No actions available for your role in status <strong>{q.status}</strong>.
                  </p>
                </Card>
              )}

              {canDo(actions, "submit-budgetary") && (
                <Card title="Budgetary — Submit to SI">
                  <p className="text-sm text-[#64748B]">Mark quotation as submitted after emailing SI (manual send).</p>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("submit-bq", () => runQuotationAction(q.id, "submit-budgetary", {
                      submissionDate: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Mark Budgetary Quote Submitted
                  </Button>
                </Card>
              )}

              {canDo(actions, "followups") && (
                <Card title="Follow-up with SI / OEM">
                  <FormField label="Follow-up Date">
                    <Input type="date" value={followupDate} onChange={setFollowupDate} />
                  </FormField>
                  <FormField label="Follow-up Remarks">
                    <Textarea value={followupRemarks} onChange={setFollowupRemarks} rows={2} />
                  </FormField>
                  <Button
                    variant="gold"
                    disabled={!!busy || !followupRemarks.trim()}
                    onClick={() => run("followup", async () => {
                      const updated = await runQuotationAction(q.id, "followups", {
                        followupDate,
                        remarks: followupRemarks,
                      });
                      setFollowupRemarks("");
                      return updated;
                    })}
                  >
                    Add Follow-up
                  </Button>
                </Card>
              )}

              {canDo(actions, "close-lost") && (
                <Card title="Close opportunity if lost">
                  <FormField label="Reason">
                    <select
                      className="w-full rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] px-3 py-2 text-sm"
                      value={lostReason}
                      onChange={e => setLostReason(e.target.value)}
                    >
                      {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Remarks">
                    <Textarea value={lostRemarks} onChange={setLostRemarks} rows={2} />
                  </FormField>
                  <Button
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => run("lost", () => runQuotationAction(q.id, "close-lost", {
                      reason: lostReason,
                      remarks: lostRemarks,
                      closureDate: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Mark Lost
                  </Button>
                </Card>
              )}

              {canDo(actions, "start-formal") && (
                <Card title="Formal Quotation — Start from budgetary">
                  <p className="text-sm text-[#64748B]">Creates Formal Quote Prepared from this budgetary quote.</p>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("formal", async () => {
                      const formal = await runQuotationAction(q.id, "start-formal");
                      navigate(`/admin/quotations/${formal.id}`);
                      return formal;
                    })}
                  >
                    Start Formal Quote
                  </Button>
                </Card>
              )}

              {canDo(actions, "open-formal-child") && q.childQuoteId != null && (
                <Card title="Formal quote already started">
                  <p className="text-sm text-[#64748B]">A formal quotation is linked to this budgetary quote.</p>
                  <Button variant="gold" onClick={() => navigate(`/admin/quotations/${q.childQuoteId}`)}>
                    Open Formal Quote
                  </Button>
                </Card>
              )}

              {canDo(actions, "submit-finance") && (
                <Card title="Formal — Route to Finance">
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("to-finance", () => runQuotationAction(q.id, "submit-finance"))}
                  >
                    Submit for Finance Approval
                  </Button>
                </Card>
              )}

              {canDo(actions, "finance-review") && (
                <Card title="Finance Manager — Review & Approval">
                  <FormField label="Action">
                    <select
                      className="w-full rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] px-3 py-2 text-sm"
                      value={approvalAction}
                      onChange={e => setApprovalAction(e.target.value)}
                    >
                      <option value="approve">Approve</option>
                      <option value="send_back">Send back for changes</option>
                      <option value="reject">Not Approved</option>
                    </select>
                  </FormField>
                  <FormField label="Remarks">
                    <Textarea value={approvalRemarks} onChange={setApprovalRemarks} rows={2} />
                  </FormField>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("finance", () => runQuotationAction(q.id, "finance-review", {
                      action: approvalAction,
                      remarks: approvalRemarks,
                      date: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Submit Finance Decision
                  </Button>
                </Card>
              )}

              {canDo(actions, "submit-formal") && (
                <Card title="Formal — Submit to SI">
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("submit-formal", () => runQuotationAction(q.id, "submit-formal", {
                      submissionDate: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Mark Formal Quote Submitted
                  </Button>
                </Card>
              )}

              {canDo(actions, "oem-draft") && (
                <Card title="Verify PO & draft OEM order">
                  <FormField label="PO file / reference">
                    <Input value={poName} onChange={setPoName} placeholder="PO-123.pdf" />
                  </FormField>
                  <FormField label="OEM">
                    <Input value={oem} onChange={setOem} />
                  </FormField>
                  <FormField label="Order details">
                    <Textarea value={orderDetails} onChange={setOrderDetails} rows={2} />
                  </FormField>
                  <FormField label="Expected delivery">
                    <Input type="date" value={expectedDelivery} onChange={setExpectedDelivery} />
                  </FormField>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("oem-draft", () => runQuotationAction(q.id, "oem-draft", {
                      poFileName: poName,
                      oem,
                      orderDetails,
                      expectedDeliveryDate: expectedDelivery,
                      orderDate: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Save Order Draft for OEM
                  </Button>
                </Card>
              )}

              {canDo(actions, "submit-order-approval") && (
                <Card title="Send OEM order for Sales Head approval">
                  {q.status.includes("Revisions") && (
                    <div className="space-y-2 mb-2">
                      <FormField label="OEM">
                        <Input value={oem || q.oem} onChange={setOem} />
                      </FormField>
                      <FormField label="Order details">
                        <Textarea value={orderDetails || q.orderDetails} onChange={setOrderDetails} rows={2} />
                      </FormField>
                      <Button
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => run("save-order", () => saveQuotation(q.id, {
                          oem: oem || q.oem,
                          orderDetails: orderDetails || q.orderDetails,
                          poFileName: poName || q.poFileName,
                          expectedDeliveryDate: expectedDelivery || q.expectedDeliveryDate,
                        }))}
                      >
                        Save order revisions
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("order-approval", () => runQuotationAction(q.id, "submit-order-approval"))}
                  >
                    Submit to Sales Head
                  </Button>
                </Card>
              )}

              {canDo(actions, "sales-head-review") && (
                <Card title="Sales Head — Review & Approval of order">
                  <FormField label="Action">
                    <select
                      className="w-full rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] px-3 py-2 text-sm"
                      value={approvalAction}
                      onChange={e => setApprovalAction(e.target.value)}
                    >
                      <option value="approve">Approve</option>
                      <option value="send_back">Send back for changes</option>
                      <option value="reject">Not Approved</option>
                    </select>
                  </FormField>
                  <FormField label="Remarks">
                    <Textarea value={approvalRemarks} onChange={setApprovalRemarks} rows={2} />
                  </FormField>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("sales-head", () => runQuotationAction(q.id, "sales-head-review", {
                      action: approvalAction,
                      remarks: approvalRemarks,
                      date: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Submit Sales Head Decision
                  </Button>
                </Card>
              )}

              {canDo(actions, "place-oem-order") && (
                <Card title="Place order with OEM">
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("place", () => runQuotationAction(q.id, "place-oem-order", {
                      submissionDate: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Mark Order Placed to OEM
                  </Button>
                </Card>
              )}

              {canDo(actions, "deliver") && (
                <Card title="Delivery & invoicing docs">
                  <FormField label="Customer invoice file">
                    <Input value={invoiceName} onChange={setInvoiceName} />
                  </FormField>
                  <FormField label="Delivery challan / docs note">
                    <Textarea value={deliveryNote} onChange={setDeliveryNote} rows={2} />
                  </FormField>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("deliver", () => runQuotationAction(q.id, "deliver", {
                      invoiceFileName: invoiceName,
                      deliveryDocsNote: deliveryNote,
                      deliveryDate: new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Mark Order Delivered to SI
                  </Button>
                </Card>
              )}

              {canDo(actions, "close-deal") && (
                <Card title="Payment received & close deal">
                  <FormField label="Payment docs note">
                    <Textarea value={paymentNote} onChange={setPaymentNote} rows={2} />
                  </FormField>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("close", () => runQuotationAction(q.id, "close-deal", {
                      paymentReceivedDate: new Date().toISOString().slice(0, 10),
                      paymentDocsNote: paymentNote,
                    }))}
                  >
                    Mark Deal Closed
                  </Button>
                </Card>
              )}

              {canDo(actions, "reopen-revisions") && (
                <Card title="Rejected — reopen for revisions">
                  <p className="text-sm text-[#64748B]">
                    This was not approved. Reopen so sales can revise and resubmit.
                  </p>
                  <Button
                    variant="gold"
                    disabled={!!busy}
                    onClick={() => run("reopen", () => runQuotationAction(q.id, "reopen-revisions"))}
                  >
                    Reopen for Revisions
                  </Button>
                </Card>
              )}

              {canDo(actions, "edit") && (
                <Card title="Edit quote fields">
                  <FormField label="Deal Value">
                    <Input
                      value={q.dealValue}
                      onChange={v => setData({ ...q, dealValue: v })}
                    />
                  </FormField>
                  <FormField label="Products">
                    <Input
                      value={q.products}
                      onChange={v => setData({ ...q, products: v })}
                    />
                  </FormField>
                  <FormField label="GP">
                    <Input
                      value={q.gpValue}
                      onChange={v => setData({ ...q, gpValue: v })}
                    />
                  </FormField>
                  <FormField label="Details">
                    <Textarea
                      value={q.details}
                      onChange={v => setData({ ...q, details: v })}
                      rows={2}
                    />
                  </FormField>
                  <Button
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => run("save", () => saveQuotation(q.id, {
                      dealValue: q.dealValue,
                      details: q.details,
                      products: q.products,
                      gpValue: q.gpValue,
                      partner: q.partner,
                      endUser: q.endUser,
                    }))}
                  >
                    Save Changes
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
