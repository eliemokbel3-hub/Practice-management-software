// Minimal public chrome for patient questionnaires — no app shell, works in
// light and dark, served by token link without a login.

export default function MeasureLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>
      <footer className="py-6 text-center text-xs text-faint">
        Powered by PracticeHub
      </footer>
    </div>
  );
}
