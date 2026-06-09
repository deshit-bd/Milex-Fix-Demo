import "./globals.css";

export const metadata = {
  title: "MileX | Sign In",
  description: "MileX logistics management portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
