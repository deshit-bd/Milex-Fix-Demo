"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import StepProgress from "./StepProgress";
import BasicInformationStep from "./BasicInformationStep";
import FinancialTermsStep from "./FinancialTermsStep";
import ContactPersonsStep from "./ContactPersonsStep";
import ShippingDetailsStep from "./ShippingDetailsStep";
import RecommendationDetailsStep from "./RecommendationDetailsStep";
import { DRAFT_KEY, INITIAL_FORM } from "./recommendationData";
import { createCustomerCode, createCustomerCodeFromServer } from "@/lib/workflow";
import { runDatabaseAction } from "@/lib/database";
import { getCurrentSession } from "@/lib/auth";

function normalizeCustomerCode(identifier) {
  return identifier ? identifier.replace(/^MLX-/, "MLX") : "";
}

export default function RecommendationForm({ onCustomerCodeChange }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState(1);
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(getCurrentSession());
    const draft = localStorage.getItem(DRAFT_KEY);
    const parsedDraft = draft ? JSON.parse(draft) : {};
    const draftForm = parsedDraft.form || parsedDraft;
    const nextStep = parsedDraft.currentStep || 1;
    const identifier = normalizeCustomerCode(draftForm.identifier) || createCustomerCode();
    const nextForm = { ...INITIAL_FORM, ...draftForm, identifier };

    setForm(nextForm);
    setCurrentStep(nextStep);
    onCustomerCodeChange?.(identifier);
    if (!draftForm.identifier) {
      createCustomerCodeFromServer().then((serverIdentifier) => {
        const serverForm = { ...nextForm, identifier: serverIdentifier };
        setForm(serverForm);
        onCustomerCodeChange?.(serverIdentifier);
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form: serverForm, currentStep: nextStep }));
      });
    }
    if (!draftForm.identifier) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form: nextForm, currentStep: nextStep }));
    }
  }, [onCustomerCodeChange]);

  function updateForm(event) {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => {
      const nextForm = { ...current, [event.target.name]: value };
      if (event.target.name === "useKeyAsFinancial" && value) {
        nextForm.financialName = current.keyName;
        nextForm.financialDesignation = current.keyDesignation;
        nextForm.financialMobile = current.keyMobile;
        nextForm.financialEmail = current.keyEmail;
      }
      if (event.target.name === "useKeyAsFinancial" && !value) {
        nextForm.financialName = "";
        nextForm.financialDesignation = "";
        nextForm.financialMobile = "";
        nextForm.financialEmail = "";
      }
      if (current.useKeyAsFinancial && event.target.name.startsWith("key")) {
        nextForm[`financial${event.target.name.slice(3)}`] = value;
      }
      return nextForm;
    });
  }

  function persist(step = currentStep) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, currentStep: step }));
  }

  function saveDraft() {
    persist();
    Swal.fire({ icon: "success", title: "Draft saved", timer: 900, showConfirmButton: false });
  }

  function nextStep(event) {
    event.preventDefault();
    if (!event.currentTarget.form.reportValidity()) return;
    const next = Math.min(currentStep + 1, 5);
    persist(next);
    setCurrentStep(next);
    Swal.fire({ icon: "success", title: "Information saved", text: "Ready for the next section.", timer: 900, showConfirmButton: false });
  }

  async function submitRecommendation(event) {
    event.preventDefault();
    if (!event.currentTarget.form.reportValidity()) return;

    const identifier = normalizeCustomerCode(form.identifier) || createCustomerCode();
    const record = { ...form, identifier, status: "Submitted to Sales Coordinator", submittedAt: new Date().toISOString() };
    const result = await runDatabaseAction("submitRecommendation", { record });
    localStorage.removeItem(DRAFT_KEY);
    if (!result.ok) {
      Swal.fire({
        icon: "warning",
        title: "Saved locally only",
        text: result.error || "Google Sheets is not configured yet.",
        confirmButtonColor: "#078b4d",
      });
      return;
    }
    Swal.fire({
      icon: "success",
      title: "Recommendation submitted",
      text: "The Sales Coordinator can now review this recommendation.",
      confirmButtonColor: "#078b4d",
    }).then(() => window.location.replace("/kam/dashboard"));
  }

  return (
    <form className="recommendation-form">
      <section className="form-card recommendation-header">
        <h1>New Recommendation Form</h1>
        <StepProgress currentStep={currentStep} />
      </section>
      {currentStep === 1 && <BasicInformationStep form={form} session={session} onChange={updateForm} onSave={saveDraft} onNext={nextStep} />}
      {currentStep === 2 && <FinancialTermsStep form={form} onChange={updateForm} onSave={saveDraft} onNext={nextStep} onPrevious={() => { persist(1); setCurrentStep(1); }} />}
      {currentStep === 3 && <ContactPersonsStep form={form} onChange={updateForm} onSave={saveDraft} onNext={nextStep} onPrevious={() => { persist(2); setCurrentStep(2); }} />}
      {currentStep === 4 && <ShippingDetailsStep form={form} onChange={updateForm} onSave={saveDraft} onNext={nextStep} onPrevious={() => { persist(3); setCurrentStep(3); }} />}
      {currentStep >= 5 && <RecommendationDetailsStep form={form} onChange={updateForm} onSave={saveDraft} onSubmit={submitRecommendation} onPrevious={() => { persist(4); setCurrentStep(4); }} />}
    </form>
  );
}
