
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Users,
  CircleHelp,
  MessagesSquare,
  HeartHandshake,
  GraduationCap,
} from "lucide-react";

type AuthLayoutProps = {
  mode: "login" | "register";
  children: ReactNode;
};

export default function AuthLayout({
  mode,
  children,
}: AuthLayoutProps) {
  const isLogin = mode === "login";

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-7 text-[#1e2b45]">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1010px] items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">

        {/* Ліва інформаційна частина */}
        <section className="mx-auto w-full max-w-[410px]">

          {/* Логотип StudentQ&A */}
          <Link
            href="/"
            aria-label="StudentQ&A — головна сторінка"
            className="mb-8 inline-flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5145e5] text-white shadow-sm">
              <GraduationCap size={26} strokeWidth={2} />
            </div>

            <span className="text-xl font-bold tracking-tight text-[#1e2b45]">
              Student<span className="text-[#5145e5]">Q&A</span>
            </span>
          </Link>

          <div>
            <span className="inline-block rounded bg-[#eeebff] px-2 py-1 text-[10px] font-medium text-[#5145e5]">
              {isLogin
                ? "Твоя спільнота. Твої відповіді."
                : "Знання об'єднують"}
            </span>

            <h1 className="mt-5 text-[30px] font-bold leading-[1.12] tracking-tight sm:text-[36px]">
              {isLogin ? (
                <>
                  Складні теми. Прості
                  <br className="hidden sm:block" /> пояснення. Разом.
                </>
              ) : (
                <>
                  Одна спільнота.
                  <br />
                  Тисячі корисних
                  <br className="hidden sm:block" /> пояснень.
                </>
              )}
            </h1>

            <p className="mt-4 text-sm leading-6 text-[#7b8aa4]">
              {isLogin
                ? "Повертайся до розмов, що допомагають зрозуміти більше. Тут завжди є хтось, хто вже розібрався."
                : "Не залишайся зі складною задачею наодинці. Запитуй, допомагай та знаходь однодумців."}
            </p>

            {isLogin ? (
              <div className="mt-5 rounded-xl bg-[#eeecff] p-4">
                <p className="text-sm leading-5 text-[#34405b]">
                  «Нарешті зрозуміла асинхронність —
                  завдяки одному зрозумілому прикладу від
                  іншого студента.»
                </p>

                <p className="mt-3 text-xs text-[#7b86a1]">
                  Марія · студентка комп'ютерних наук
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <Feature
                  icon={<CircleHelp size={17} />}
                  title="Запитуй без страху"
                  text="Кожне запитання — можливість зрозуміти більше."
                />

                <Feature
                  icon={<MessagesSquare size={17} />}
                  title="Отримуй зрозумілі відповіді"
                  text="Пояснення від студентів, які пройшли цей шлях."
                />

                <Feature
                  icon={<HeartHandshake size={17} />}
                  title="Ділися власним досвідом"
                  text="Твоя відповідь може змінити чиїсь знання."
                />
              </div>
            )}

            {isLogin && (
              <div className="mt-5 flex items-center gap-2 text-xs text-[#8190a9]">
                <Users size={16} className="text-[#5748f4]" />
                <span>2 840 студентів навчаються разом</span>
              </div>
            )}
          </div>
        </section>

        {/* Права частина — форма авторизації */}
        <section className="mx-auto w-full max-w-[440px]">
          <div className="rounded-xl border border-[#e6ebf3] bg-white p-6 shadow-[0_2px_8px_rgba(30,43,69,0.02)] sm:p-8">
            {children}
          </div>

          <p className="mt-4 text-center text-[10px] leading-5 text-[#8794a9]">
            {isLogin
              ? "Ваші дані захищені. Не передавайте пароль іншим."
              : "Не потрібні рекомендації пошти чи підтвердження акаунту для демонстрації."}
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-x-2 text-[10px] text-[#8794a9]">
            <Link href="/terms" className="hover:text-[#5145e5]">
              Правила спільноти
            </Link>

            <span>·</span>

            <Link href="/privacy" className="hover:text-[#5145e5]">
              Конфіденційність
            </Link>

            <span>·</span>

            <a
              href="mailto:support@studentqa.example"
              className="hover:text-[#5145e5]"
            >
              Допомога
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-[#6254ff]">{icon}</div>

      <div>
        <h3 className="text-sm font-semibold">{title}</h3>

        <p className="mt-1 text-xs leading-5 text-[#8190a9]">
          {text}
        </p>
      </div>
    </div>
  );
}
