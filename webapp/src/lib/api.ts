import type {
  Person,
  PersonDetail,
  PersonListItem,
  Address,
  Communication,
  Attribute,
  LookupCode,
  UpcomingEvent,
} from "@/types";
import { getAuthHeader } from "./auth";

// Use local proxy in production, direct API in development
const API_URL = typeof window !== 'undefined'
  ? "/api"  // Browser: use Next.js API proxy
  : (process.env.BACKEND_URL || "http://localhost:8000") + "/api/v1";  // Server-side

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authHeader = getAuthHeader();
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Persons
export async function getPersons(params?: {
  search?: string;
  relation?: string;
}): Promise<PersonListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.relation) searchParams.set("relation", params.relation);
  const query = searchParams.toString();
  return fetchApi<PersonListItem[]>(`/persons/${query ? `?${query}` : ""}`);
}

export async function getPerson(id: number): Promise<PersonDetail> {
  return fetchApi<PersonDetail>(`/persons/${id}`);
}

export async function createPerson(data: Partial<Person>): Promise<Person> {
  return fetchApi<Person>("/persons/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePerson(id: number, data: Partial<Person>): Promise<Person> {
  return fetchApi<Person>(`/persons/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePerson(id: number): Promise<void> {
  return fetchApi<void>(`/persons/${id}`, {
    method: "DELETE",
  });
}

// Addresses
export async function createAddress(data: Partial<Address>): Promise<Address> {
  return fetchApi<Address>("/addresses/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAddress(id: number, data: Partial<Address>): Promise<Address> {
  return fetchApi<Address>(`/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id: number): Promise<void> {
  return fetchApi<void>(`/addresses/${id}`, {
    method: "DELETE",
  });
}

// Communications
export async function createCommunication(data: Partial<Communication>): Promise<Communication> {
  return fetchApi<Communication>("/communications/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCommunication(
  id: number,
  data: Partial<Communication>
): Promise<Communication> {
  return fetchApi<Communication>(`/communications/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCommunication(id: number): Promise<void> {
  return fetchApi<void>(`/communications/${id}`, {
    method: "DELETE",
  });
}

// Attributes
export async function createAttribute(data: Partial<Attribute>): Promise<Attribute> {
  return fetchApi<Attribute>("/attributes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAttribute(id: number, data: Partial<Attribute>): Promise<Attribute> {
  return fetchApi<Attribute>(`/attributes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAttribute(id: number): Promise<void> {
  return fetchApi<void>(`/attributes/${id}`, {
    method: "DELETE",
  });
}

// Lookup Codes
export async function getLookupCodes(fieldName?: string): Promise<LookupCode[]> {
  const query = fieldName ? `?field_name=${fieldName}` : "";
  return fetchApi<LookupCode[]>(`/lookup-codes/${query}`);
}

// Upcoming Events
export async function getUpcomingBirthdays(days = 30): Promise<UpcomingEvent[]> {
  return fetchApi<UpcomingEvent[]>(`/upcoming/birthdays?days=${days}`);
}

export async function getUpcomingAnniversaries(days = 30): Promise<UpcomingEvent[]> {
  return fetchApi<UpcomingEvent[]>(`/upcoming/anniversaries?days=${days}`);
}

export async function getUpcomingAll(days = 30): Promise<UpcomingEvent[]> {
  return fetchApi<UpcomingEvent[]>(`/upcoming/all?days=${days}`);
}
