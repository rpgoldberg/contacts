"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPerson, deletePerson } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Cake,
  Heart,
  Briefcase,
  ArrowLeft,
  Loader2,
  Trash2,
  Edit,
  Calendar,
  Users,
} from "lucide-react";
import { formatDate, calculateAge, calculateYears } from "@/lib/utils";
import { RELATION_LABELS, COMM_TYPE_LABELS, ADDRESS_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ["person", id],
    queryFn: () => getPerson(id),
    enabled: !isNaN(id) && isAuthenticated(),
  });

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      router.push("/");
    },
    onError: (error) => {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete contact");
    },
  });

  const handleDelete = () => {
    setDeleteError(null);
    if (confirm("Are you sure you want to delete this contact? This cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !contact) {
    const errorMessage = error instanceof Error ? error.message : "";
    const isSessionError = errorMessage.includes("Session expired") || errorMessage.includes("401");
    const isNotFound = errorMessage.includes("404");

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          {isSessionError ? (
            <>Session expired. Please <Link href="/login" className="underline font-medium">log in</Link> again.</>
          ) : isNotFound ? (
            "Contact not found."
          ) : (
            "Failed to load contact. Please try again."
          )}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to contacts
        </Link>
      </div>
    );
  }

  const age = calculateAge(contact.birth_date);
  const years = calculateYears(contact.anniversary_date);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Delete Error */}
      {deleteError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
          {deleteError}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/contacts/${id}/edit`}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contact Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{contact.display_name}</h1>
              {contact.relation && (
                <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                  {RELATION_LABELS[contact.relation] || contact.relation}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            {contact.birth_date && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Cake className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Birthday</p>
                  <p className="font-medium">
                    {formatDate(contact.birth_date)}
                    {age !== null && ` (${age} years old)`}
                  </p>
                </div>
              </div>
            )}
            {contact.anniversary_date && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Anniversary</p>
                  <p className="font-medium">
                    {formatDate(contact.anniversary_date)}
                    {years !== null && ` (${years} years)`}
                  </p>
                </div>
              </div>
            )}
            {contact.married_to && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Married To</p>
                  <p className="font-medium">{contact.married_to}</p>
                </div>
              </div>
            )}
            {contact.title && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Briefcase className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                  <p className="font-medium">{contact.title}</p>
                </div>
              </div>
            )}
          </div>

          {contact.decease_date && (
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 border-t pt-4 mt-4">
              <Calendar className="w-5 h-5" />
              <p>Deceased: {formatDate(contact.decease_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Communications */}
      {contact.communications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary-600" />
            Contact Info
          </h2>
          <div className="space-y-3">
            {contact.communications.map((comm) => (
              <div
                key={comm.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {comm.comm_type === "E" ? (
                    <Mail className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Phone className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {COMM_TYPE_LABELS[comm.comm_type || ""] || comm.comm_type}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">{comm.detail}</p>
                  </div>
                </div>
                {comm.comm_type === "E" && comm.detail && (
                  <a
                    href={`mailto:${comm.detail}`}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Send
                  </a>
                )}
                {["H", "W", "C"].includes(comm.comm_type || "") && comm.detail && (
                  <a
                    href={`tel:${comm.detail.replace(/\D/g, "")}`}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Addresses */}
      {contact.addresses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Addresses
          </h2>
          <div className="space-y-3">
            {contact.addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {ADDRESS_TYPE_LABELS[addr.address_type || ""] || addr.address_type || "Address"}
                </p>
                <p className="text-gray-900 dark:text-white whitespace-pre-line">
                  {addr.full_address || "No address details"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {contact.attributes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Info
          </h2>
          <div className="space-y-3">
            {contact.attributes.map((attr) => (
              <div
                key={attr.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {attr.attrib_type}
                </p>
                <p className="text-gray-900 dark:text-white">{attr.detail || "-"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
