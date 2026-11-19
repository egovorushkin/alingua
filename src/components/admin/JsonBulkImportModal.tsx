"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function JsonBulkImportModal({ topicTitle, onImport, onClose }: {
  topicTitle: string; onImport: (raw: string) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const inputId = useId();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby={titleId} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl backdrop:bg-slate-950/50">
      <h2 id={titleId} className="text-2xl font-black">Импорт JSON: {topicTitle}</h2>
      <p className="my-4 text-sm text-slate-600">Массив WordItem[]. Поля: id, english, russian, emoji, icon3d (или icon), exampleSentence. Максимум 200 слов в теме. Ошибка или дубликат отменяет весь импорт.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        try { onImport(raw); onClose(); }
        catch (error) { setError(error instanceof Error ? error.message : "Импорт не удался."); }
      }}>
        <label htmlFor={inputId} className="font-bold">Слова в формате JSON</label>
        <textarea id={inputId} autoFocus required value={raw} maxLength={200_000} onChange={(event) => setRaw(event.target.value)} rows={12} spellCheck={false} placeholder={'[\n  {"id":"cloud","english":"Cloud","russian":"Облако","emoji":"☁️","icon3d":"","exampleSentence":"The cloud is white."}\n]'} className="my-3 w-full rounded-xl border-2 border-slate-200 p-3 font-mono text-sm" />
        {error && <p role="alert" className="mb-4 font-bold text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="min-h-12 rounded-xl bg-violet-700 px-5 font-bold text-white">Проверить и добавить</button>
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl bg-slate-100 px-5 font-bold">Отмена</button>
        </div>
      </form>
    </dialog>
  );
}
