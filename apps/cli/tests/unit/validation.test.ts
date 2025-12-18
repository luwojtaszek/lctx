import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  validateDirectoryPath,
  validateDocsUrl,
  validateFilePath,
  validateGitUrl,
  validateRequired,
  validateSourceName,
} from "../../src/components/validation.js";

describe("validateGitUrl", () => {
  test("accepts HTTPS GitHub URL", () => {
    expect(validateGitUrl("https://github.com/user/repo")).toBeNull();
  });

  test("accepts HTTPS GitLab URL", () => {
    expect(validateGitUrl("https://gitlab.com/user/repo")).toBeNull();
  });

  test("accepts HTTPS self-hosted URL", () => {
    expect(validateGitUrl("https://git.example.com/user/repo")).toBeNull();
  });

  test("accepts SSH GitHub URL", () => {
    expect(validateGitUrl("git@github.com:user/repo")).toBeNull();
  });

  test("accepts SSH GitLab URL", () => {
    expect(validateGitUrl("git@gitlab.com:user/repo.git")).toBeNull();
  });

  test("accepts SSH with ssh:// prefix", () => {
    expect(validateGitUrl("ssh://git@github.com/user/repo")).toBeNull();
  });

  test("rejects empty URL", () => {
    expect(validateGitUrl("")).toBe("URL is required");
  });

  test("rejects whitespace-only URL", () => {
    expect(validateGitUrl("   ")).toBe("URL is required");
  });

  test("rejects HTTP URL", () => {
    expect(validateGitUrl("http://github.com/user/repo")).toBe(
      "Invalid git URL. Use HTTPS (https://host/repo) or SSH (git@host:repo)",
    );
  });

  test("rejects invalid format", () => {
    expect(validateGitUrl("not-a-url")).toBe(
      "Invalid git URL. Use HTTPS (https://host/repo) or SSH (git@host:repo)",
    );
  });
});

describe("validateDocsUrl", () => {
  test("accepts HTTPS URL", () => {
    expect(validateDocsUrl("https://example.com/docs")).toBeNull();
  });

  test("accepts HTTP URL", () => {
    expect(validateDocsUrl("http://example.com/docs")).toBeNull();
  });

  test("accepts URL with path", () => {
    expect(validateDocsUrl("https://bun.sh/llms.txt")).toBeNull();
  });

  test("rejects empty URL", () => {
    expect(validateDocsUrl("")).toBe("URL is required");
  });

  test("rejects FTP URL", () => {
    expect(validateDocsUrl("ftp://example.com/docs")).toBe(
      "URL must use HTTP or HTTPS",
    );
  });

  test("rejects invalid URL", () => {
    expect(validateDocsUrl("not-a-url")).toBe("Invalid URL format");
  });
});

describe("validateFilePath", () => {
  const testDir = join(tmpdir(), `lctx-test-${Date.now()}`);
  const testFile = join(testDir, "test.txt");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, "test content");
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("accepts existing file", () => {
    expect(validateFilePath(testFile)).toBeNull();
  });

  test("rejects empty path", () => {
    expect(validateFilePath("")).toBe("Path is required");
  });

  test("rejects non-existent file", () => {
    expect(validateFilePath("/nonexistent/file.txt")).toBe(
      "File does not exist",
    );
  });

  test("rejects directory as file", () => {
    expect(validateFilePath(testDir)).toBe("Path is not a file");
  });
});

describe("validateDirectoryPath", () => {
  const testDir = join(tmpdir(), `lctx-test-dir-${Date.now()}`);
  const testFile = join(testDir, "test.txt");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, "test content");
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("accepts existing directory", () => {
    expect(validateDirectoryPath(testDir)).toBeNull();
  });

  test("rejects empty path", () => {
    expect(validateDirectoryPath("")).toBe("Path is required");
  });

  test("rejects non-existent directory", () => {
    expect(validateDirectoryPath("/nonexistent/dir")).toBe(
      "Directory does not exist",
    );
  });

  test("rejects file as directory", () => {
    expect(validateDirectoryPath(testFile)).toBe("Path is not a directory");
  });
});

describe("validateRequired", () => {
  test("accepts non-empty string", () => {
    expect(validateRequired("value")).toBeNull();
  });

  test("rejects empty string", () => {
    expect(validateRequired("")).toBe("This field is required");
  });

  test("rejects whitespace-only string", () => {
    expect(validateRequired("   ")).toBe("This field is required");
  });
});

describe("validateSourceName", () => {
  test("accepts alphanumeric name", () => {
    expect(validateSourceName("mySource")).toBeNull();
  });

  test("accepts name with hyphens", () => {
    expect(validateSourceName("my-source")).toBeNull();
  });

  test("accepts name with underscores", () => {
    expect(validateSourceName("my_source")).toBeNull();
  });

  test("accepts mixed format", () => {
    expect(validateSourceName("my-Source_123")).toBeNull();
  });

  test("rejects empty name", () => {
    expect(validateSourceName("")).toBe("Name is required");
  });

  test("rejects name with spaces", () => {
    expect(validateSourceName("my source")).toBe(
      "Name can only contain letters, numbers, hyphens, and underscores",
    );
  });

  test("rejects name with special characters", () => {
    expect(validateSourceName("my@source")).toBe(
      "Name can only contain letters, numbers, hyphens, and underscores",
    );
  });
});
