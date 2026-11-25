"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = ["All", "Agriculture", "Real Estate", "Energy", "Logistics", "Commodities", "Food & Beverage"];

export function DiscoverControls({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category") ?? "All";
  const sort = params.get("sort") ?? "popular";
  const [query, setQuery] = useState(params.get("q") ?? "");

  function push(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "All") search.delete(key);
      else search.set(key, value);
    }
    const queryString = search.toString();
    router.push(`/discover${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            push({ q: query.trim() || null });
          }}
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by asset, category or city"
            className="input py-3.5 pl-11"
            aria-label="Search opportunities"
          />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <select
              value={sort}
              onChange={(event) => push({ sort: event.target.value })}
              className="select min-w-[170px] pl-9"
              aria-label="Sort opportunities"
            >
              <option value="popular">Most popular</option>
              <option value="ending">Closing soon</option>
              <option value="newest">Newest</option>
              <option value="target">Largest target</option>
            </select>
          </label>
        </div>
      </div>

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => push({ category: item })}
            className={cn("chip whitespace-nowrap", category === item && "chip-active")}
          >
            {item}
          </button>
        ))}
        <span className="ml-auto hidden whitespace-nowrap text-[11.5px] text-muted sm:block">
          {total} opportunit{total === 1 ? "y" : "ies"}
        </span>
      </div>
    </div>
  );
}
