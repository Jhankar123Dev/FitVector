"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  IndianRupee,
  TrendingUp,
  Users,
  ArrowLeft,
  X,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  EXPERIENCE_FILTERS,
  type ExperienceFilter,
  type SalaryAggregation,
} from "@/types/community";
import { useSalaryInsights, useSubmitSalaryReport, useSalaryRoles } from "@/hooks/use-community";
import { MOCK_SALARY_LOCATIONS } from "@/lib/mock/community-data";

function formatSalary(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function SalaryInsightsPage() {
  const [roleQuery, setRoleQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [expFilter, setExpFilter] = useState<ExperienceFilter>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userSalary, setUserSalary] = useState("");
  const [showContributeModal, setShowContributeModal] = useState(false);

  const { data: rolesData } = useSalaryRoles();
  const salaryRoles = rolesData?.data || [];

  // Role suggestions
  const suggestions = useMemo(() => {
    if (!roleQuery.trim()) return [];
    const q = roleQuery.toLowerCase();
    return salaryRoles.filter((r) => r.toLowerCase().includes(q)).slice(0, 6);
  }, [roleQuery, salaryRoles]);

  // Fetch aggregation from API
  const expRange = EXPERIENCE_FILTERS[expFilter];
  const { data: salaryData } = useSalaryInsights(
    selectedRole,
    location === "All" ? "" : location,
    expRange.min,
    expRange.max,
  );

  const aggregation = useMemo<SalaryAggregation | null>(() => {
    if (!salaryData?.data || salaryData.data.insufficientData) return null;
    const d = salaryData.data;
    return {
      role: (d.role as string) || selectedRole,
      location: (d.location as string) || location,
      sampleSize: (d.sampleSize as number) || 0,
      median: (d.median as number) || 0,
      p25: (d.p25 as number) || 0,
      p75: (d.p75 as number) || 0,
      min: (d.min as number) || 0,
      max: (d.max as number) || 0,
      distribution: [],
    };
  }, [salaryData, selectedRole, location]);

  // Percentile calculation — piecewise linear using known anchors
  const percentile = useMemo(() => {
    if (!aggregation || !userSalary) return null;
    const val = Number(userSalary);
    if (isNaN(val) || val <= 0) return null;
    const { min, p25, median, p75, max } = aggregation;
    if (val <= min) return 5;
    if (val >= max) return 95;
    const segments: [number, number, number, number][] = [
      [min, p25,    5,  25],
      [p25, median, 25, 50],
      [median, p75, 50, 75],
      [p75, max,    75, 95],
    ];
    for (const [lo, hi, pLo, pHi] of segments) {
      if (val >= lo && val < hi) {
        return Math.round(pLo + ((val - lo) / (hi - lo)) * (pHi - pLo));
      }
    }
    return 95;
  }, [aggregation, userSalary]);

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setRoleQuery(role);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    if (roleQuery.trim()) {
      const match = salaryRoles.find(
        (r) => r.toLowerCase() === roleQuery.trim().toLowerCase(),
      );
      if (match) {
        setSelectedRole(match);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/community"
            className="mb-2 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Community
          </Link>
          <h1 className="text-2xl font-semibold text-surface-800">Salary Insights</h1>
          <p className="mt-1 text-sm text-surface-500">
            Anonymous salary data for {salaryRoles.length} roles · Contributed by the community
          </p>
        </div>
        <Button onClick={() => setShowContributeModal(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Contribute Your Salary
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            {/* Role search with suggestions */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Search role... e.g. Frontend Developer"
                value={roleQuery}
                onChange={(e) => { setRoleQuery(e.target.value); setShowSuggestions(true); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-8"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border border-surface-200 bg-white shadow-lg">
                  {suggestions.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSelectRole(r)}
                      className="flex w-full items-center px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
            >
              {MOCK_SALARY_LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            {/* Experience */}
            <div className="flex gap-1">
              {(Object.keys(EXPERIENCE_FILTERS) as ExperienceFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setExpFilter(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    expFilter === f
                      ? "bg-brand-500 text-white"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200",
                  )}
                >
                  {EXPERIENCE_FILTERS[f].label}
                </button>
              ))}
            </div>

            <Button onClick={handleSearch} className="sm:ml-auto">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No Selection State */}
      {!selectedRole && (
        <div className="py-12 text-center">
          <IndianRupee className="mx-auto mb-2 h-8 w-8 text-surface-300" />
          <p className="text-sm text-surface-500">Search for a role to see salary insights</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {salaryRoles.slice(0, 8).map((r) => (
              <button
                key={r}
                onClick={() => handleSelectRole(r)}
                className="rounded-full border border-surface-200 px-3 py-1 text-xs text-surface-600 hover:border-brand-300 hover:text-brand-600"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {selectedRole && aggregation && (
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h2 className="text-lg font-semibold text-surface-800">
              {selectedRole}
            </h2>
            <p className="text-sm text-surface-500">
              {location === "All" ? "All locations" : location}
              {expFilter !== "all" ? ` · ${EXPERIENCE_FILTERS[expFilter].label} experience` : ""}
            </p>
          </div>

          {/* Not Enough Data Warning */}
          {aggregation.sampleSize < 10 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                Limited data ({aggregation.sampleSize} reports). Results may not be representative.
                <button
                  onClick={() => setShowContributeModal(true)}
                  className="ml-1 font-medium underline"
                >
                  Help by contributing your salary
                </button>
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <IndianRupee className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Median Total Comp</p>
                  <p className="text-lg font-semibold text-surface-800">
                    {formatSalary(aggregation.median)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Salary Range (P25–P75)</p>
                  <p className="text-lg font-semibold text-surface-800">
                    {formatSalary(aggregation.p25)} – {formatSalary(aggregation.p75)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Sample Size</p>
                  <p className="text-lg font-semibold text-surface-800">
                    {aggregation.sampleSize} reports
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Range Bar */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-surface-800">Salary Range</h3>
              <div className="relative h-8">
                {/* Track */}
                <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-surface-100" />
                {/* P25-P75 range */}
                <div
                  className="absolute top-3 h-2 rounded-full bg-brand-400/60"
                  style={{
                    left: `${((aggregation.p25 - aggregation.min) / (aggregation.max - aggregation.min)) * 100}%`,
                    width: `${((aggregation.p75 - aggregation.p25) / (aggregation.max - aggregation.min)) * 100}%`,
                  }}
                />
                {/* Median marker */}
                <div
                  className="absolute top-1.5 h-5 w-1 rounded-full bg-brand-600"
                  style={{
                    left: `${((aggregation.median - aggregation.min) / (aggregation.max - aggregation.min)) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-surface-400">
                <span>{formatSalary(aggregation.min)}</span>
                <span className="font-medium text-brand-600">Median: {formatSalary(aggregation.median)}</span>
                <span>{formatSalary(aggregation.max)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          {aggregation.distribution.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Salary Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={aggregation.distribution}
                      barSize={40}
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fontSize: 10, fill: "#78716c" }}
                        axisLine={{ stroke: "#e7e5e4" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#a8a29e" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e7e5e4",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                        formatter={(value: number) => [`${value} reports`, "Count"]}
                      />
                      <Bar
                        dataKey="count"
                        fill="#7C3AED"
                        fillOpacity={0.8}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Percentile Comparison */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-surface-800">
                Compare Your Salary
              </h3>
              <p className="mb-3 text-xs text-surface-500">
                Enter your total compensation to see where you stand
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">₹</span>
                  <Input
                    type="number"
                    placeholder="e.g. 2500000"
                    value={userSalary}
                    onChange={(e) => setUserSalary(e.target.value)}
                    className="pl-7"
                  />
                </div>
                {percentile !== null && (
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1",
                      percentile >= 75 ? "bg-green-50 text-green-700" :
                      percentile >= 50 ? "bg-blue-50 text-blue-700" :
                      percentile >= 25 ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700",
                    )}
                  >
                    {percentile}th percentile
                  </Badge>
                )}
              </div>
              {percentile !== null && (
                <p className="mt-2 text-xs text-surface-500">
                  Your total compensation of {formatSalary(Number(userSalary))} is{" "}
                  {percentile >= 75 ? "above" : percentile >= 50 ? "at or above" : percentile >= 25 ? "below" : "well below"}{" "}
                  the median for {selectedRole} in {location === "All" ? "all locations" : location}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No data state */}
      {selectedRole && !aggregation && (
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-surface-300" />
          <p className="text-sm text-surface-500">
            No salary data available for {selectedRole} in {location}.
          </p>
          <p className="mt-1 text-xs text-surface-400">
            Try a different location or experience filter.
          </p>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <ContributeSalaryModal onClose={() => setShowContributeModal(false)} />
      )}
    </div>
  );
}

// ─── Contribute Modal ──────────────────────────────────────────────────────

function ContributeSalaryModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [loc, setLoc] = useState("Bangalore");
  const [experience, setExperience] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [totalComp, setTotalComp] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { mutate: submitReport, isPending: submitting } = useSubmitSalaryReport();

  const handleSubmit = () => {
    if (!role.trim() || !baseSalary) return;
    submitReport(
      {
        roleTitle: role,
        companyName: company,
        location: loc,
        experienceYears: parseInt(experience) || 0,
        baseSalary: parseInt(baseSalary),
        totalCompensation: parseInt(totalComp) || parseInt(baseSalary),
        currency: "INR",
      },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold text-surface-800">
            {submitted ? "Thanks for contributing!" : "Contribute Your Salary"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <IndianRupee className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-surface-600">
              Your anonymous salary data has been added! This helps the community make better decisions.
            </p>
            <Button size="sm" onClick={onClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div>
              <Label className="text-xs">Role *</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">Company <span className="text-surface-400">(optional)</span></Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Location</Label>
                <select
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
                >
                  {MOCK_SALARY_LOCATIONS.filter((l) => l !== "All").map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Experience (years)</Label>
                <Input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Base Salary (₹/year) *</Label>
                <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="e.g. 2000000" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Total Comp (₹/year)</Label>
                <Input type="number" value={totalComp} onChange={(e) => setTotalComp(e.target.value)} placeholder="e.g. 2500000" className="mt-1" />
              </div>
            </div>

            <p className="text-[10px] text-surface-400">
              All data is submitted anonymously. Your name and email will never be shared.
            </p>

            <Button onClick={handleSubmit} disabled={submitting || !role.trim() || !baseSalary} className="w-full gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Submitting..." : "Submit Anonymously"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
