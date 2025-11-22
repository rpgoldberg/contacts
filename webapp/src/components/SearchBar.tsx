"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { RELATION_LABELS } from "@/types";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onRelationFilter: (relation: string | null) => void;
  initialQuery?: string;
  initialRelation?: string | null;
}

export function SearchBar({
  onSearch,
  onRelationFilter,
  initialQuery = "",
  initialRelation = null,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(initialRelation);

  useEffect(() => {
    const debounce = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, onSearch]);

  const handleRelationChange = (relation: string | null) => {
    setSelectedRelation(relation);
    onRelationFilter(relation);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleRelationChange(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedRelation === null
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          All
        </button>
        {Object.entries(RELATION_LABELS).map(([code, label]) => (
          <button
            key={code}
            onClick={() => handleRelationChange(code)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedRelation === code
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
