export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="lg:fixed lg:inset-0 lg:overflow-hidden">
      <div className="container mx-auto px-4 py-6 lg:h-full lg:overflow-hidden">
        {children}
      </div>
    </main>
  );
}
