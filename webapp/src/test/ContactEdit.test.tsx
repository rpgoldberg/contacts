import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// These tests define the expected behavior for editing communications,
// addresses, and attributes on a contact. The UI doesn't exist yet -
// these are TDD tests that should fail until implemented.

// Mock next/navigation
const mockPush = vi.fn();
const mockParams = { id: "1" };
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

// Mock API
const mockGetPerson = vi.fn();
const mockUpdatePerson = vi.fn();
const mockCreateCommunication = vi.fn();
const mockUpdateCommunication = vi.fn();
const mockDeleteCommunication = vi.fn();
const mockCreateAddress = vi.fn();
const mockUpdateAddress = vi.fn();
const mockDeleteAddress = vi.fn();
const mockCreateAttribute = vi.fn();
const mockUpdateAttribute = vi.fn();
const mockDeleteAttribute = vi.fn();

vi.mock("@/lib/api", () => ({
  getPerson: () => mockGetPerson(),
  updatePerson: (...args: unknown[]) => mockUpdatePerson(...args),
  createCommunication: (...args: unknown[]) => mockCreateCommunication(...args),
  updateCommunication: (...args: unknown[]) => mockUpdateCommunication(...args),
  deleteCommunication: (...args: unknown[]) => mockDeleteCommunication(...args),
  createAddress: (...args: unknown[]) => mockCreateAddress(...args),
  updateAddress: (...args: unknown[]) => mockUpdateAddress(...args),
  deleteAddress: (...args: unknown[]) => mockDeleteAddress(...args),
  createAttribute: (...args: unknown[]) => mockCreateAttribute(...args),
  updateAttribute: (...args: unknown[]) => mockUpdateAttribute(...args),
  deleteAttribute: (...args: unknown[]) => mockDeleteAttribute(...args),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  isAuthenticated: () => true,
}));

describe("Contact Edit Page - Communications", () => {
  let queryClient: QueryClient;

  const mockContact = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    display_name: "Doe, John",
    full_name: "John Doe",
    communications: [
      { id: 101, person_id: 1, comm_type: "H", detail: "555-1234" },
      { id: 102, person_id: 1, comm_type: "E", detail: "john@example.com" },
    ],
    addresses: [],
    attributes: [],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    mockGetPerson.mockResolvedValue(mockContact);
  });

  describe("displaying existing communications", () => {
    it("shows all existing phone numbers and emails for the contact", async () => {
      // Import dynamically to get fresh module with mocks
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("555-1234")).toBeInTheDocument();
        expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
      });
    });

    it("shows the communication type for each entry", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Should have type selectors with correct values
        const selects = screen.getAllByRole("combobox");
        const homeSelect = selects.find(s => (s as HTMLSelectElement).value === "H");
        const emailSelect = selects.find(s => (s as HTMLSelectElement).value === "E");
        expect(homeSelect).toBeInTheDocument();
        expect(emailSelect).toBeInTheDocument();
      });
    });
  });

  describe("adding new communications", () => {
    it("has an 'Add Phone/Email' button", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/add (phone|email|communication)/i)).toBeInTheDocument();
      });
    });

    it("adds a new empty communication row when clicking add button", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("555-1234")).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add (phone|email|communication)/i);
      await user.click(addButton);

      // Should now have 3 communication rows (2 existing + 1 new)
      const inputs = screen.getAllByPlaceholderText(/phone|email|number/i);
      expect(inputs.length).toBeGreaterThanOrEqual(3);
    });

    it("saves new communication when form is submitted", async () => {
      mockCreateCommunication.mockResolvedValue({ id: 103, person_id: 1, comm_type: "C", detail: "555-9999" });

      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("555-1234")).toBeInTheDocument();
      });

      // Add new communication
      const addButton = screen.getByText(/add (phone|email|communication)/i);
      await user.click(addButton);

      // Fill in new communication
      const newInputs = screen.getAllByPlaceholderText(/phone|email|number/i);
      const newInput = newInputs[newInputs.length - 1];
      await user.type(newInput, "555-9999");

      // Submit form
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCreateCommunication).toHaveBeenCalledWith(
          expect.objectContaining({ person_id: 1, detail: "555-9999" })
        );
      });
    });
  });

  describe("editing existing communications", () => {
    it("updates communication when value is changed and saved", async () => {
      mockUpdateCommunication.mockResolvedValue({ id: 101, person_id: 1, comm_type: "H", detail: "555-4321" });

      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("555-1234")).toBeInTheDocument();
      });

      // Edit existing phone number
      const phoneInput = screen.getByDisplayValue("555-1234");
      await user.clear(phoneInput);
      await user.type(phoneInput, "555-4321");

      // Submit form
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateCommunication).toHaveBeenCalledWith(
          101,
          expect.objectContaining({ detail: "555-4321" })
        );
      });
    });
  });

  describe("removing communications", () => {
    it("has a remove button for each communication", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("555-1234")).toBeInTheDocument();
      });

      // Should have remove buttons (one per communication)
      const removeButtons = screen.getAllByRole("button", { name: /remove|delete|×/i });
      expect(removeButtons.length).toBeGreaterThanOrEqual(2);
    });

    it("removes communication from UI immediately when remove button is clicked", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("555-1234")).toBeInTheDocument();
      });

      // Find and click remove button for first communication
      const removeButtons = screen.getAllByRole("button", { name: /remove|delete|×/i });
      await user.click(removeButtons[0]);

      // Item should be removed from UI immediately
      await waitFor(() => {
        expect(screen.queryByDisplayValue("555-1234")).not.toBeInTheDocument();
      });
    });

    it("deletes communication via API when form is saved", async () => {
      mockDeleteCommunication.mockResolvedValue(undefined);
      mockUpdatePerson.mockResolvedValue({ id: 1 });

      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("555-1234")).toBeInTheDocument();
      });

      // Find and click remove button for first communication
      const removeButtons = screen.getAllByRole("button", { name: /remove|delete|×/i });
      await user.click(removeButtons[0]);

      // Submit the form to trigger the API call
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockDeleteCommunication).toHaveBeenCalledWith(101);
      });
    });
  });
});

describe("Contact Edit Page - Addresses", () => {
  let queryClient: QueryClient;

  const mockContact = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    display_name: "Doe, John",
    full_name: "John Doe",
    communications: [],
    addresses: [
      { id: 201, person_id: 1, address_type: "H", address1: "123 Main St", city: "Springfield", state: "IL", zip_code: "62701" },
    ],
    attributes: [],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    mockGetPerson.mockResolvedValue(mockContact);
  });

  describe("displaying existing addresses", () => {
    it("shows all existing addresses for the contact", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Springfield")).toBeInTheDocument();
      });
    });
  });

  describe("adding new addresses", () => {
    it("has an 'Add Address' button", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/add address/i)).toBeInTheDocument();
      });
    });

    it("saves new address when form is submitted", async () => {
      mockCreateAddress.mockResolvedValue({ id: 202, person_id: 1, address_type: "W", address1: "456 Work Ave" });

      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/add address/i)).toBeInTheDocument();
      });

      // Add new address
      const addButton = screen.getByText(/add address/i);
      await user.click(addButton);

      // Fill in new address - find the new empty input
      const addressInputs = screen.getAllByPlaceholderText(/address|street/i);
      const newInput = addressInputs[addressInputs.length - 1];
      await user.type(newInput, "456 Work Ave");

      // Submit form
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCreateAddress).toHaveBeenCalledWith(
          expect.objectContaining({ person_id: 1, address1: "456 Work Ave" })
        );
      });
    });
  });

  describe("removing addresses", () => {
    it("removes address from UI immediately when remove button is clicked", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
      });

      // Find and click remove button for address
      const removeButtons = screen.getAllByRole("button", { name: /remove|delete|×/i });
      await user.click(removeButtons[0]);

      // Item should be removed from UI immediately
      await waitFor(() => {
        expect(screen.queryByDisplayValue("123 Main St")).not.toBeInTheDocument();
      });
    });

    it("deletes address via API when form is saved", async () => {
      mockDeleteAddress.mockResolvedValue(undefined);
      mockUpdatePerson.mockResolvedValue({ id: 1 });

      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
      });

      // Find and click remove button for address
      const removeButtons = screen.getAllByRole("button", { name: /remove|delete|×/i });
      await user.click(removeButtons[0]);

      // Submit the form to trigger the API call
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockDeleteAddress).toHaveBeenCalledWith(201);
      });
    });
  });
});

describe("Contact Edit Page - Attributes", () => {
  let queryClient: QueryClient;

  const mockContact = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    display_name: "Doe, John",
    full_name: "John Doe",
    communications: [],
    addresses: [],
    attributes: [
      { id: 301, person_id: 1, attrib_type: "Hobby", detail: "Golf" },
    ],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    mockGetPerson.mockResolvedValue(mockContact);
  });

  describe("displaying existing attributes", () => {
    it("shows all existing attributes for the contact", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Golf")).toBeInTheDocument();
      });
    });
  });

  describe("adding new attributes", () => {
    it("has an 'Add Attribute' button", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/add attribute/i)).toBeInTheDocument();
      });
    });
  });

  describe("removing attributes", () => {
    it("removes attribute from UI immediately when remove button is clicked", async () => {
      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Golf")).toBeInTheDocument();
      });

      // Find and click remove button for attribute
      const removeButtons = screen.getAllByRole("button", { name: /remove|delete|×/i });
      await user.click(removeButtons[0]);

      // Item should be removed from UI immediately
      await waitFor(() => {
        expect(screen.queryByDisplayValue("Golf")).not.toBeInTheDocument();
      });
    });

    it("deletes attribute via API when form is saved", async () => {
      mockDeleteAttribute.mockResolvedValue(undefined);
      mockUpdatePerson.mockResolvedValue({ id: 1 });

      const { default: EditContactPage } = await import("@/app/contacts/[id]/edit/page");
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <EditContactPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Golf")).toBeInTheDocument();
      });

      // Find and click remove button for attribute
      const removeButtons = screen.getAllByRole("button", { name: /remove|delete|×/i });
      await user.click(removeButtons[0]);

      // Submit the form to trigger the API call
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockDeleteAttribute).toHaveBeenCalledWith(301);
      });
    });
  });
});
