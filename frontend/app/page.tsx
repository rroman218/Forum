import { redirect } from "next/navigation";

export default async function HomePage() {

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#1e2b45]">
            StudentQ&A
          </h1>

          <form
          >
            <button className="rounded-lg border border-[#e0e6ef] bg-white px-4 py-2 text-sm hover:bg-gray-50">
              Вийти
            </button>
          </form>
        </header>

        <section className="mt-12 rounded-2xl border border-[#e6ebf3] bg-white p-8">
          <p className="text-sm text-[#5145e5]">
            Вітаємо у спільноті!
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[#1e2b45]">
            Привіт, User
          </h2>

          <p className="mt-3 text-[#75839a]">
            Став запитання, ділися знаннями та допомагай іншим студентам.
          </p>
        </section>
      </div>
    </main>
  );
}
