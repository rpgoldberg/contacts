"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPersons } from "@/lib/api";
import { ContactCard } from "@/components/ContactCard";
import { SearchBar } from "@/components/SearchBar";
import { Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

type SortBy = "last" | "first";

const SORT_KEY = "contacts_sort_preference";
const DR_FILTER_KEY = "contacts_dr_filter";
const PAGE_SIZE = 50;

function getStoredSort(): SortBy {
  if (typeof window === "undefined") return "last";
  return (localStorage.getItem(SORT_KEY) as SortBy) || "last";
}

function getStoredDrFilter(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DR_FILTER_KEY) === "true";
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [relation, setRelation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("last");
  const [drFilter, setDrFilter] = useState(false);
  const [page, setPage] = useState(0);

  // Load preferences on mount
  useEffect(() => {
    setSortBy(getStoredSort());
    setDrFilter(getStoredDrFilter());
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, relation, drFilter, sortBy]);

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ["persons", search, relation, drFilter, sortBy, page],
    queryFn: () => getPersons({
      search: search || undefined,
      relation: relation || undefined,
      dr_filter: drFilter || undefined,
      sort_by: sortBy,
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
  });

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const handleRelationFilter = useCallback((rel: string | null) => {
    setRelation(rel);
  }, []);

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    localStorage.setItem(SORT_KEY, newSort);
  };

  const handleDrFilterToggle = () => {
    const newValue = !drFilter;
    setDrFilter(newValue);
    localStorage.setItem(DR_FILTER_KEY, String(newValue));
  };

  const hasNextPage = contacts && contacts.length === PAGE_SIZE;
  const hasPrevPage = page > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
        {contacts && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            (Page {page + 1}{contacts.length > 0 ? `, showing ${contacts.length}` : ""})
          </span>
        )}
      </div>

      <SearchBar
        onSearch={handleSearch}
        onRelationFilter={handleRelationFilter}
        initialQuery={search}
        initialRelation={relation}
      />

      {/* Sort and Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Sort:</span>
          <button
            onClick={() => handleSortChange("last")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "last"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Last Name
          </button>
          <button
            onClick={() => handleSortChange("first")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "first"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            First Name
          </button>
        </div>
        <button
          onClick={handleDrFilterToggle}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            drFilter
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Filter: Dr. Only
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          Failed to load contacts. Please try again.
        </div>
      )}

      {contacts && contacts.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No contacts found</p>
        </div>
      )}

      {contacts && contacts.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} sortBy={sortBy} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!hasPrevPage || isLoading}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasPrevPage && !isLoading
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || isLoading}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasNextPage && !isLoading
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
