"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, SkipForward } from "lucide-react";

interface Props {
  submitError: string | null;
  isPending: boolean;
  onComplete: () => void;
}

export function Step4FirstJob({ submitError, isPending, onComplete }: Props) {
  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-50 p-2">
            <Briefcase className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-800">Post Your First Job</h2>
            <p className="text-sm text-surface-500">Create your first job post or skip for now</p>
          </div>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {isPending ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-sm font-medium text-surface-600">Setting up your company...</p>
            <p className="mt-1 text-xs text-surface-400">
              Creating company profile and sending invites
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={onComplete}
              className="group rounded-xl border-2 border-surface-200 p-6 text-left transition-all hover:border-brand-500 hover:shadow-card-hover"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-brand-100">
                <Briefcase className="h-6 w-6 text-brand-500" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800">Create a Job Post</h3>
              <p className="mt-1 text-xs text-surface-500">
                Set up your first job listing and start receiving applicants with AI-powered
                screening
              </p>
            </button>

            <button
              onClick={onComplete}
              className="group rounded-xl border-2 border-dashed border-surface-200 p-6 text-left transition-all hover:border-surface-300"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 transition-colors group-hover:bg-surface-200">
                <SkipForward className="h-6 w-6 text-surface-500" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800">Skip for Now</h3>
              <p className="mt-1 text-xs text-surface-500">
                Explore the dashboard first. You can create a job post anytime from the Jobs page.
              </p>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
