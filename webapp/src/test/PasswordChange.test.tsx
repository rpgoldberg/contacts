import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";

// Mock the API
vi.mock("@/lib/api", () => ({
  changePassword: vi.fn(),
}));

import { changePassword } from "@/lib/api";

describe("PasswordChangeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <PasswordChangeModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders form when open", () => {
    render(<PasswordChangeModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
  });

  it("shows error when passwords don't match", async () => {
    render(<PasswordChangeModal isOpen={true} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("Current Password"), {
      target: { value: "oldpass" },
    });
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "different" },
    });

    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
  });

  it("shows error for short password", async () => {
    render(<PasswordChangeModal isOpen={true} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("Current Password"), {
      target: { value: "oldpass" },
    });
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "short" },
    });

    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
  });

  it("calls API on valid submit", async () => {
    const mockChangePassword = vi.mocked(changePassword);
    mockChangePassword.mockResolvedValueOnce(undefined);
    const onClose = vi.fn();

    render(<PasswordChangeModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText("Current Password"), {
      target: { value: "oldpass" },
    });
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "newpass123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith("oldpass", "newpass123");
    });

    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error on wrong current password", async () => {
    const mockChangePassword = vi.mocked(changePassword);
    mockChangePassword.mockRejectedValueOnce(new Error("API Error: 400 Bad Request"));

    render(<PasswordChangeModal isOpen={true} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("Current Password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "newpass123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });
  });

  it("closes modal on cancel", () => {
    const onClose = vi.fn();
    render(<PasswordChangeModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
