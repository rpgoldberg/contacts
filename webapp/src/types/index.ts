export interface Person {
  id: number;
  first_name: string | null;
  middle_initial: string | null;
  last_name: string | null;
  birth_date: string | null;
  anniversary_date: string | null;
  relation: string | null;
  title: string | null;
  married_to: string | null;
  decease_date: string | null;
  full_name: string;
  display_name: string;
}

export interface PersonDetail extends Person {
  addresses: Address[];
  communications: Communication[];
  attributes: Attribute[];
}

export interface PersonListItem {
  id: number;
  first_name: string | null;
  middle_initial: string | null;
  last_name: string | null;
  display_name: string;
  birth_date: string | null;
  anniversary_date: string | null;
  relation: string | null;
}

export interface PersonListPaginatedResponse {
  items: PersonListItem[];
  total: number;
}

export interface Address {
  id: number;
  person_id: number;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  address_type: string | null;
  full_address: string;
}

export interface Communication {
  id: number;
  person_id: number;
  comm_type: string | null;
  detail: string | null;
}

export interface Attribute {
  id: number;
  person_id: number;
  attrib_type: string | null;
  detail: string | null;
}

export interface LookupCode {
  id: number;
  field_name: string;
  code: string;
  description: string;
}

export interface UpcomingEvent {
  person_id: number;
  name: string;
  event_type: "birthday" | "anniversary";
  date: string;
  original_year: number | null;
  days_until: number;
}

export const RELATION_LABELS: Record<string, string> = {
  FAM: "Family",
  FRD: "Friend",
  ASC: "Associate",
  BUS: "Business",
};

export const COMM_TYPE_LABELS: Record<string, string> = {
  H: "Home",
  W: "Work",
  C: "Cell",
  E: "Email",
  F: "Fax",
  P: "Pager",
};

export const ADDRESS_TYPE_LABELS: Record<string, string> = {
  H: "Home",
  W: "Work",
  O: "Other",
};
