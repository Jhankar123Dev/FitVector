"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, GripVertical, X, Plus, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobPostFormData } from "@/types/employer";
import { getStageName } from "@/types/employer";

export const PIPELINE_LOCKED_HEAD = ["applied", "ai_screened"];
export const PIPELINE_LOCKED_TAIL = ["offer", "hired"];
export const PIPELINE_LOCKED_SET = new Set([...PIPELINE_LOCKED_HEAD, ...PIPELINE_LOCKED_TAIL]);

const DEFAULT_MIDDLE_STAGES: string[] = [
  "assessment_pending", "assessment_completed",
  "ai_interview_pending", "ai_interviewed", "human_interview",
];

export const DEFAULT_PIPELINE_STAGES: string[] = [
  ...PIPELINE_LOCKED_HEAD,
  ...DEFAULT_MIDDLE_STAGES,
  ...PIPELINE_LOCKED_TAIL,
];

export const PIPELINE_PRESETS: { value: string; label: string; group: string }[] = [
  { value: "assessment_pending",   label: "Test Pending",        group: "Assessment" },
  { value: "assessment_completed", label: "Test Completed",       group: "Assessment" },
  { value: "ai_interview_pending", label: "AI Interview Pending", group: "AI Interview" },
  { value: "ai_interviewed",       label: "AI Interviewed",       group: "AI Interview" },
  { value: "phone_screen",         label: "Phone Screen",         group: "Human Interview" },
  { value: "human_interview",      label: "Human Interview",      group: "Human Interview" },
  { value: "background_check",     label: "Background Check",     group: "Other" },
  { value: "reference_check",      label: "Reference Check",      group: "Other" },
  { value: "hr_round",             label: "HR Round",             group: "Other" },
];

interface Props {
  form: JobPostFormData;
  update: (updates: Partial<JobPostFormData>) => void;
}

export function Step7Pipeline({ form, update }: Props) {
  const [customStageName, setCustomStageName] = useState("");

  const middleStages = form.pipelineStages.filter((s) => !PIPELINE_LOCKED_SET.has(s));

  function rebuildPipeline(newMiddle: string[]) {
    update({ pipelineStages: [...PIPELINE_LOCKED_HEAD, ...newMiddle, ...PIPELINE_LOCKED_TAIL] });
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(middleStages);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    rebuildPipeline(reordered);
  }

  function addPresetStage(value: string) {
    if (!middleStages.includes(value)) rebuildPipeline([...middleStages, value]);
  }

  function addCustomStage() {
    const trimmed = customStageName.trim();
    if (!trimmed) return;
    rebuildPipeline([...middleStages, trimmed]);
    setCustomStageName("");
  }

  function removeStage(index: number) {
    rebuildPipeline(middleStages.filter((_, i) => i !== index));
  }

  const presetGroups = PIPELINE_PRESETS.reduce<Record<string, typeof PIPELINE_PRESETS>>(
    (acc, p) => {
      if (!acc[p.group]) acc[p.group] = [];
      acc[p.group].push(p);
      return acc;
    },
    {},
  );

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pipeline Configuration</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Design your hiring flow. Drag to reorder stages, click a preset to add, or type a
            custom stage name.
            <span className="ml-1 inline-flex items-center gap-0.5 text-muted-foreground/70">
              <Lock className="h-2.5 w-2.5" /> Locked stages are always included.
            </span>
          </p>
        </div>

        {/* Full pipeline preview */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3">
          {form.pipelineStages.map((stage, i) => (
            <div key={`preview-${stage}-${i}`} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  PIPELINE_LOCKED_SET.has(stage)
                    ? "bg-muted text-muted-foreground"
                    : "border border-brand-200 bg-brand-50 text-brand-700",
                )}
              >
                {getStageName(stage)}
              </span>
              {i < form.pipelineStages.length - 1 && (
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Locked head */}
          <div className="flex flex-wrap items-center gap-2">
            {PIPELINE_LOCKED_HEAD.map((stage) => (
              <span
                key={stage}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <Lock className="h-3 w-3 shrink-0" />
                {getStageName(stage)}
              </span>
            ))}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          </div>

          {/* DnD zone */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="pipeline-middle" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex min-h-[52px] flex-wrap items-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors",
                    snapshot.isDraggingOver
                      ? "border-brand-400 bg-brand-50/40"
                      : "border-border bg-muted/30",
                  )}
                >
                  {middleStages.length === 0 && !snapshot.isDraggingOver && (
                    <p className="text-xs italic text-muted-foreground/70">
                      No stages added — pick a preset below or type a custom name
                    </p>
                  )}
                  {middleStages.map((stage, index) => (
                    <Draggable key={`${stage}-${index}`} draggableId={`stage-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex select-none items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 shadow-sm",
                            snapshot.isDragging
                              ? "border-brand-400 shadow-md ring-1 ring-brand-300"
                              : "border-border",
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-medium text-foreground/80">
                            {getStageName(stage)}
                          </span>
                          <button
                            onClick={() => removeStage(index)}
                            className="text-muted-foreground/40 transition-colors hover:text-red-500"
                            aria-label={`Remove ${getStageName(stage)}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Locked tail */}
          <div className="flex flex-wrap items-center gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
            {PIPELINE_LOCKED_TAIL.map((stage) => (
              <span
                key={stage}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <Lock className="h-3 w-3 shrink-0" />
                {getStageName(stage)}
              </span>
            ))}
          </div>

          {/* Add stages */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground">Add Stages</p>
            <div className="space-y-2">
              {Object.entries(presetGroups).map(([group, presets]) => (
                <div key={group} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-24 shrink-0 text-[10px] font-medium text-muted-foreground/70">
                    {group}
                  </span>
                  {presets.map((preset) => {
                    const isAdded = middleStages.includes(preset.value);
                    return (
                      <button
                        key={preset.value}
                        onClick={() => !isAdded && addPresetStage(preset.value)}
                        disabled={isAdded}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          isAdded
                            ? "cursor-default border-border bg-muted text-muted-foreground/70"
                            : "cursor-pointer border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
                        )}
                      >
                        {isAdded ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Custom stage name (e.g. Director Review)…"
                value={customStageName}
                onChange={(e) => setCustomStageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addCustomStage(); }
                }}
                className="h-8 max-w-72 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addCustomStage}
                disabled={!customStageName.trim()}
                className="h-8 shrink-0 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" /> Add Custom
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
