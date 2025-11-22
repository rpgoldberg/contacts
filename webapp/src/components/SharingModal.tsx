"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Trash2, Loader2 } from "lucide-react";
import { getCurrentUser, shareWith, unshareWith, UserInfo } from "@/lib/api";

interface SharingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SharingModal({ isOpen, onClose }: SharingModalProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  const loadUser = async () => {
    setLoading(true);
    setError("");
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      setError("Failed to load sharing settings");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setActionLoading("add");
    setError("");
    try {
      const updatedUser = await shareWith(newUsername.trim());
      setUser(updatedUser);
      setNewUsername("");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("404")) {
          setError("User not found");
        } else if (err.message.includes("400")) {
          setError("Cannot share with that user");
        } else {
          setError("Failed to share");
        }
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnshare = async (username: string) => {
    setActionLoading(username);
    setError("");
    try {
      const updatedUser = await unshareWith(username);
      setUser(updatedUser);
    } catch {
      setError("Failed to remove sharing");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sharing Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Share your contacts with other users. They will be able to view and edit your contacts.
              </div>

              {/* Add new share */}
              <form onSubmit={handleShare} className="flex gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={actionLoading === "add" || !newUsername.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === "add" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                </button>
              </form>

              {/* Current shares */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shared with:
                </h3>
                {user?.shared_with && user.shared_with.length > 0 ? (
                  <ul className="space-y-2">
                    {user.shared_with.map((username) => (
                      <li
                        key={username}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-white">{username}</span>
                        <button
                          onClick={() => handleUnshare(username)}
                          disabled={actionLoading === username}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Remove sharing"
                        >
                          {actionLoading === username ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    Not sharing with anyone yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
