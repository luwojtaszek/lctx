import { describe, expect, mock, test } from "bun:test";
import { render } from "ink-testing-library";
import { MainMenu, type Screen } from "../../../src/components";

// Helper to wait for React state updates
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("MainMenu", () => {
  test("renders all menu items", () => {
    const onNavigate = mock((screen: Screen) => {});
    const { lastFrame } = render(
      <MainMenu version="1.0.0" onNavigate={onNavigate} />,
    );
    const frame = lastFrame();

    expect(frame).toContain("Sources");
    expect(frame).toContain("Ask");
    expect(frame).toContain("Help");
  });

  test("renders version", () => {
    const onNavigate = mock((screen: Screen) => {});
    const { lastFrame } = render(
      <MainMenu version="1.2.3" onNavigate={onNavigate} />,
    );
    const frame = lastFrame();

    expect(frame).toContain("1.2.3");
  });

  test("renders shortcut keys", () => {
    const onNavigate = mock((screen: Screen) => {});
    const { lastFrame } = render(
      <MainMenu version="1.0.0" onNavigate={onNavigate} />,
    );
    const frame = lastFrame();

    expect(frame).toContain("[s]");
    expect(frame).toContain("[a]");
    expect(frame).toContain("[h]");
  });

  test("selecting Sources calls onNavigate with sources", async () => {
    const onNavigate = mock((screen: Screen) => {});
    const { stdin } = render(
      <MainMenu version="1.0.0" onNavigate={onNavigate} />,
    );

    // Press enter to select first item (Sources)
    stdin.write("\r");
    await tick();

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("sources");
  });

  // Note: Arrow key navigation tests are covered by SelectInput unit tests.
  // MainMenu delegates to SelectInput, so we focus on integration via shortcuts.

  test("shortcut s triggers Sources navigation", async () => {
    const onNavigate = mock((screen: Screen) => {});
    const { stdin } = render(
      <MainMenu version="1.0.0" onNavigate={onNavigate} />,
    );

    stdin.write("s");
    await tick();

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("sources");
  });

  test("shortcut a triggers Ask navigation", async () => {
    const onNavigate = mock((screen: Screen) => {});
    const { stdin } = render(
      <MainMenu version="1.0.0" onNavigate={onNavigate} />,
    );

    stdin.write("a");
    await tick();

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("ask");
  });

  test("shortcut h triggers Help navigation", async () => {
    const onNavigate = mock((screen: Screen) => {});
    const { stdin } = render(
      <MainMenu version="1.0.0" onNavigate={onNavigate} />,
    );

    stdin.write("h");
    await tick();

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("help");
  });

  test("shortcuts are case insensitive", async () => {
    const onNavigate = mock((screen: Screen) => {});
    const { stdin } = render(
      <MainMenu version="1.0.0" onNavigate={onNavigate} />,
    );

    stdin.write("S"); // Uppercase S
    await tick();

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("sources");
  });
});
