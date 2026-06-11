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
import { Button } from "../components/ui/Button";
import type { Question, QuestionType, Survey } from "../types";

type SaveState = "idle" | "saving" | "saved" | "error";

export function BuilderPage() {
  const { id } = useParams({ from: "/builder/$id" });
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Load survey
  useEffect(() => {
    surveysApi.get(id).then((res) => {
      if (res.ok) {
        setSurvey(res.data);
        const sorted = [...res.data.questions].sort((a, b) => a.position - b.position);
        setQuestions(sorted);
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
          title: updatedSurvey.title,
          description: updatedSurvey.description ?? undefined,
          brand_color: updatedSurvey.brand_color,
          logo_url: updatedSurvey.logo_url ?? undefined,
        });
        setSaveState(res.ok ? "saved" : "error");
        if (res.ok) {
          setTimeout(() => setSaveState("idle"), 2000);
        }
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

  const handleAddQuestion = async (type: QuestionType) => {
    const position = questions.length;
    const res = await questionsApi.create(id, {
      type,
      label: "New question",
      position,
      required: 0,
      options: type === "multiple_choice" ? ["Option A", "Option B"] : undefined,
    });
    if (res.ok) {
      setQuestions((prev) => [...prev, res.data]);
    }
  };

  const handleUpdateQuestion = async (qId: string, fields: Partial<Question>) => {
    // Optimistic update
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...fields } : q)));
    // Debounced save — convert null options to undefined for the API type
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(async () => {
      const apiFields = {
        ...fields,
        options: fields.options ?? undefined,
      };
      const res = await questionsApi.update(qId, apiFields);
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

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved ✓"
        : saveState === "error"
          ? "Error saving"
          : "";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="builder-header">
        <div className="flex gap-3" style={{ alignItems: "center" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            id="back-to-dashboard-btn"
          >
            ← Dashboard
          </Button>
          <span
            style={{
              width: 1,
              height: 20,
              background: "var(--border)",
              display: "block",
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
            {survey.title}
          </span>
        </div>

        <div className="flex gap-3" style={{ alignItems: "center" }}>
          {saveState !== "idle" && (
            <span className={`autosave-indicator ${saveState}`}>{saveLabel}</span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/s/${id}`;
              navigator.clipboard.writeText(url);
            }}
            id="builder-share-btn"
          >
            🔗 Share
          </Button>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="builder-layout">
        {/* Left: question editor */}
        <div className="builder-left">
          <BrandPanel
            brandColor={survey.brand_color}
            logoUrl={survey.logo_url ?? ""}
            title={survey.title}
            onColorChange={(c) => updateSurveyField("brand_color", c)}
            onLogoChange={(u) => updateSurveyField("logo_url", u)}
            onTitleChange={(t) => updateSurveyField("title", t)}
          />

          <div
            style={{
              marginTop: 20,
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: 14, color: "var(--text-2)" }}>Questions ({questions.length})</h3>
            <AddQuestionMenu onAdd={handleAddQuestion} />
          </div>

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

          {questions.length === 0 && (
            <div
              style={{
                marginTop: 16,
                border: "2px dashed var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "32px",
                textAlign: "center",
                color: "var(--text-3)",
                fontSize: 14,
              }}
            >
              No questions yet — click "Add Question" above
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className="builder-right">
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text-3)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Live Preview
          </div>
          <SurveyPreview survey={survey} questions={questions} />
        </div>
      </div>
    </div>
  );
}
