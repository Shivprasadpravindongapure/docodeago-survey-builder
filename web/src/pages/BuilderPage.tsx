import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { questionsApi, surveysApi } from "../api";
import { AddQuestionMenu } from "../components/builder/AddQuestionMenu";
import { BrandPanel } from "../components/builder/BrandPanel";
import { QuestionCard } from "../components/builder/QuestionCard";
import { SurveyPreview } from "../components/builder/SurveyPreview";
import type { Question, QuestionType, Survey } from "../types";

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT_OPTIONS: Partial<Record<QuestionType, string[]>> = {
  multiple_choice: ["Option A", "Option B", "Option C"],
  dropdown: ["Option 1", "Option 2", "Option 3"],
  checkbox: ["Choice 1", "Choice 2", "Choice 3"],
};

const DEFAULT_LABELS: Partial<Record<QuestionType, string>> = {
  short_text: "Your name",
  long_text: "Any additional comments?",
  email: "Your email address",
  phone: "Your phone number",
  multiple_choice: "Choose one option",
  checkbox: "Select all that apply",
  dropdown: "Select from the list",
  rating: "How would you rate your experience?",
  yes_no: "Would you recommend us to a friend?",
  nps: "How likely are you to recommend us? (0–10)",
  scale: "On a scale of 1–10, how satisfied are you?",
  date: "Select a date",
};

export function BuilderPage() {
  const { id } = useParams({ from: "/builder/$id" });
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    surveysApi.get(id).then((res) => {
      if (res.ok) {
        setSurvey(res.data);
        setQuestions([...res.data.questions].sort((a, b) => a.position - b.position));
      } else {
        navigate({ to: "/dashboard" });
      }
      setLoading(false);
    });
  }, [id, navigate]);

  const scheduleSave = useCallback(
    (updatedSurvey: Survey) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveState("saving");
      debounceRef.current = setTimeout(async () => {
        const res = await surveysApi.update(id, {
          title: updatedSurvey.title,
          description: updatedSurvey.description ?? undefined,
          brand_color: updatedSurvey.brand_color,
          logo_url: updatedSurvey.logo_url ?? undefined,
        });
        setSaveState(res.ok ? "saved" : "error");
        if (res.ok) setTimeout(() => setSaveState("idle"), 2000);
      }, 500);
    },
    [id],
  );

  const updateSurveyField = <K extends keyof Survey>(key: K, value: Survey[K]) => {
    if (!survey) return;
    const updated = { ...survey, [key]: value };
    setSurvey(updated);
    scheduleSave(updated);
  };

  const handleManualSave = async () => {
    if (!survey) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    const res = await surveysApi.update(id, {
      title: survey.title,
      description: survey.description ?? undefined,
      brand_color: survey.brand_color,
      logo_url: survey.logo_url ?? undefined,
    });
    setSaveState(res.ok ? "saved" : "error");
    if (res.ok) {
      showToast("✅ Survey saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      showToast("⚠️ Save failed — check connection");
    }
  };

  const handleDuplicate = async () => {
    if (!survey || duplicating) return;
    setDuplicating(true);
    const copy = await surveysApi.create({ title: `${survey.title} (Copy)` });
    if (!copy.ok) {
      showToast("⚠️ Could not duplicate");
      setDuplicating(false);
      return;
    }
    const newId = copy.data.id;
    await surveysApi.update(newId, {
      description: survey.description ?? undefined,
      brand_color: survey.brand_color,
      logo_url: survey.logo_url ?? undefined,
    });
    for (const q of questions) {
      await questionsApi.create(newId, {
        type: q.type,
        label: q.label,
        options: q.options ?? undefined,
        position: q.position,
        required: q.required,
      });
    }
    setDuplicating(false);
    showToast("✅ Duplicate created — opening…");
    setTimeout(() => navigate({ to: `/builder/${newId}` }), 1200);
  };

  const handleAddQuestion = async (type: QuestionType) => {
    const position = questions.length;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Question = {
      id: tempId,
      survey_id: id,
      type,
      label: DEFAULT_LABELS[type] ?? "New question",
      position,
      required: 0,
      options: DEFAULT_OPTIONS[type] ?? null,
      created_at: new Date().toISOString(),
    };
    // Add immediately so UI doesn't feel slow
    setQuestions((prev) => [...prev, optimistic]);
    const res = await questionsApi.create(id, {
      type,
      label: optimistic.label,
      position,
      required: 0,
      options: DEFAULT_OPTIONS[type],
    });
    if (res.ok) {
      // Replace temp with real server question (has real ID)
      setQuestions((prev) => prev.map((q) => (q.id === tempId ? res.data : q)));
    } else {
      showToast(`⚠️ Could not save "${optimistic.label}" — ${res.error ?? "API error"}`);
      // Remove optimistic entry on failure
      setQuestions((prev) => prev.filter((q) => q.id !== tempId));
    }
  };

  const handleUpdateQuestion = async (qId: string, fields: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...fields } : q)));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(async () => {
      const res = await questionsApi.update(qId, {
        ...fields,
        options: fields.options ?? undefined,
      });
      setSaveState(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setSaveState("idle"), 2000);
    }, 500);
  };

  const handleDeleteQuestion = async (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
    await questionsApi.delete(qId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
      ...q,
      position: i,
    }));
    setQuestions(reordered);
    await questionsApi.reorder(
      id,
      reordered.map((q) => q.id),
    );
  };

  if (loading || !survey) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  const saveBadge =
    saveState === "saving" ? (
      <span className="autosave-indicator saving">Saving…</span>
    ) : saveState === "saved" ? (
      <span className="autosave-indicator saved">✓ Saved</span>
    ) : saveState === "error" ? (
      <span className="autosave-indicator error">⚠ Error</span>
    ) : null;

  return (
    <div className="builder-wrapper">
      {/* Toast */}
      {toast && (
        <output className="builder-toast" aria-live="polite">
          {toast}
        </output>
      )}

      {/* ── Header ── */}
      <header className="builder-header">
        <div className="builder-header-left">
          <button
            type="button"
            className="builder-action-btn btn-sm"
            onClick={() => navigate({ to: "/dashboard" })}
            id="back-to-dashboard-btn"
            title="Back to dashboard"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 22, background: "var(--border)", flexShrink: 0 }} />
          <span className="builder-survey-title">{survey.title}</span>
          {saveBadge}
        </div>

        <div className="builder-header-actions">
          <button
            type="button"
            className={`builder-action-btn ${showPreview ? "builder-action-preview-on" : ""}`}
            onClick={() => setShowPreview((v) => !v)}
            id="builder-preview-btn"
            title="Toggle live preview"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>{showPreview ? "Hide Preview" : "Preview"}</span>
          </button>
          <button
            type="button"
            className="builder-action-btn"
            onClick={handleManualSave}
            disabled={saveState === "saving"}
            id="builder-save-btn"
            title="Save"
          >
            {saveState === "saving" ? (
              <span
                className="btn-spinner"
                style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: "currentColor" }}
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <polyline
                  points="17 21 17 13 7 13 7 21"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <polyline
                  points="7 3 7 8 15 8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span>Save</span>
          </button>

          <button
            type="button"
            className="builder-action-btn"
            onClick={handleDuplicate}
            disabled={duplicating}
            id="builder-duplicate-btn"
            title="Duplicate"
          >
            {duplicating ? (
              <span
                className="btn-spinner"
                style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: "currentColor" }}
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span>Duplicate</span>
          </button>

          {/* ── Share dropdown ── */}
          <div className="builder-share-wrap" id="builder-share-wrap">
            <button
              type="button"
              className="builder-action-btn builder-action-share"
              onClick={() => setShowShareMenu((v) => !v)}
              id="builder-share-btn"
              title="Share survey"
              aria-expanded={showShareMenu}
              aria-haspopup="menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
                <line
                  x1="8.59"
                  y1="13.51"
                  x2="15.42"
                  y2="17.49"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <line
                  x1="15.41"
                  y1="6.51"
                  x2="8.59"
                  y2="10.49"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
              <span>Share ▾</span>
            </button>
            {showShareMenu && (
              // biome-ignore lint/a11y/useKeyWithClickEvents: share menu closes on item click
              <div
                className="builder-share-dropdown"
                role="menu"
                onClick={() => setShowShareMenu(false)}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="share-menu-item"
                  onClick={() => {
                    const url = `${window.location.origin}/s/${id}`;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => showToast("🔗 Link copied to clipboard!"));
                  }}
                  id="share-copy-link-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  Copy survey link
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Fill out this survey: ${window.location.origin}/s/${id}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  className="share-menu-item share-menu-wa"
                  id="share-whatsapp-btn"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Share on WhatsApp
                </a>
              </div>
            )}
          </div>

          <a
            href={`/s/${id}`}
            target="_blank"
            rel="noreferrer"
            className="builder-action-live"
            id="builder-open-live-btn"
            title="Open live survey"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <polyline
                points="15 3 21 3 21 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="10"
                y1="14"
                x2="21"
                y2="3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Open Live
          </a>
        </div>
      </header>

      {/* ── Body: Left sidebar | Questions col | Preview col ── */}
      <div className="builder-body">
        {/* Left: Brand panel */}
        <aside className="builder-left">
          <BrandPanel
            brandColor={survey.brand_color}
            logoUrl={survey.logo_url ?? ""}
            title={survey.title}
            description={survey.description ?? ""}
            onColorChange={(c) => updateSurveyField("brand_color", c)}
            onLogoChange={(u) => updateSurveyField("logo_url", u)}
            onTitleChange={(t) => updateSurveyField("title", t)}
            onDescChange={(d) => updateSurveyField("description", d)}
          />
        </aside>

        {/* Right: questions + preview */}
        <div
          className="builder-right"
          style={{ gridTemplateColumns: showPreview ? undefined : "1fr" }}
        >
          {/* Questions column */}
          <main className="builder-questions-col">
            <div className="questions-header">
              <span className="questions-label">Questions ({questions.length})</span>
              <AddQuestionMenu onAdd={handleAddQuestion} />
            </div>

            {questions.length === 0 ? (
              <div className="builder-empty-state">
                <span>🧩</span>
                <p>No questions yet</p>
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>
                  Click <strong>+ Add Question</strong> to get started
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {questions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        onUpdate={handleUpdateQuestion}
                        onDelete={handleDeleteQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </main>

          {/* Preview column — only shown when toggled */}
          {showPreview && (
            <aside className="builder-preview-col">
              <div className="builder-preview-label">
                <span>Live Preview</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>Interactive — try it!</span>
              </div>
              <SurveyPreview survey={survey} questions={questions} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
