"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, MapPin, Users, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  companySize: string | null;
  description: string | null;
  locations: { city?: string; state?: string; country?: string }[];
  activeJobCount: number;
}

interface CompanySearchResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function CompanyInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-600">
      {initials}
    </div>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const primaryLocation = company.locations?.[0];
  const locationStr = primaryLocation
    ? [primaryLocation.city, primaryLocation.state, primaryLocation.country]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <Link href={`/dashboard/companies/${company.id}`}>
      <Card className="h-full cursor-pointer transition-all hover:border-brand-300 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-12 w-12 shrink-0 rounded-xl object-contain"
              />
            ) : (
              <CompanyInitials name={company.name} />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {company.name}
              </h3>
              {company.industry && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {company.industry}
                </p>
              )}
            </div>
            {company.activeJobCount > 0 && (
              <Badge className="shrink-0 bg-brand-50 text-xs text-brand-700 hover:bg-brand-100">
                {company.activeJobCount} {company.activeJobCount === 1 ? "job" : "jobs"}
              </Badge>
            )}
          </div>

          {company.description && (
            <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
              {company.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {locationStr && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {locationStr}
              </span>
            )}
            {company.companySize && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {company.companySize}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  // keyed by page number so background refetches always overwrite stale data
  const [pages, setPages] = useState<Map<number, Company[]>>(new Map());

  const { data, isLoading, isFetching } = useQuery<CompanySearchResponse>({
    queryKey: ["companies-search", query, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("page", String(page));
      params.set("limit", "12");
      const res = await fetch(`/api/companies/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load companies");
      return res.json();
    },
    staleTime: 0,
  });

  // Update page data whenever React Query delivers fresh data (including background refetches)
  useEffect(() => {
    if (data?.data) {
      setPages((prev) => {
        const next = new Map(prev);
        next.set(page, data.data);
        return next;
      });
    }
  }, [data, page]);

  // Reset accumulated pages whenever the search query changes
  useEffect(() => {
    setPages(new Map());
  }, [query]);

  const allCompanies = useMemo(() => {
    const sorted = [...pages.entries()].sort(([a], [b]) => a - b);
    return sorted.flatMap(([, companies]) => companies);
  }, [pages]);

  const handleSearch = useCallback(() => {
    setPage(1);
    setQuery(search);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  const handleClear = () => {
    setSearch("");
    setQuery("");
    setPage(1);
  };

  const hasMore = data?.hasMore ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-brand-500" />
          <h1 className="text-2xl font-semibold text-foreground">Companies</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse employers hiring on FitVector and explore their open positions.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by company name, industry, or description..."
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isFetching}>
          Search
        </Button>
        {query && (
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      {!isLoading && data && (
        <p className="text-sm text-muted-foreground">
          {data.total === 0
            ? "No companies found"
            : `${data.total} ${data.total === 1 ? "company" : "companies"} found`}
          {query && (
            <span>
              {" "}
              for <span className="font-medium text-foreground">"{query}"</span>
            </span>
          )}
        </p>
      )}

      {/* Loading state (first load) */}
      {isLoading && page === 1 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 rounded bg-muted" />
                  <div className="h-3 w-5/6 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allCompanies.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">No companies found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {query
              ? "Try a different search term."
              : "No companies are listed yet. Check back soon."}
          </p>
          {query && (
            <Button variant="outline" size="sm" className="mt-4" onClick={handleClear}>
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* Company grid */}
      {allCompanies.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetching}
              >
                {isFetching ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
