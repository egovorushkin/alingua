"use client";

import Link from "next/link";
import { useId, useRef, useState, type InputHTMLAttributes } from "react";
import { BookOpen, LockKeyhole, Plus, Upload, Volume2 } from "lucide-react";
import ParentGate from "@/components/admin/ParentGate";
import JsonBulkImportModal from "@/components/admin/JsonBulkImportModal";
import Icon3D from "@/components/ui/Icon3D";
import { SoundToggle } from "@/components/SoundControls";
import { useCurriculum } from "@/context/CurriculumContext";
import {
  defaultChapters, defaultTopics, importWords, mergeCurriculum, parseChapter, parseTopic, parseWords,
  type CurriculumChapter, type CurriculumEdits, type CurriculumTopic,
} from "@/data/curriculum";
import type { WordItem } from "@/data/lessons";
import { formatCount } from "@/utils/russian";
import { speakWord } from "@/utils/speech";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800";
const box = "rounded-2xl border border-slate-200 bg-white p-5";
const message = (error: unknown) => error instanceof Error ? error.message : "Не удалось сохранить изменения.";
const replace = <T extends { id: string },>(items: T[], item: T): T[] => items.some((value) => value.id === item.id) ? items.map((value) => value.id === item.id ? item : value) : [...items, item];

function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return <label htmlFor={id} className="block text-sm font-bold text-slate-700">{label}<input id={id} {...props} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-medium read-only:bg-slate-100" /></label>;
}

function WordEditor({ word, onSave, onCancel }: { word: WordItem | null; onSave: (word: WordItem) => void; onCancel: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ icon: string; emoji: string }>({ icon: word?.icon ?? "", emoji: word?.emoji ?? "📖" });
  return (
    <form ref={form} aria-label={word ? "Редактирование слова" : "Новое слово"} className={`${box} space-y-4`} onSubmit={(event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const values = Object.fromEntries(new FormData(element));
      try {
        const english = String(values.english ?? "");
        const id = values.id || english.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        onSave(parseWords([{ ...values, id }])[0]);
        if (!word) { element.reset(); setPreview({ icon: "", emoji: "📖" }); }
        setError("");
      } catch (error) { setError(message(error)); }
    }}>
      <h3 className="text-lg font-black">{word ? "Редактирование слова" : "Новое слово"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ID слова" name="id" defaultValue={word?.id ?? ""} readOnly={Boolean(word)} maxLength={64} placeholder="Автоматически по английскому слову" />
        <Field label="English" name="english" defaultValue={word?.english ?? ""} required maxLength={60} lang="en" />
        <Field label="Русский перевод" name="russian" defaultValue={word?.russian ?? ""} required maxLength={100} />
        <Field label="Эмодзи слова" name="emoji" defaultValue={word?.emoji ?? "📖"} required maxLength={24} onChange={(event) => setPreview({ ...preview, emoji: event.target.value })} />
        <Field label="3D-иконка слова" name="icon3d" defaultValue={word?.icon ?? ""} maxLength={100} placeholder="rocket.webp или пусто для эмодзи" onChange={(event) => setPreview({ ...preview, icon: event.target.value })} />
        <Icon3D name={preview.icon} fallback={preview.emoji || "📖"} size={64} />
      </div>
      <Field label="Пример предложения на английском" name="exampleSentence" defaultValue={word?.exampleSentence ?? ""} required maxLength={240} lang="en" />
      <p className="text-xs text-slate-500">Иконки загружаются только из /icons/3dicons/. Если файла нет, показывается эмодзи.</p>
      {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className={button} type="submit">{word ? "Сохранить слово" : "Добавить слово"}</button>
        <button className={secondary} data-sound="off" type="button" onClick={() => {
          setError("");
          const english = form.current?.querySelector<HTMLInputElement>('[name="english"]')?.value.trim();
          if (!english) { setError("Сначала введи английское слово."); return; }
          if (!speakWord(english, () => setError("Не удалось озвучить слово. Проверь поддержку речи и настройки браузера."))) setError("Включи звук и проверь поддержку речи в браузере.");
        }}><Volume2 size={16} aria-hidden="true" /> Проверить произношение</button>
        {word && <button className={secondary} type="button" onClick={onCancel}>Отменить редактирование</button>}
      </div>
    </form>
  );
}

function Studio({ lock }: { lock: () => void }) {
  const catalog = useCurriculum();
  const { curriculum } = catalog;
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [editingChapter, setEditingChapter] = useState<CurriculumChapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<CurriculumTopic | null>(null);
  const [editingWord, setEditingWord] = useState<{ topicId: string; id: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const chapter = curriculum.chapters.find((item) => item.id === chapterId) ?? curriculum.chapters[0];
  const topics = curriculum.topics.filter((topic) => topic.chapterId === chapter?.id);
  const topic = topics.find((item) => item.id === topicId) ?? topics[0];
  const wordBeingEdited = editingWord?.topicId === topic?.id ? topic?.words.find((word) => word.id === editingWord?.id) ?? null : null;

  function persist(change: (edits: CurriculumEdits) => CurriculumEdits, success: string) {
    catalog.update(change);
    setError("");
    setNotice(success);
  }
  function run(action: () => void) {
    setNotice(""); setError("");
    try { action(); } catch (error) { setError(message(error)); }
  }
  function changeWords(update: (words: WordItem[]) => WordItem[], success: string) {
    if (!topic) throw new Error("Сначала выбери тему.");
    persist((edits) => {
      const current = mergeCurriculum(edits).topics.find((item) => item.id === topic.id);
      if (!current) throw new Error("Тема больше недоступна. Выбери другую тему.");
      return { ...edits, topics: replace(edits.topics, { ...current, words: parseWords(update(current.words)) }) };
    }, success);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-7 text-slate-900 sm:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="flex items-center gap-3 text-3xl font-black"><BookOpen aria-hidden="true" /> Родительская студия</h1><p className="mt-2 text-sm text-slate-600">Главы, темы и слова. Встроенный каталог можно менять и восстанавливать; прогресс не удаляется.</p></div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Родительская навигация">
          <SoundToggle /><Link onClick={lock} href="/" className={secondary}>На главную</Link><button type="button" onClick={lock} className={secondary}><LockKeyhole size={16} aria-hidden="true" /> Закрыть панель</button>
        </nav>
      </header>
      <section aria-label="Сохранение каталога" className={`${box} mb-5`}>
        <p role="status" className="text-sm font-bold">{catalog.sync.status === "local" ? "Гостевой каталог: только в этом браузере." : catalog.sync.status === "synced" ? "Каталог сохранён в аккаунте и в этом браузере." : catalog.sync.status === "loading" ? "Проверяем облачную копию…" : catalog.sync.status === "saving" ? "Синхронизируем каталог…" : catalog.sync.error}</p>
        {["error", "conflict"].includes(catalog.sync.status) && <div className="mt-3 flex flex-wrap gap-2">
          {catalog.sync.status === "error" ? <button type="button" className={secondary} onClick={catalog.retry}>Повторить синхронизацию</button> : <>
            <button type="button" className={secondary} onClick={() => { if (confirm("Заменить облачный каталог этой локальной копией?")) catalog.resolve("local"); }}>Оставить локальную копию</button>
            <button type="button" className={secondary} onClick={() => { if (confirm("Заменить локальный каталог облачной копией?")) catalog.resolve("cloud"); }}>Загрузить из облака</button>
          </>}
        </div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={secondary} onClick={() => run(() => persist((edits) => ({ ...edits, hiddenChapters: [], hiddenTopics: [] }), "Скрытые главы и темы восстановлены."))}>Восстановить скрытые</button>
          <button type="button" className={secondary} onClick={() => {
            if (confirm("Сбросить изменения встроенных тем и глав? Ваши собственные материалы и прогресс останутся.")) run(() => persist((edits) => ({
              chapters: edits.chapters.filter((item) => !defaultChapters.some((base) => base.id === item.id)),
              topics: edits.topics.filter((item) => !defaultTopics.some((base) => base.id === item.id)),
              hiddenChapters: edits.hiddenChapters.filter((id) => !defaultChapters.some((base) => base.id === id)),
              hiddenTopics: edits.hiddenTopics.filter((id) => !defaultTopics.some((base) => base.id === id)),
            }), "Встроенные материалы восстановлены."));
          }}>Восстановить встроенный каталог</button>
        </div>
      </section>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 font-bold text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-900">{notice}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className={box}>
            <h2 className="text-xl font-black">Главы</h2>
            <ul className="mt-3 space-y-3">{curriculum.chapters.map((item) => (
              <li key={item.id} className={`rounded-xl border p-3 ${item.id === chapter?.id ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}>
                <button type="button" aria-pressed={item.id === chapter?.id} onClick={() => { setChapterId(item.id); setTopicId(""); setEditingWord(null); setEditingTopic(null); }} className="min-h-11 w-full text-left font-bold">{item.title}</button>
                <p className="break-all text-xs text-slate-600">{item.id} · {formatCount(curriculum.topics.filter((topic) => topic.chapterId === item.id).reduce((sum, topic) => sum + topic.words.length, 0), "слово", "слова", "слов")}</p>
                <div className="mt-2 flex gap-2"><button type="button" className={secondary} aria-label={`Изменить главу ${item.title}`} onClick={() => setEditingChapter(item)}>Изменить</button><button type="button" className={secondary} aria-label={`Удалить главу ${item.title}`} onClick={() => {
                  if (confirm(`Скрыть главу «${item.title}» со всеми темами? Её можно восстановить. Прогресс останется.`)) run(() => persist((edits) => ({ ...edits, hiddenChapters: [...new Set([...edits.hiddenChapters, item.id])] }), "Глава скрыта."));
                }}>Удалить</button></div>
              </li>
            ))}</ul>
          </section>
          <form key={editingChapter?.id ?? "new-chapter"} aria-label={editingChapter ? "Редактирование главы" : "Новая глава"} className={`${box} space-y-3`} onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            run(() => {
              const next = parseChapter(Object.fromEntries(new FormData(form)));
              persist((edits) => {
                if (!editingChapter && [...defaultChapters, ...edits.chapters].some((item) => item.id === next.id)) throw new Error("ID главы уже занят, в том числе скрытой главой.");
                return { ...edits, chapters: replace(edits.chapters, next) };
              }, "Глава сохранена.");
              setChapterId(next.id); setEditingChapter(null); form.reset();
            });
          }}>
            <h2 className="text-lg font-black">{editingChapter ? "Редактирование главы" : "Новая глава"}</h2>
            <Field label="ID главы" name="id" required maxLength={64} defaultValue={editingChapter?.id ?? ""} readOnly={Boolean(editingChapter)} placeholder="ocean" />
            <Field label="Название главы" name="title" required maxLength={80} defaultValue={editingChapter?.title ?? ""} />
            <Field label="Описание главы" name="description" maxLength={240} defaultValue={editingChapter?.description ?? ""} />
            <Field label="Цвет главы" name="themeColor" type="color" defaultValue={editingChapter?.themeColor ?? "#7c3aed"} required />
            <button type="submit" className={button}><Plus size={16} aria-hidden="true" /> Сохранить главу</button>
            {editingChapter && <button type="button" className={secondary} onClick={() => setEditingChapter(null)}>Отмена</button>}
          </form>
        </aside>
        <div className="min-w-0 space-y-5">
          <section className={box}>
            <h2 className="text-xl font-black">Темы: {chapter?.title ?? "создай главу"}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">{topics.map((item) => (
              <li key={item.id} className={`rounded-xl border p-3 ${item.id === topic?.id ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}>
                <button type="button" aria-pressed={item.id === topic?.id} onClick={() => { setTopicId(item.id); setEditingWord(null); }} className="min-h-11 w-full text-left font-bold">{item.emoji} {item.title}</button>
                <p className="text-xs text-slate-600">{formatCount(item.words.length, "слово", "слова", "слов")} · {item.words.length >= 4 ? "Готова к уроку" : "Черновик: нужно 4 слова"}</p>
                <div className="mt-2 flex flex-wrap gap-2"><button type="button" className={secondary} aria-label={`Изменить тему ${item.title}`} onClick={() => setEditingTopic(item)}>Изменить</button><button type="button" className={secondary} aria-label={`Удалить тему ${item.title}`} onClick={() => {
                  if (confirm(`Скрыть тему «${item.title}»? Её можно восстановить. Прогресс останется.`)) run(() => persist((edits) => ({ ...edits, hiddenTopics: [...new Set([...edits.hiddenTopics, item.id])] }), "Тема скрыта."));
                }}>Удалить</button></div>
              </li>
            ))}</ul>
          </section>
          <form key={`${editingTopic?.id ?? "new-topic"}:${chapter?.id}`} aria-label={editingTopic ? "Редактирование темы" : "Новая тема"} className={`${box} space-y-4`} onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            run(() => {
              let saved = "", savedChapter = "";
              persist((edits) => {
                const values = Object.fromEntries(new FormData(form));
                const words = editingTopic ? mergeCurriculum(edits).topics.find((topic) => topic.id === editingTopic.id)?.words : [];
                if (editingTopic && !words) throw new Error("Тема больше недоступна.");
                const next = parseTopic({ ...values, words: words ?? [] });
                if (!editingTopic && [...defaultTopics, ...edits.topics].some((item) => item.id === next.id)) throw new Error("ID темы уже занят, в том числе скрытой темой.");
                saved = next.id;
                savedChapter = next.chapterId;
                return { ...edits, topics: replace(edits.topics, next) };
              }, "Тема сохранена. Для урока нужно минимум 4 слова; босс появится при 8 разных словах в главе.");
              setChapterId(savedChapter); setTopicId(saved); setEditingTopic(null); setEditingWord(null); form.reset();
            });
          }}>
            <h2 className="text-lg font-black">{editingTopic ? "Редактирование темы" : "Новая тема"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ID темы" name="id" defaultValue={editingTopic?.id ?? ""} readOnly={Boolean(editingTopic)} required maxLength={64} placeholder="sea-animals" />
              <Field label="Название темы" name="title" defaultValue={editingTopic?.title ?? ""} required maxLength={80} />
              <label className="block text-sm font-bold">Глава темы<select name="chapterId" required defaultValue={editingTopic?.chapterId ?? chapter?.id} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">{curriculum.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}</select></label>
              <Field label="Описание темы" name="description" defaultValue={editingTopic?.description ?? ""} maxLength={240} />
              <Field label="3D-иконка темы" name="icon3d" defaultValue={editingTopic?.icon ?? ""} maxLength={100} placeholder="rocket.webp или пусто" />
              <Field label="Эмодзи темы" name="emoji" defaultValue={editingTopic?.emoji ?? "📚"} required maxLength={24} />
            </div>
            <button type="submit" disabled={!chapter} className={button}>Сохранить тему</button>
            {editingTopic && <button type="button" onClick={() => setEditingTopic(null)} className={`${secondary} ml-2`}>Отмена</button>}
          </form>
          {topic && <>
            <section className={box}>
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Слова: {topic.title} ({topic.words.length})</h2><button type="button" className={secondary} onClick={() => setImporting(true)}><Upload size={16} aria-hidden="true" /> Импорт JSON</button></div>
              <ul className="mt-4 divide-y divide-slate-100">{topic.words.map((word) => (
                <li key={word.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 break-words"><span aria-hidden="true">{word.emoji} </span><span lang="en" className="font-bold">{word.english}</span> — {word.russian}<p lang="en" className="mt-1 text-sm text-slate-500">{word.exampleSentence}</p></div>
                  <div className="flex gap-2"><button type="button" className={secondary} aria-label={`Изменить слово ${word.english}`} onClick={() => setEditingWord({ topicId: topic.id, id: word.id })}>Изменить</button><button type="button" className={secondary} aria-label={`Удалить слово ${word.english}`} onClick={() => {
                    if (confirm(`Удалить слово «${word.english}» из темы?`)) run(() => { changeWords((words) => words.filter((item) => item.id !== word.id), "Слово удалено."); setEditingWord(null); });
                  }}>Удалить</button></div>
                </li>
              ))}</ul>
            </section>
            <WordEditor key={`${topic.id}:${JSON.stringify(wordBeingEdited)}`} word={wordBeingEdited} onCancel={() => setEditingWord(null)} onSave={(word) => {
              changeWords((words) => {
                if (!wordBeingEdited && words.some((item) => item.id === word.id)) throw new Error("ID слова уже есть в теме.");
                return replace(words, word);
              }, "Слово сохранено.");
              setEditingWord(null);
            }} />
            {importing && <JsonBulkImportModal topicTitle={topic.title} onClose={() => setImporting(false)} onImport={(raw) => changeWords((words) => importWords(raw, words), "Слова импортированы.")} />}
          </>}
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  const { storageKey } = useCurriculum();
  return <ParentGate key={storageKey}>{(lock) => <Studio lock={lock} />}</ParentGate>;
}
