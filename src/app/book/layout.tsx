// Minimal public chrome for patient-facing booking pages — no app shell,
// no navigation, just a centered column that works in light and dark.

export default function BookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>
      <footer className="py-6 text-center text-xs text-faint">
        Online bookings powered by PracticeHub
      </footer>
    </div>
  );
}
