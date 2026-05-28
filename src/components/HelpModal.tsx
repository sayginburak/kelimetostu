import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type ExampleBoardProps = {
  top: string;
  middle?: string;
  bottom: string;
  topBadge?: string;
  bottomBadge?: string;
  marker?: "none" | "upper" | "middle" | "lower" | "win";
  middleKind?: "guess" | "empty" | "win";
};

export default function HelpModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-paper text-ink">
      <section className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-5 pb-10 pt-7 sm:px-8">
        <div className="relative mb-6 text-center">
          <h2 className="text-3xl font-black leading-none">Nasıl oynanır</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yardımı kapat"
            className="absolute -right-1 -top-2 grid h-10 w-10 place-items-center rounded-full bg-ink text-white hover:bg-stone-700"
          >
            <X aria-hidden size={24} strokeWidth={4} />
          </button>
        </div>

        <div className="space-y-4 text-[1.35rem] font-medium leading-snug text-ink sm:text-2xl">
          <p>Gizli 5 harfli Türkçe kelimeyi bul.</p>
          <p>
            Kelimeler <strong>Türkçe alfabetik sıraya</strong> göre dizilidir.
          </p>
          <p>
            Mavi satırlar arama sınırlarıdır: gizli kelime üstteki mavi kelimeden <strong>sonra</strong>, alttaki
            mavi kelimeden <strong>önce</strong> gelir.
          </p>
          <p>
            Her tahminden sonra bu iki sınır daralır.
          </p>
        </div>

        <HelpDivider />

        <HelpStep title="1) Ortadaki kutulara geçerli bir kelime yaz:">
          <ExampleBoard top="aaaaa" middle="sabah" bottom="zzzzz" marker="none" />
          <p className="mt-4 text-[1.15rem] leading-snug sm:text-xl">
            Başta <strong>AAAAA</strong> ve <strong>ZZZZZ</strong> gerçek tahmin değil; en geniş başlangıç
            sınırlarını gösterir.
          </p>
        </HelpStep>

        <HelpDivider />

        <HelpStep title="2) Tahminin yeni sınıra dönüşür:">
          <ExampleBoard
            top="aaaaa"
            middle=""
            bottom="sabah"
            topBadge="71"
            bottomBadge="12"
            marker="lower"
            middleKind="empty"
          />
          <div className="mt-4 space-y-1 text-[1.15rem] leading-snug sm:text-xl">
            <p>
              Tahminin <strong>yukarı</strong> taşınırsa cevap o kelimeden <strong>sonra</strong> gelir.
            </p>
            <p>
              Tahminin <strong>aşağı</strong> taşınırsa cevap o kelimeden <strong>önce</strong> gelir.
            </p>
            <p>
              Bu örnekte <strong>SABAH</strong> aşağı indi; yani cevap <strong>SABAH</strong>&apos;tan önce.
            </p>
          </div>
          <div className="mt-5 space-y-4 text-[1.15rem] leading-snug sm:text-xl">
            <p>
              <strong>Turuncu nokta</strong>, cevabın üstteki kelimeye mi alttaki kelimeye mi daha yakın olduğunu
              gösterir.
            </p>
            <p>
              Rozetteki sayı yüzde gibi okunur: <strong>12</strong>, yaklaşık <strong>%12</strong> uzaklık demektir.
              Sayı küçüldükçe cevap o kelimeye yaklaşır.
            </p>
          </div>
        </HelpStep>

        <HelpDivider />

        <HelpStep title="3) Sonraki tahminlerin bu iki sınırın arasında olmalı:">
          <ExampleBoard top="deniz" middle="kalem" bottom="sabah" topBadge="6.6" bottomBadge="12" marker="upper" />
          <p className="mt-4 text-[1.15rem] leading-snug sm:text-xl">
            Bu örnekte tahminin <strong>DENİZ</strong> ile <strong>SABAH</strong> arasında olmalı. Aralığın dışında
            kalan kelimeler kabul edilmez.
          </p>
        </HelpStep>

        <HelpDivider />

        <HelpStep title="4) Doğru kelimeyi bulduğunda orta satır yeşil olur:">
          <ExampleBoard top="kalem" middle="kitap" bottom="köpek" topBadge="2.7" bottomBadge="0.83" marker="win" middleKind="win" />
          <p className="mt-4 text-[1.15rem] leading-snug sm:text-xl">
            Klavyenin üstündeki küçük harfler yardım içindir: yazabileceğin sıradaki harfler koyu, yazamayacakların
            soluk görünür.
          </p>
        </HelpStep>
      </section>
    </div>
  );
}

function HelpDivider() {
  return <hr className="my-5 border-0 border-t-2 border-stone-400" />;
}

function HelpStep({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[1.35rem] font-medium leading-snug sm:text-2xl">{title}</h3>
      {children}
    </section>
  );
}

function ExampleBoard({
  top,
  middle = "",
  bottom,
  topBadge = "?",
  bottomBadge = "?",
  marker = "middle",
  middleKind = "guess"
}: ExampleBoardProps) {
  return (
    <div className="mx-auto grid w-full max-w-[30rem] grid-cols-[3.2rem_1fr] gap-2 sm:grid-cols-[4rem_1fr]">
      <MiniIndicator topBadge={topBadge} bottomBadge={bottomBadge} marker={marker} />
      <div className="grid gap-1.5">
        <MiniWord word={top} kind="bound" />
        <MiniWord word={middle} kind={middleKind} />
        <MiniWord word={bottom} kind="bound" />
      </div>
    </div>
  );
}

function MiniIndicator({
  topBadge,
  bottomBadge,
  marker
}: {
  topBadge: string;
  bottomBadge: string;
  marker: ExampleBoardProps["marker"];
}) {
  const markerTop = {
    none: "-100%",
    upper: "33%",
    middle: "50%",
    lower: "66%",
    win: "50%"
  }[marker ?? "middle"];
  const markerClass = marker === "win" ? "bg-win" : "bg-active";

  return (
    <div className="relative min-h-[11.2rem] sm:min-h-[13rem]" aria-hidden>
      <div className="absolute bottom-9 left-1/2 top-9 w-1 -translate-x-1/2 bg-bound" />
      <div className="absolute left-1/2 top-0 grid h-9 min-w-10 -translate-x-1/2 place-items-center rounded bg-bound px-2 text-lg font-black text-white after:absolute after:-bottom-2 after:left-1/2 after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-8 after:border-t-8 after:border-x-transparent after:border-t-bound sm:h-10 sm:min-w-12 sm:text-xl">
        {topBadge}
      </div>
      {marker !== "none" ? (
        <span
          className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${markerClass}`}
          style={{ top: markerTop }}
        />
      ) : null}
      <div className="absolute bottom-0 left-1/2 grid h-9 min-w-10 -translate-x-1/2 place-items-center rounded bg-bound px-2 text-lg font-black text-white before:absolute before:-top-2 before:left-1/2 before:h-0 before:w-0 before:-translate-x-1/2 before:border-x-8 before:border-b-8 before:border-x-transparent before:border-b-bound sm:h-10 sm:min-w-12 sm:text-xl">
        {bottomBadge}
      </div>
    </div>
  );
}

function MiniWord({ word, kind }: { word: string; kind: "bound" | "guess" | "empty" | "win" }) {
  const letters = word.toLocaleUpperCase("tr-TR").padEnd(5, " ").slice(0, 5).split("");
  const style = {
    bound: "border-bound bg-bound text-boundSoft",
    guess: "border-active bg-active text-white",
    empty: "border-stone-500 bg-transparent text-stone-600",
    win: "border-win bg-win text-white"
  }[kind];

  return (
    <div className="grid grid-cols-5 gap-1">
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={`grid aspect-square place-items-center border-2 text-[2rem] font-black leading-none sm:text-[2.6rem] ${style}`}
        >
          {letter.trim()}
        </span>
      ))}
    </div>
  );
}
