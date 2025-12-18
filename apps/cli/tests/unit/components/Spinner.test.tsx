import { describe, expect, test } from "bun:test";
import { render } from "ink-testing-library";
import { Spinner } from "../../../src/components/shared/Spinner.js";

describe("Spinner", () => {
  test("renders spinner frame", () => {
    const { lastFrame } = render(<Spinner />);
    const frame = lastFrame();
    // Should contain one of the spinner frames
    expect(frame).toBeTruthy();
    expect(frame?.length ?? 0).toBeGreaterThan(0);
  });

  test("renders with label", () => {
    const { lastFrame } = render(<Spinner label="Loading..." />);
    expect(lastFrame()).toContain("Loading...");
  });

  test("renders label with space separator", () => {
    const { lastFrame } = render(<Spinner label="Processing" />);
    const frame = lastFrame();
    // Label should appear after a space
    expect(frame).toContain(" Processing");
  });
});
