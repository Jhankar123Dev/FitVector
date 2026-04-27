"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Eye,
  Users,
  TrendingUp,
  FileText,
  Upload,
  X,
  Plus,
  Save,
  Lightbulb,
  Target,
  EyeIcon,
  ArrowUpRight,
  Building2,
  MapPin,
  Briefcase,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployer, useBranding, useUpdateBranding } from "@/hooks/use-employer";
import { useEmployerJobs } from "@/hooks/use-employer-jobs";
import type { CompanyBranding, CultureValue, DayInTheLife } from "@/types/employer";

const ICON_MAP: Record<string, typeof Lightbulb> = {
  lightbulb: Lightbulb,
  target: Target,
  eye: EyeIcon,
  "trending-up": TrendingUp,
};

const DEFAULT_BRANDING: CompanyBranding = {
  bannerUrl: null,
  story: "",
  teamPhotos: [],
  benefits: [],
  cultureValues: [],
  dayInTheLife: [],
  profileViews: 0,
  followers: 0,
  applicationRate: 0,
};

export default function BrandingPage() {
  const { data: employerData } = useEmployer();
  const { data: jobsData } = useEmployerJobs("active");
  const { data: brandingRes } = useBranding();
  const { mutate: saveBranding, isPending: saving } = useUpdateBranding();

  const company = employerData?.data?.company;
  const activeJobs = jobsData?.data ?? [];

  const [branding, setBranding] = useState<CompanyBranding>(DEFAULT_BRANDING);
  const [bannerName, setBannerName] = useState<string | null>(null);
  const [newBenefit, setNewBenefit] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local form state from server once data loads
  useEffect(() => {
    if (brandingRes?.data) {
      setBranding(brandingRes.data);
    }
  }, [brandingRes?.data]);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerName(file.name);
    }
    e.target.value = "";
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setBranding((prev) => ({ ...prev, benefits: [...prev.benefits, newBenefit.trim()] }));
    setNewBenefit("");
  };

  const removeBenefit = (index: number) => {
    setBranding((prev) => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }));
  };

  const updateCultureValue = (index: number, field: keyof CultureValue, value: string) => {
    setBranding((prev) => ({
      ...prev,
      cultureValues: prev.cultureValues.map((v, i) =>
        i === index ? { ...v, [field]: value } : v,
      ),
    }));
  };

  const updateDayInTheLife = (index: number, description: string) => {
    setBranding((prev) => ({
      ...prev,
      dayInTheLife: prev.dayInTheLife.map((d, i) =>
        i === index ? { ...d, description } : d,
      ),
    }));
  };

  const handleSave = () => {
    saveBranding(branding);
  };

  // Derive location string from first location (CompanyLocation is { city, state?, country })
  const firstLocation = company?.locations?.[0] as
    | { city?: string; state?: string; country?: string }
    | undefined;
  const locationStr = firstLocation?.city ?? firstLocation?.country ?? "";

  // Jobs that don't yet have a "day in the life" entry
  const availableForDitl = activeJobs.filter(
    (jp) => !branding.dayInTheLife.some((d) => d.jobPostId === jp.id),
  );

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Company Branding</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Build your employer brand to attract top talent
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Profile Views", value: branding.profileViews.toLocaleString(), icon: Eye, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Followers", value: String(branding.followers), icon: Users, bg: "bg-purple-50", color: "text-purple-600" },
          { label: "Application Rate", value: `${branding.applicationRate}%`, icon: TrendingUp, bg: "bg-green-50", color: "text-green-600" },
          { label: "Day in the Life", value: String(branding.dayInTheLife.length), icon: FileText, bg: "bg-amber-50", color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Edit / Preview */}
      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* ── Edit Tab ── */}
        <TabsContent value="edit" className="space-y-5">
          {/* Banner */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Banner Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="relative flex h-32 items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 sm:h-44"
              >
                {bannerName ? (
                  <div className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm">
                    <Image className="h-4 w-4 text-brand-600" />
                    <span className="text-foreground/80">{bannerName}</span>
                    <button onClick={() => setBannerName(null)}>
                      <X className="h-3 w-3 text-muted-foreground/70" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-white/90"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Banner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Story */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Company Story</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={branding.story}
                onChange={(e) => setBranding((prev) => ({ ...prev, story: e.target.value }))}
                rows={6}
                className="text-sm"
                placeholder="Tell your company's story..."
              />
            </CardContent>
          </Card>

          {/* Team Photos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Team Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {branding.teamPhotos.map((photo) => (
                  <div key={photo.id} className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">
                      {photo.initials}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{photo.caption}</p>
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center">
                  <button className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border/60 text-muted-foreground/70 hover:border-brand-300 hover:text-brand-500">
                    <Plus className="h-5 w-5" />
                  </button>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">Add Photo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Benefits & Perks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {branding.benefits.map((benefit, i) => (
                  <Badge key={i} variant="brand" className="gap-1 py-1 text-xs">
                    {benefit}
                    <button onClick={() => removeBenefit(i)}>
                      <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addBenefit(); }}
                  placeholder="Add a benefit..."
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" onClick={addBenefit} disabled={!newBenefit.trim()} className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Culture Values */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Culture Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {branding.cultureValues.map((value, i) => {
                  const Icon = ICON_MAP[value.icon] || Lightbulb;
                  return (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                          <Icon className="h-4 w-4 text-brand-600" />
                        </div>
                        <Input
                          value={value.title}
                          onChange={(e) => updateCultureValue(i, "title", e.target.value)}
                          className="h-7 text-xs font-medium"
                        />
                      </div>
                      <Textarea
                        value={value.description}
                        onChange={(e) => updateCultureValue(i, "description", e.target.value)}
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day in the Life */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Day in the Life</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {branding.dayInTheLife.map((entry, i) => (
                <div key={entry.jobPostId} className="rounded-lg border border-border p-3">
                  <Label className="text-xs font-medium text-foreground/80">
                    {entry.jobTitle}
                  </Label>
                  <Textarea
                    value={entry.description}
                    onChange={(e) => updateDayInTheLife(i, e.target.value)}
                    rows={3}
                    className="mt-1.5 text-xs"
                  />
                </div>
              ))}
              {availableForDitl.length > 0 && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3 w-3" />
                  Add for another role
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preview Tab ── */}
        <TabsContent value="preview">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Banner */}
              <div className="flex h-32 items-end bg-gradient-to-r from-brand-500 to-brand-700 p-4 sm:h-44">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-lg font-bold text-brand-600 shadow-lg">
                    {company?.name?.charAt(0) ?? "C"}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {company?.name ?? "Your Company"}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      {company?.companySize && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {company.companySize} employees
                        </span>
                      )}
                      {locationStr && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {locationStr}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-4 sm:p-6">
                {/* Story */}
                {branding.story && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">About Us</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{branding.story}</p>
                  </div>
                )}

                {/* Culture Values */}
                {branding.cultureValues.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Our Values</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {branding.cultureValues.map((value, i) => {
                        const Icon = ICON_MAP[value.icon] || Lightbulb;
                        return (
                          <div key={i} className="rounded-lg bg-muted/30 p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                                <Icon className="h-4 w-4 text-brand-600" />
                              </div>
                              <h4 className="text-sm font-medium text-foreground">{value.title}</h4>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">{value.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {branding.benefits.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">Benefits & Perks</h3>
                    <div className="flex flex-wrap gap-2">
                      {branding.benefits.map((b, i) => (
                        <Badge key={i} variant="brand" className="text-xs">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team */}
                {branding.teamPhotos.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Meet the Team</h3>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {branding.teamPhotos.map((photo) => (
                        <div key={photo.id} className="text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                            {photo.initials}
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{photo.caption}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day in the Life */}
                {branding.dayInTheLife.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">A Day in the Life</h3>
                    <div className="space-y-3">
                      {branding.dayInTheLife.map((entry) => (
                        <div key={entry.jobPostId} className="rounded-lg border border-border p-3">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-brand-500" />
                            <h4 className="text-sm font-medium text-foreground">{entry.jobTitle}</h4>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">{entry.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <Button className="w-full gap-1.5">
                  Apply to Open Roles
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
