export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://challenges.cloudflare.com" />
      {children}
    </>
  );
}
