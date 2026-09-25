import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateApplicationEmail } from "../lib/email/template";
import { isAuthedRedirectPage } from "../lib/auth/redirects";

describe("auth redirects", () => {
  it("redirects signed-in users from the landing page", () => {
    assert.equal(isAuthedRedirectPage("/"), true);
    assert.equal(isAuthedRedirectPage("/login"), true);
    assert.equal(isAuthedRedirectPage("/dashboard"), false);
  });
});

describe("email generation", () => {
  it("creates a visibly different template on regeneration", () => {
    const first = generateApplicationEmail(
      {
        applicantName: "Alex Mbarga",
        jobTitle: "Frontend Developer",
        companyName: "CVForge",
      },
      0
    );
    const second = generateApplicationEmail(
      {
        applicantName: "Alex Mbarga",
        jobTitle: "Frontend Developer",
        companyName: "CVForge",
      },
      1
    );

    assert.notEqual(first.content, second.content);
  });
});
