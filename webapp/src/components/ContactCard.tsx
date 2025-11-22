"use client";

import Link from "next/link";
import { User, Phone, Mail, MapPin, Cake, Heart } from "lucide-react";
import type { PersonListItem } from "@/types";
import { RELATION_LABELS } from "@/types";
import { formatDateShort, calculateAge } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ContactCardProps {
  contact: PersonListItem;
  sortBy?: "first" | "last";
}

export function ContactCard({ contact, sortBy = "last" }: ContactCardProps) {
  const age = calculateAge(contact.birth_date);
  const relationLabel = contact.relation ? RELATION_LABELS[contact.relation] : null;

  // Format name based on sort order
  const displayName = sortBy === "first"
    ? [contact.first_name, contact.middle_initial, contact.last_name].filter(Boolean).join(" ")
    : contact.display_name; // Backend default: "Last, First M"

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {relationLabel && (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  contact.relation === "FAM"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    : contact.relation === "FRD"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : contact.relation === "BUS"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                )}
              >
                {relationLabel}
              </span>
            )}
            {contact.birth_date && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Cake className="w-3 h-3" />
                {formatDateShort(contact.birth_date)}
                {age !== null && ` (${age})`}
              </span>
            )}
            {contact.anniversary_date && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Heart className="w-3 h-3" />
                {formatDateShort(contact.anniversary_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
