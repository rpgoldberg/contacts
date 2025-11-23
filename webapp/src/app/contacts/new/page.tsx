"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createPerson,
  createCommunication,
  createAddress,
  createAttribute,
} from "@/lib/api";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { RELATION_LABELS, COMM_TYPE_LABELS, ADDRESS_TYPE_LABELS, ATTRIBUTE_TYPE_OPTIONS } from "@/types";

interface NewCommunication {
  _tempId: string;
  comm_type: string;
  detail: string;
}

interface NewAddress {
  _tempId: string;
  address_type: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip_code: string;
}

interface NewAttribute {
  _tempId: string;
  attrib_type: string;
  detail: string;
}

export default function NewContactPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    first_name: "",
    middle_initial: "",
    last_name: "",
    birth_date: "",
    anniversary_date: "",
    relation: "",
    title: "",
    married_to: "",
  });

  const [communications, setCommunications] = useState<NewCommunication[]>([]);
  const [addresses, setAddresses] = useState<NewAddress[]>([]);
  const [attributes, setAttributes] = useState<NewAttribute[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Attribute type options: just the predefined list for new contacts
  const allAttributeTypes = ATTRIBUTE_TYPE_OPTIONS;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setIsDirty(true);
  };

  // Handle navigation with unsaved changes
  const handleNavigation = useCallback((href: string) => {
    if (isDirty) {
      setPendingNavigation(href);
      setShowUnsavedDialog(true);
    } else {
      router.push(href);
    }
  }, [isDirty, router]);

  const handleSaveAndNavigate = async () => {
    setShowUnsavedDialog(false);
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const handleDiscardAndNavigate = () => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  // Warn on browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Communications handlers
  const addCommunication = () => {
    setCommunications((prev) => [
      ...prev,
      { _tempId: `temp-${Date.now()}`, comm_type: "H", detail: "" },
    ]);
    setIsDirty(true);
  };

  const updateCommunicationField = (index: number, field: string, value: string) => {
    setCommunications((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    setIsDirty(true);
  };

  const removeCommunication = (index: number) => {
    setCommunications((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Addresses handlers
  const addAddress = () => {
    setAddresses((prev) => [
      ...prev,
      { _tempId: `temp-${Date.now()}`, address_type: "H", address1: "", address2: "", city: "", state: "", zip_code: "" },
    ]);
    setIsDirty(true);
  };

  const updateAddressField = (index: number, field: string, value: string) => {
    setAddresses((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
    setIsDirty(true);
  };

  const removeAddress = (index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Attributes handlers
  const addAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      { _tempId: `temp-${Date.now()}`, attrib_type: "", detail: "" },
    ]);
    setIsDirty(true);
  };

  const updateAttributeField = (index: number, field: string, value: string) => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
    setIsDirty(true);
  };

  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      // Create person first
      const personData: Record<string, string | null> = {};
      Object.entries(formData).forEach(([key, value]) => {
        personData[key] = value || null;
      });
      const newPerson = await createPerson(personData);
      const personId = newPerson.id;

      // Create communications
      for (const comm of communications) {
        if (comm.detail) {
          await createCommunication({ person_id: personId, comm_type: comm.comm_type, detail: comm.detail });
        }
      }

      // Create addresses
      for (const addr of addresses) {
        if (addr.address1 || addr.city) {
          await createAddress({
            person_id: personId,
            address_type: addr.address_type,
            address1: addr.address1 || null,
            address2: addr.address2 || null,
            city: addr.city || null,
            state: addr.state || null,
            zip_code: addr.zip_code || null,
          });
        }
      }

      // Create attributes
      for (const attr of attributes) {
        if (attr.attrib_type || attr.detail) {
          await createAttribute({ person_id: personId, attrib_type: attr.attrib_type || null, detail: attr.detail || null });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["persons"] });
      setIsDirty(false);
      router.push(pendingNavigation || `/contacts/${personId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create contact");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => handleNavigation("/")}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Add New Contact
          </h1>

          {/* Name Fields */}
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Middle Initial</label>
              <input type="text" name="middle_initial" value={formData.middle_initial} onChange={handleChange} maxLength={5} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Relation */}
          <div className="mb-4">
            <label className={labelClass}>Relationship</label>
            <select name="relation" value={formData.relation} onChange={handleChange} className={inputClass}>
              <option value="">Select...</option>
              {Object.entries(RELATION_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className={labelClass}>Birth Date</label>
              <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Anniversary Date</label>
              <input type="date" name="anniversary_date" value={formData.anniversary_date} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Title / Job</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Married To</label>
              <input type="text" name="married_to" value={formData.married_to} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Communications Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phone & Email</h2>
            <button
              type="button"
              onClick={addCommunication}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Communication
            </button>
          </div>

          <div className="space-y-3">
            {communications.map((comm, index) => (
              <div key={comm._tempId} className="flex items-center gap-2">
                <select
                  value={comm.comm_type}
                  onChange={(e) => updateCommunicationField(index, "comm_type", e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(COMM_TYPE_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={comm.detail}
                  onChange={(e) => updateCommunicationField(index, "detail", e.target.value)}
                  placeholder="Phone number or email"
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => removeCommunication(index)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {communications.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No phone numbers or emails. Click "Add Communication" to add one.</p>
            )}
          </div>
        </div>

        {/* Addresses Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Addresses</h2>
            <button
              type="button"
              onClick={addAddress}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </button>
          </div>

          <div className="space-y-4">
            {addresses.map((addr, index) => (
              <div key={addr._tempId} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <select
                    value={addr.address_type}
                    onChange={(e) => updateAddressField(index, "address_type", e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Object.entries(ADDRESS_TYPE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid gap-2">
                  <input
                    type="text"
                    value={addr.address1}
                    onChange={(e) => updateAddressField(index, "address1", e.target.value)}
                    placeholder="Street address"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={addr.address2}
                    onChange={(e) => updateAddressField(index, "address2", e.target.value)}
                    placeholder="Apt, suite, etc. (optional)"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={addr.city}
                      onChange={(e) => updateAddressField(index, "city", e.target.value)}
                      placeholder="City"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={addr.state}
                      onChange={(e) => updateAddressField(index, "state", e.target.value)}
                      placeholder="State"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={addr.zip_code}
                      onChange={(e) => updateAddressField(index, "zip_code", e.target.value)}
                      placeholder="ZIP"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
            {addresses.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No addresses. Click "Add Address" to add one.</p>
            )}
          </div>
        </div>

        {/* Attributes Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attributes</h2>
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Attribute
            </button>
          </div>

          <div className="space-y-3">
            {attributes.map((attr, index) => (
              <div key={attr._tempId} className="flex items-center gap-2">
                <input
                  type="text"
                  list="attribute-types"
                  value={attr.attrib_type}
                  onChange={(e) => updateAttributeField(index, "attrib_type", e.target.value)}
                  placeholder="Type"
                  className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={attr.detail}
                  onChange={(e) => updateAttributeField(index, "detail", e.target.value)}
                  placeholder="Value"
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {attributes.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No attributes. Click "Add Attribute" to add one.</p>
            )}
            <datalist id="attribute-types">
              {allAttributeTypes.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Error and Submit */}
        {saveError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {saveError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => handleNavigation("/")}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Contact
          </button>
        </div>
      </form>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Unsaved Changes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveAndNavigate}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleDiscardAndNavigate}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Don't Save
              </button>
              <button
                onClick={handleCancelNavigation}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
