import { CircleHelp, Play, Shuffle } from "lucide-react";

type Props = {
  onDaily: () => void;
  onFree: () => void;
  onHelp: () => void;
};

export default function HomeScreen({ onDaily, onFree, onHelp }: Props) {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center gap-8">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-normal sm:text-7xl">Söz Arası</h1>
          <p className="mt-4 text-xl font-semibold text-stone-600">
            Diğer kelimelerin arasında gizlenen kelimeyi bul.
          </p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={onDaily}
            className="flex items-center justify-center gap-3 rounded-lg bg-bound px-5 py-5 text-2xl font-black text-white shadow-sm transition hover:brightness-105"
          >
            <Play aria-hidden size={30} fill="currentColor" />
            Günlük Kelime
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onFree}
              className="flex items-center justify-center gap-3 rounded-lg bg-win px-5 py-4 text-xl font-black text-white shadow-sm transition hover:brightness-105"
            >
              <Shuffle aria-hidden size={25} />
              Serbest Oyun
            </button>
            <button
              type="button"
              onClick={onHelp}
              className="flex items-center justify-center gap-3 rounded-lg bg-active px-5 py-4 text-xl font-black text-white shadow-sm transition hover:brightness-105"
            >
              <CircleHelp aria-hidden size={26} />
              Yardım
            </button>
          </div>
        </div>

        <p className="border-t border-stone-300 pt-5 text-center text-sm font-medium text-stone-500">
          Özel kelime oluşturma ve seviye modu sonraki sürümler için ayrıldı.
        </p>
      </section>
    </main>
  );
}
