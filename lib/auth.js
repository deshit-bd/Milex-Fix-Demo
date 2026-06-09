import { ensureDatabase } from "./database";

export const STORAGE_KEY = "milex.session";

export const DEMO_USERS = [
  { name: "Md. Rahim", title: "KAM", role: "KAM", email: "kam@milex.com", password: "123456" },
  { name: "Nusrat Jahan", title: "Sales Coordinator", role: "Sales Coordinator", email: "sales@milex.com", password: "123456" },
  { name: "Tanvir Ahmed", title: "Line Manager", role: "Line Manager", email: "manager@milex.com", password: "123456" },
];

export function getRoleRoute(session) {
  if (!session) return "/login";
  if (session.role === "KAM") return "/kam/dashboard";
  if (session.role === "Sales Coordinator") return "/sales/dashboard";
  if (session.role === "Line Manager") return "/line-manager/dashboard";
  return "/pending";
}

export function getCurrentSession() {
  ensureDatabase();
  const storedSession = localStorage.getItem(STORAGE_KEY);
  if (!storedSession) return null;

  try {
    return JSON.parse(storedSession);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function authenticate(credentials) {
  ensureDatabase();
  const user = DEMO_USERS.find(
    (item) =>
      item.email === credentials.email.trim().toLowerCase() &&
      item.password === credentials.password
  );

  if (!user) return null;

  const session = {
    name: user.name,
    title: user.title,
    role: user.role,
    email: user.email,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.replace("/login");
}
