"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type Announcements,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type SubmitHandler,
} from "react-hook-form";
import {
  createRecipe,
  updateRecipe,
} from "@/features/recipes/actions";
import {
  mealTypeOptions,
  recipeCategoryOptions,
  recipeFormSchema,
  recipeGenreOptions,
  recipeUpdateSchema,
} from "@/features/recipes/schema";
import {
  categoryLabel,
  genreLabel,
  mealTypeLabel,
} from "@/features/recipes/view-labels";

type RecipeFormValues = {
  id?: string;
  updatedAt?: string;
  title: string;
  emoji: string;
  imageUrl: string;
  imageAlt: string;
  category: (typeof recipeCategoryOptions)[number];
  genres: (typeof recipeGenreOptions)[number][];
  mealTypes: (typeof mealTypeOptions)[number][];
  difficulty: number;
  servings: number | null;
  referenceUrl: string;
  memoMarkdown: string;
  savedAt: string;
  isFavorite: boolean;
  steps: { content: string }[];
};

type RecipeFormProps = {
  mode: "create" | "edit";
  defaultValues: RecipeFormValues;
};

type ConflictDetails = {
  latest?: {
    title?: string | null;
    updatedAt?: string | null;
  } | null;
};

const stepAnnouncements: Announcements = {
  onDragStart({ active }) {
    return `${active.data.current?.sortable?.index + 1}番目の手順を選択しました。上下キーで移動し、スペースキーで確定します。`;
  },
  onDragOver({ active, over }) {
    if (!over) {
      return;
    }

    return `${active.data.current?.sortable?.index + 1}番目の手順を${over.data.current?.sortable?.index + 1}番目へ移動中です。`;
  },
  onDragEnd({ active, over }) {
    if (!over) {
      return "手順の並べ替えを終了しました。";
    }

    return `${active.data.current?.sortable?.index + 1}番目の手順を${over.data.current?.sortable?.index + 1}番目へ移動しました。`;
  },
  onDragCancel() {
    return "手順の並べ替えをキャンセルしました。";
  },
};

function fieldError(errors: FieldErrors<RecipeFormValues>, name: keyof RecipeFormValues) {
  const error = errors[name];
  return typeof error?.message === "string" ? error.message : null;
}

function toConflictDetails(details: unknown): ConflictDetails {
  if (!details || typeof details !== "object") {
    return {};
  }

  const latest = "latest" in details ? details.latest : null;
  if (!latest || typeof latest !== "object") {
    return {};
  }

  return {
    latest: {
      title: "title" in latest && typeof latest.title === "string" ? latest.title : null,
      updatedAt:
        "updatedAt" in latest && typeof latest.updatedAt === "string"
          ? latest.updatedAt
          : null,
    },
  };
}

function formatUpdatedAt(value?: string | null) {
  if (!value) {
    return "更新日時不明";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function SortableStep({
  fieldId,
  index,
  register,
  error,
  onRemove,
}: {
  fieldId: string;
  index: number;
  register: ReturnType<typeof useForm<RecipeFormValues>>["register"];
  error?: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: fieldId });

  return (
    <li
      ref={setNodeRef}
      className={`sortable-step${isDragging ? " is-dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        className="drag-handle"
        aria-label={`手順${index + 1}を並べ替え`}
        {...attributes}
        {...listeners}
      >
        ↕
      </button>
      <div className="step-input">
        <label htmlFor={`step-${fieldId}`}>手順 {index + 1}</label>
        <textarea
          id={`step-${fieldId}`}
          rows={3}
          {...register(`steps.${index}.content` as const)}
        />
        {error ? <p className="field-error">{error}</p> : null}
      </div>
      <button type="button" className="secondary-button" onClick={onRemove}>
        削除
      </button>
    </li>
  );
}

export function RecipeForm({ mode, defaultValues }: RecipeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [conflictDetails, setConflictDetails] = useState<ConflictDetails | null>(null);
  const isEdit = mode === "edit";

  const resolver = useMemo(
    () => zodResolver(isEdit ? recipeUpdateSchema : recipeFormSchema) as never,
    [isEdit],
  );

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<RecipeFormValues>({
    resolver,
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const stepIds = fields.map((field) => field.id);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    move(oldIndex, newIndex);
  };

  const onSubmit: SubmitHandler<RecipeFormValues> = (values) => {
    setFormMessage(null);
    setConflictDetails(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateRecipe(values as RecipeFormValues & { id: string; updatedAt: string })
        : await createRecipe(values);

      if (!result.ok) {
        setFormMessage(result.error.message);
        if (result.error.code === "CONFLICT") {
          setConflictDetails(toConflictDetails(result.error.details));
        }
        return;
      }

      reset(values);
      router.push(`/recipes/${result.data.id}`);
      router.refresh();
    });
  };

  return (
    <form className="recipe-form" onSubmit={handleSubmit(onSubmit)}>
      {defaultValues.id ? <input type="hidden" {...register("id")} /> : null}
      {defaultValues.updatedAt ? <input type="hidden" {...register("updatedAt")} /> : null}

      <section className="form-section">
        <h2>基本情報</h2>
        <div className="form-grid">
          <label className="field span-2">
            <span>レシピ名</span>
            <input {...register("title")} maxLength={80} />
            {fieldError(errors, "title") ? (
              <p className="field-error">{fieldError(errors, "title")}</p>
            ) : null}
          </label>

          <label className="field">
            <span>アイコン</span>
            <input {...register("emoji")} maxLength={8} />
          </label>

          <label className="field">
            <span>カテゴリー</span>
            <select {...register("category")}>
              {recipeCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
            {fieldError(errors, "category") ? (
              <p className="field-error">{fieldError(errors, "category")}</p>
            ) : null}
          </label>

          <label className="field">
            <span>難易度</span>
            <input type="number" min={1} max={5} {...register("difficulty")} />
            {fieldError(errors, "difficulty") ? (
              <p className="field-error">{fieldError(errors, "difficulty")}</p>
            ) : null}
          </label>

          <label className="field">
            <span>人数</span>
            <input type="number" min={1} max={20} {...register("servings")} />
            {fieldError(errors, "servings") ? (
              <p className="field-error">{fieldError(errors, "servings")}</p>
            ) : null}
          </label>

          <label className="field">
            <span>保存日</span>
            <input type="date" {...register("savedAt")} />
            {fieldError(errors, "savedAt") ? (
              <p className="field-error">{fieldError(errors, "savedAt")}</p>
            ) : null}
          </label>

          <label className="check-field">
            <input type="checkbox" {...register("isFavorite")} />
            <span>お気に入り</span>
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>分類</h2>
        <div className="option-group" aria-label="ジャンル">
          {recipeGenreOptions.map((genre) => (
            <label key={genre} className="check-chip">
              <input
                type="checkbox"
                value={genre}
                {...register("genres")}
              />
              <span>{genreLabel(genre)}</span>
            </label>
          ))}
        </div>
        <div className="option-group" aria-label="食事タイプ">
          {mealTypeOptions.map((mealType) => (
            <label key={mealType} className="check-chip">
              <input
                type="checkbox"
                value={mealType}
                {...register("mealTypes")}
              />
              <span>{mealTypeLabel(mealType)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>写真・参考URL</h2>
        <div className="form-grid">
          <label className="field span-2">
            <span>料理写真 URL</span>
            <input type="url" {...register("imageUrl")} />
            {fieldError(errors, "imageUrl") ? (
              <p className="field-error">{fieldError(errors, "imageUrl")}</p>
            ) : null}
          </label>
          <label className="field span-2">
            <span>写真の説明</span>
            <input {...register("imageAlt")} maxLength={80} />
          </label>
          <label className="field span-2">
            <span>参考 URL</span>
            <input type="url" {...register("referenceUrl")} />
            {fieldError(errors, "referenceUrl") ? (
              <p className="field-error">{fieldError(errors, "referenceUrl")}</p>
            ) : null}
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading compact-heading">
          <h2>作り方</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={() => append({ content: "" })}
          >
            手順を追加
          </button>
        </div>
        <DndContext
          accessibility={{ announcements: stepAnnouncements }}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            <ol className="sortable-step-list">
              {fields.map((field, index) => (
                <SortableStep
                  key={field.id}
                  fieldId={field.id}
                  index={index}
                  register={register}
                  error={errors.steps?.[index]?.content?.message}
                  onRemove={() => remove(index)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </section>

      <section className="form-section">
        <h2>メモ</h2>
        <label className="field">
          <span>Markdown メモ</span>
          <textarea rows={8} {...register("memoMarkdown")} />
          {fieldError(errors, "memoMarkdown") ? (
            <p className="field-error">{fieldError(errors, "memoMarkdown")}</p>
          ) : null}
        </label>
      </section>

      {formMessage ? <p className="form-message">{formMessage}</p> : null}

      {conflictDetails ? (
        <div className="conflict-dialog" role="alertdialog" aria-labelledby="conflict-title">
          <h2 id="conflict-title">最新の内容があります</h2>
          <p>別タブなどで保存された内容があります。ページを再読み込みして最新内容を確認してください。</p>
          {conflictDetails.latest ? (
            <dl className="conflict-summary">
              <div>
                <dt>最新のタイトル</dt>
                <dd>{conflictDetails.latest.title || "タイトル未取得"}</dd>
              </div>
              <div>
                <dt>最新の更新日時</dt>
                <dd>{formatUpdatedAt(conflictDetails.latest.updatedAt)}</dd>
              </div>
            </dl>
          ) : null}
          <button type="button" className="secondary-button" onClick={() => router.refresh()}>
            最新内容を読み込む
          </button>
        </div>
      ) : null}

      <div className="form-actions">
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
