import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { questionsApi, surveysApi } from "../api";
import { AddQuestionMenu } from "../components/builder/AddQuestionMenu";
import { BrandPanel } from "../components/builder/BrandPanel";
import { QuestionCard } from "../components/builder/QuestionCard";
import { SurveyPreview } from "../components/builder/SurveyPreview";
import { Button } from "../components/ui/Button";
import type { Question, QuestionType, Survey } from "../types";

type SaveState = "idle" | "saving" | "saved" | "error";

/** Default options for question types that need them */
const DEFAULT_OPTIONS: Partial<Record<QuestionType, string[]>> = {
  multiple_choice: ["Option A", "Option B", "Option C"],
  dropdown:        ["Option 1", "Option 2", "Option 3"],
  checkbox:        ["Choice 1", "Choice 2", "Choice 3"],
  yes_no:          [],   // handled by the component itself
};

/** Default labels per type */
const DEFAULT_LABELS: Partial<Record<QuestionType, string>> = {
  short_text:      "Your name",
  long_text:       "Any additional feedback?",
  email:           "Your email address",
  phone:           "Your phone number",
  multiple_choice: "Choose one option",
  checkbox:        "Select all that apply",
  dropdown:        "Select from the list",
  rating:          "How would you rate your experience?",
  yes_no:          "Would you recommend us to a friend?",
  nps:             "How likely are you to recommend us? (0–10)",
  scale:           "On a scale of 1–10, how satisfied are you?",
  date:            "Select a date",
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Load survey
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

  // Auto-save survey fields (debounced 500ms)
  const scheduleSave = useCallback(
    (updatedSurvey: Survey) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveState("saving");
      debounceRef.current = setTimeout(async () => {
        const res = await surveysApi.update(id, {
          title:       updatedSurvey.title,
          description: updatedSurvey.description ?? undefined,
          brand_color: updatedSurvey.brand_color,
          logo_url:    updatedSurvey.logo_url ?? undefined,
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

  // Manual save button
  const handleManualSave = async () => {
    if (!survey) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    const res = await surveysApi.update(id, {
      title:       survey.title,
      description: survey.description ?? undefined,
      brand_color: survey.brand_color,
      logo_url:    survey.logo_url ?? undefined,
    });
    setSaveState(res.ok ? "saved" : "error");
    if (res.ok) {
      showToast("✓ Survey saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      showToast("⚠ Save failed — check connection");
    }
  };

  // Duplicate survey
  const handleDuplicate = async () => {
    if (!survey || duplicating) return;
    setDuplicating(true);
    const copy = await surveysApi.create({ title: `${survey.title} (Copy)` });
    if (!copy.ok) { showToast("⚠ Could not duplicate"); setDuplicating(false); return; }

    const newId = copy.data.id;
    // Copy branding
    await surveysApi.update(newId, {
      description: survey.description ?? undefined,
      brand_color: survey.brand_color,
      logo_url:    survey.logo_url ?? undefined,
    });
    // Copy all questions in order
    for (const q of questions) {
      await questionsApi.create(newId, {
        type:     q.type,
        label:    q.label,
        options:  q.options ?? undefined,
        position: q.position,
        required: q.required,
      });
    }
    setDuplicating(false);
    showToast("✓ Duplicate created — opening it…");
    setTimeout(() => navigate({ to: `/builder/${newId}` }), 1200);
  };

  // Share
  const handleShare = () => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url).then(() => showToast("🔗 Link copied to clipboard!"));
  };

  const handleAddQuestion = async (type: QuestionType) => {
    const position = questions.length;
    const res = await questionsApi.create(id, {
      type,
      label:    DEFAULT_LABELS[type] ?? "New question",
      position,
      required: 0,
      options:  DEFAULT_OPTIONS[type],
    });
    if (res.ok) setQuestions((prev) => [...prev, res.data]);
  };

  const handleUpdateQuestion = async (qId: string, fields: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...fields } : q)));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(async () => {
      const res = await questionsApi.update(qId, { ...fields, options: fields.options ?? undefined });
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
    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({ ...q, position: i }));
    setQuestions(reordered);
    await questionsApi.reorder(id, reordered.map((q) => q.id));
  };

  if (loading || !survey) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  const saveLabel =
    saveState === "saving" ? "Saving…" :
    saveState === "saved"  ? "Saved ✓" :
    saveState === "error"  ? "Error" : "";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toast notification */}
      {toast && (
        <div className="builder-toast" role="status" aria-live="polite">{toast}</div>
      )}

      {/* Header */}
      <header className="builder-header">
        <div className="flex gap-3" style={{ alignItems: "center", minWidth: 0, flex: 1 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })} id="back-to-dashboard-btn">
            ← Back
          </Button>
          <span style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {survey.title}
          </span>
          {saveState !== "idle" && (
            <span className={`autosave-indicator ${saveState}`}>{saveLabel}</span>
          )}
        </div>

        <div className="builder-header-actions">
          {/* Manual save */}
          <button
            type="button"
            className="builder-action-btn"
            onClick={handleManualSave}
            disabled={saveState === "saving"}
            id="builder-save-btn"
            title="Save survey"
          >
            {saveState === "saving" ? (
              <span className="btn-spinner" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: "currentColor" }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            )}
            Save
          </button>

          {/* Duplicate */}
          <button
            type="button"
            className="builder-action-btn"
            onClick={handleDuplicate}
            disabled={duplicating}
            id="builder-duplicate-btn"
            title="Make a copy of this survey"
          >
            {duplicating ? (
              <span className="btn-spinner" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: "currentColor" }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            )}
            Duplicate
          </button>

          {/* Share */}
          <button
            type="button"
            className="builder-action-btn builder-action-share"
            onClick={handleShare}
            id="builder-share-btn"
            title="Copy public survey link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="1.8"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            Share
          </button>

          {/* Open live */}
          <a
            href={`/s/${id}`}
            target="_blank"
            rel="noreferrer"
            className="builder-action-btn builder-action-live"
            id="builder-open-live-btn"
            title="Open public survey in new tab"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Open Live
          </a>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="builder-layout" style={{ flex: 1, overflow: "hidden" }}>
        {/* Left: question editor */}
        <div className="builder-left" style={{ overflowY: "auto" }}>
          <BrandPanel
            brandColor={survey.brand_color}
            logoUrl={survey.logo_url ?? ""}
            title={survey.title}
            onColorChange={(c) => updateSurveyField("brand_color", c)}
            onLogoChange={(u) => updateSurveyField("logo_url", u)}
            onTitleChange={(t) => updateSurveyField("title", t)}
          />

          <div style={{ marginTop: 20, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Questions ({questions.length})
            </h3>
            <AddQuestionMenu onAdd={handleAddQuestion} />
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {questions.map((q) => (
                  <QuestionCard key={q.id} question={q} onUpdate={handleUpdateQuestion} onDelete={handleDeleteQuestion} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {questions.length === 0 && (
            <div className="builder-empty-state">
              <span style={{ fontSize: 32 }}>🧩</span>
              <p>No questions yet</p>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>Click "Add Question" above to get started</p>
            </div>
          )}
        </div>

        {/* Right: interactive live preview */}
        <div className="builder-right" style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div className="builder-preview-label">
            <span>Live Preview</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400 }}>Interactive — try it!</span>
          </div>
          <div style={{ flex: 1 }}>
            <SurveyPreview survey={survey} questions={questions} />
          </div>
        </div>
      </div>
    </div>
  );
}
