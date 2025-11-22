"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPersons } from "@/lib/api";
import { ContactCard } from "@/components/ContactCard";
import { SearchBar } from "@/components/SearchBar";
import { Users, Loader2 } from "lucide-react";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [relation, setRelation] = useState<string | null>(null);

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ["persons", search, relation],
    queryFn: () => getPersons({ search: search || undefined, relation: relation || undefined }),
  });

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const handleRelationFilter = useCallback((rel: string | null) => {
    setRelation(rel);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
        {contacts && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({contacts.length} {contacts.length === 1 ? "contact" : "contacts"})
          </span>
        )}
      </div>

      <SearchBar
        onSearch={handleSearch}
        onRelationFilter={handleRelationFilter}
        initialQuery={search}
        initialRelation={relation}
      />

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
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
