export const SAMPLE_RECORD_DETAIL = {
  identifier: "",
  accountName: "",
  status: "",
  address: "",
  businessType: "",
  mobile: "",
  email: "",
  requestedLimit: "",
  keyContact: { name: "", phone: "", email: "" },
  financialContact: { name: "", phone: "", email: "" },
  recommendationNote: "",
};

export const RATE_ACTION_KEY = "milex.sales.rate-action";
export const LINE_MANAGER_APPROVAL_KEY = "milex.line-manager.approval";
export const OFFER_DOCUMENT_KEY = "milex.sales.offer-document";
export const CLIENT_FINALIZATION_KEY = "milex.sales.client-finalization";

export const FINAL_PROFILE_INITIAL = {
  accountMode: "Regular Account",
  provisionalReason: "",
  provisionalExpiryDate: "",
  signedAgreementFile: "",
  managingPartner: "",
  binNumber: "",
  tinNumber: "",
  destinations: "",
  preferredCarrier: "",
  natureOfBusiness: "",
  accountSpecifics: "",
  finalAmountLimit: "",
  finalTimeLimit: "",
};

export const LEGAL_DOCUMENTS_INITIAL = [
  { id: "offer-letter", title: "Offer Letter", required: true, documentNumber: "", expiryDate: "", fileName: "" },
  { id: "signed-agreement", title: "Signed Agreement", required: true, documentNumber: "", expiryDate: "", fileName: "" },
  { id: "tin", title: "Customer TIN", required: true, documentNumber: "", expiryDate: "", fileName: "" },
  { id: "bin", title: "Customer BIN", required: true, documentNumber: "", expiryDate: "", fileName: "" },
  { id: "trade-license", title: "Trade License", required: true, documentNumber: "", expiryDate: "", fileName: "" },
  { id: "other-documents", title: "Other Documents", required: false, documentNumber: "", expiryDate: "", fileName: "" },
];
