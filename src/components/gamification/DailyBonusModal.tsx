"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Check, Gift, LockKeyhole, Star, X } from "lucide-react";
import { useProgress, type DailyBonusClaim } from "@/context/ProgressContext";
import { dailyBonusRewards } from "@/utils/progress";
import { formatCount } from "@/utils/russian";
import { soundFX } from "@/utils/sound";

export default function DailyBonusModal() {
  const { dailyBonus, consecutiveDays, lastClaimedDate, claimDailyBonus, isHydrated, error } = useProgress();
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedDate, setDismissedDate] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<DailyBonusClaim | null>(null);
  const [claimError, setClaimError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const finishButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  const open = isHydrated && (
    manualOpen || receipt !== null || claimError ||
    Boolean(dailyBonus?.canClaim && !error && dismissedDate !== dailyBonus.today)
  );

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open && (!dailyBonus?.canClaim || receipt)) finishButton.current?.focus();
  }, [open, dailyBonus?.canClaim, receipt]);

  function close() {
    setDismissedDate(dailyBonus?.today ?? null);
    setManualOpen(false);
    setReceipt(null);
    setClaimError(false);
  }

  function claim() {
    setManualOpen(true);
    try {
      const reward = claimDailyBonus();
      setClaimError(false);
      if (reward) {
        setReceipt(reward);
        soundFX.playSuccess();
      }
    } catch (error) {
      console.warn("Alingua daily bonus could not be saved.", error);
      setClaimError(true);
    }
  }

  const starsLabel = (stars: number) => formatCount(stars, "звезда", "звезды", "звёзд");

  return (
    <>
      <motion.button
        type="button"
        disabled={!isHydrated}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setManualOpen(true)}
        whileTap={{ scale: reduceMotion ? 1 : 0.96 }}
        className={`inline-flex min-h-12 items-center gap-2 rounded-2xl border-b-4 px-4 text-sm font-black disabled:opacity-60 ${dailyBonus?.canClaim ? "border-amber-300 bg-amber-100 text-amber-900 shadow-[0_0_24px_#f6c94e55]" : "border-[#d6ccf5] bg-[#eeeaff] text-[#604ac5]"}`}
      >
        <Gift size={20} aria-hidden="true" />
        Подарок дня
        {dailyBonus?.canClaim
          ? <span className="rounded-full bg-white/80 px-2 py-0.5">+{dailyBonus.stars}<span className="sr-only"> звёзд доступно</span></span>
          : dailyBonus && <Check size={17} aria-label="Получено" />}
      </motion.button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => { event.preventDefault(); close(); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); close(); }
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh_-_1.5rem)] w-[calc(100%_-_1.5rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-[32px] border-0 bg-white p-5 text-[#343049] shadow-2xl backdrop:bg-[#252039]/55 sm:p-7"
      >
        <button type="button" aria-label="Закрыть подарок дня" onClick={close} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-transform motion-safe:active:scale-95">
          <X size={21} aria-hidden="true" />
        </button>
        <header className="text-center">
          <motion.div
            animate={open && !reduceMotion ? { rotate: [0, -8, 8, 0] } : undefined}
            transition={{ duration: 0.6 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600"
          >
            <Gift size={36} aria-hidden="true" />
          </motion.div>
          <h2 id={titleId} className="mt-4 text-2xl font-black sm:text-3xl">Подарок дня</h2>
          <p id={descriptionId} className="mt-2 text-sm font-bold text-[#777184]">
            Заходи каждый день за звёздами. На седьмой день тебя ждёт особый значок!
          </p>
          {consecutiveDays > 0 && <p className="mt-2 text-sm font-black text-[#7961bf]">Подарки подряд: {formatCount(consecutiveDays, "день", "дня", "дней")}</p>}
          {dailyBonus?.recovering && (
            <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-800">
              Как здорово, что ты вернулся! После паузы начнём с первого подарка. Все твои звёзды и значки остались с тобой.
            </p>
          )}
        </header>

        <ol aria-label="Подарки за семь дней" className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {dailyBonusRewards.map((stars, index) => {
            const day = index + 1;
            const available = Boolean(dailyBonus?.canClaim && day === dailyBonus.day);
            const claimed = Boolean(dailyBonus && (day < dailyBonus.day || (!dailyBonus.canClaim && day === dailyBonus.day)));
            return (
              <motion.li
                key={day}
                animate={available && !reduceMotion ? { boxShadow: ["0 0 0 0 #fbbf2400", "0 0 0 4px #fbbf2466", "0 0 0 0 #fbbf2400"] } : { boxShadow: "0 0 0 0 #fbbf2400" }}
                transition={{ duration: 1.8, repeat: available && !reduceMotion ? Infinity : 0 }}
                className={`flex flex-col items-center rounded-2xl border-2 p-2 text-center ${day === 7 ? "col-span-2 sm:col-span-1" : ""} ${available ? "border-amber-400 bg-amber-50 text-amber-900" : claimed ? "border-emerald-100 bg-emerald-50/60 text-emerald-800" : "border-slate-100 bg-slate-50 text-slate-500"}`}
              >
                <p className="text-xs font-black">День {day}</p>
                <motion.div
                  animate={available && !reduceMotion ? { y: [0, -4, 0] } : { y: 0 }}
                  transition={{ duration: 1.2, repeat: available && !reduceMotion ? Infinity : 0 }}
                  className={`my-2 flex h-10 w-10 items-center justify-center rounded-xl ${available ? "bg-amber-200 text-amber-700" : claimed ? "bg-emerald-100" : "bg-slate-200/60"}`}
                  aria-hidden="true"
                >
                  {claimed ? <Check size={24} /> : available ? day === 7 ? <Gift size={26} /> : <Star size={24} fill="currentColor" /> : <LockKeyhole size={21} />}
                </motion.div>
                <p className="text-lg font-black"><span aria-hidden="true">+{stars}</span><span className="sr-only">{starsLabel(stars)}</span></p>
                <p className="mt-1 text-[10px] font-extrabold">{claimed ? "Забрано" : available ? "Сегодня" : "Позже"}</p>
                {day === 7 && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black"><Award size={12} aria-hidden="true" />Значок</span>}
              </motion.li>
            );
          })}
        </ol>

        <div className="sticky bottom-0 z-10 mt-5 bg-white pt-3 text-center">
          {receipt && (
            <div role="status" className="relative overflow-hidden rounded-2xl bg-emerald-50 p-4 text-emerald-800">
              {!reduceMotion && Array.from({ length: 16 }, (_, index) => (
                <motion.span
                  key={index}
                  aria-hidden="true"
                  initial={{ x: 0, y: 15, opacity: 1, scale: 0.5 }}
                  animate={{ x: (index - 7.5) * 24, y: [-10, -70, 60], opacity: [1, 1, 0], rotate: index * 75, scale: 1 }}
                  transition={{ duration: 1.5, delay: (index % 4) * 0.05 }}
                  className={`pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-sm ${["bg-amber-400", "bg-violet-400", "bg-emerald-400", "bg-rose-400"][index % 4]}`}
                />
              ))}
              <p className="relative text-xl font-black">Ура! Начислено: {starsLabel(receipt.stars)}!</p>
              {receipt.badgeUnlocked && <p className="relative mt-2 text-sm font-bold">Открыт значок «Неделя подарков»!</p>}
            </div>
          )}
          {(claimError || error) && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800">{error ?? "Не удалось сохранить подарок. Звёзды не начислены. Попробуй ещё раз."}</p>}
          {dailyBonus?.canClaim && !receipt ? (
            <motion.button type="button" data-sound="off" onClick={claim} whileTap={{ scale: reduceMotion ? 1 : 0.97 }} className="min-h-14 w-full rounded-2xl border-b-4 border-amber-400 bg-amber-200 px-4 py-3 font-black text-amber-950">
              Получить {starsLabel(dailyBonus.stars)}!
            </motion.button>
          ) : (
            <>
              {!receipt && dailyBonus && (
                <p className="mb-4 text-sm font-bold text-[#777184]">
                  {lastClaimedDate > dailyBonus.today
                    ? "Похоже, дата на устройстве изменилась. Попроси взрослого проверить её: все подарки сохранены."
                    : "Сегодняшний подарок уже твой. Новый появится завтра!"}
                </p>
              )}
              <button ref={finishButton} type="button" onClick={close} className="mt-3 min-h-14 w-full rounded-2xl border-b-4 border-[#5843b8] bg-[#745ce4] px-4 py-3 font-black text-white transition-transform motion-safe:active:scale-95">
                {receipt ? "Здорово!" : "К приключениям"}
              </button>
            </>
          )}
          <p className="mt-3 text-xs font-bold text-[#777184]">После семи дней начинается новая неделя подарков. Значок остаётся навсегда.</p>
        </div>
      </dialog>
    </>
  );
}
