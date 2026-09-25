import { describe, expect, it } from "vitest";
import { websiteStatus } from "./status";

describe("websiteStatus", () => {
  it("null/undefined/kosong = draft", () => {
    expect(websiteStatus({ current_template_id: null })).toBe("draft");
    expect(websiteStatus({})).toBe("draft");
    expect(websiteStatus({ current_template_id: "" })).toBe("draft");
  });

  it("ada template id = publish", () => {
    expect(websiteStatus({ current_template_id: "tpl-food-1" })).toBe("publish");
  });
});
