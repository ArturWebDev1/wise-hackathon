import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ConnectionCheck } from "./connection-check";

it("checks the API when requested and shows backend/database readiness", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: "ok", database: "connected" }),
  });
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(<ConnectionCheck />);

  await user.click(screen.getByRole("button", { name: "Check connection" }));

  expect(await screen.findByText("Connected. Backend and PostgreSQL are ready.")).toBeVisible();
  expect(fetchMock).toHaveBeenCalledWith("/api/status", expect.objectContaining({ cache: "no-store" }));
});
