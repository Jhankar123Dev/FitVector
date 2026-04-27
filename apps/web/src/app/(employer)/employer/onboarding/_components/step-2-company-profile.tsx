"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Sparkles, Plus, X } from "lucide-react";
import type { OnboardingData } from "@/types/employer";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  keywordInput: string;
  setKeywordInput: (v: string) => void;
  locationInput: string;
  setLocationInput: (v: string) => void;
  addKeyword: () => void;
  removeKeyword: (kw: string) => void;
  addLocation: () => void;
  removeLocation: (loc: string) => void;
  aiLoading: boolean;
  onAiAssist: () => void;
}

export function Step2CompanyProfile({
  data,
  updateData,
  keywordInput,
  setKeywordInput,
  locationInput,
  setLocationInput,
  addKeyword,
  removeKeyword,
  addLocation,
  removeLocation,
  aiLoading,
  onAiAssist,
}: Props) {
  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent-50 p-2">
            <Globe className="h-5 w-5 text-accent-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Company Profile</h2>
            <p className="text-sm text-muted-foreground">
              Help candidates understand your company and culture
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Company Description *</Label>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-brand-600 hover:text-brand-700"
              onClick={onAiAssist}
              disabled={aiLoading || !data.websiteUrl}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading ? "Generating..." : "AI Assist"}
            </Button>
          </div>
          <Textarea
            id="description"
            placeholder="Tell candidates what makes your company special..."
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            className="min-h-[120px]"
          />
          {!data.websiteUrl && (
            <p className="text-xs text-muted-foreground/70">
              Add your website URL in the previous step to enable AI Assist
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Culture Keywords</Label>
          <p className="text-xs text-muted-foreground/70">
            Keywords that define your company culture (used by AI for cultural fit evaluation)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Remote-first, Ownership"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addKeyword}
              disabled={!keywordInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {data.cultureKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {data.cultureKeywords.map((kw) => (
                <Badge key={kw} variant="brand" className="gap-1 pr-1.5">
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Office Locations</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Bangalore, India"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLocation();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addLocation}
              disabled={!locationInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {data.locations.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {data.locations.map((loc) => (
                <Badge key={loc} variant="secondary" className="gap-1 pr-1.5">
                  {loc}
                  <button
                    onClick={() => removeLocation(loc)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
