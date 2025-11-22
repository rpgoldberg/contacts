"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getUpcomingAll } from "@/lib/api";
import { Calendar, Cake, Heart, Loader2, ChevronRight } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function UpcomingPage() {
  const [days, setDays] = useState(30);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ["upcoming", days],
    queryFn: () => getUpcomingAll(days),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
          <option value={365}>Next year</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          Failed to load events. Please try again.
        </div>
      )}

      {events && events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No upcoming events in the next {days} days</p>
        </div>
      )}

      {events && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event, index) => (
            <Link
              key={`${event.person_id}-${event.event_type}-${index}`}
              href={`/contacts/${event.person_id}`}
              className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                  event.event_type === "birthday"
                    ? "bg-pink-100 dark:bg-pink-900"
                    : "bg-red-100 dark:bg-red-900"
                )}
              >
                {event.event_type === "birthday" ? (
                  <Cake className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                ) : (
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {event.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {event.event_type === "birthday" ? "Birthday" : "Anniversary"} on{" "}
                  {formatDateShort(event.date)}
                  {event.original_year && event.original_year < 3000 && (
                    <span className="ml-1">
                      ({new Date().getFullYear() - event.original_year}{" "}
                      {event.event_type === "birthday" ? "years old" : "years"})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    event.days_until === 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : event.days_until <= 7
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  )}
                >
                  {event.days_until === 0
                    ? "Today!"
                    : event.days_until === 1
                      ? "Tomorrow"
                      : `${event.days_until} days`}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
