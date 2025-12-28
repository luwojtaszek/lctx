import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FilePromptTemplateLoader } from "../../../src";

describe("FilePromptTemplateLoader", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `lctx-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("load", () => {
    test("creates default template when file is missing", async () => {
      const loader = new FilePromptTemplateLoader(testDir);

      const template = await loader.load();

      // Verify template was created
      const templatePath = join(testDir, "prompt_template.md");
      expect(await Bun.file(templatePath).exists()).toBe(true);

      // Verify template content
      expect(template).toContain("${question}");
      expect(template).toContain("${sourcesList}");
      expect(template).toContain("# Question");
      expect(template).toContain("# Available Sources");
    });

    test("loads existing template from file", async () => {
      const customTemplate = `# Custom Template

Question: \${question}

Sources:
\${sourcesList}
`;
      const templatePath = join(testDir, "prompt_template.md");
      await Bun.write(templatePath, customTemplate);

      const loader = new FilePromptTemplateLoader(testDir);
      const template = await loader.load();

      expect(template).toBe(customTemplate);
    });

    test("throws error when template is missing required ${question} placeholder", async () => {
      const invalidTemplate = `# Template without question

Sources:
\${sourcesList}
`;
      const templatePath = join(testDir, "prompt_template.md");
      await Bun.write(templatePath, invalidTemplate);

      const loader = new FilePromptTemplateLoader(testDir);

      await expect(loader.load()).rejects.toThrow(
        "Invalid prompt template: missing required placeholder ${question}",
      );
    });

    test("throws error when template is missing required ${sourcesList} placeholder", async () => {
      const invalidTemplate = `# Template without sources

Question: \${question}
`;
      const templatePath = join(testDir, "prompt_template.md");
      await Bun.write(templatePath, invalidTemplate);

      const loader = new FilePromptTemplateLoader(testDir);

      await expect(loader.load()).rejects.toThrow(
        "Invalid prompt template: missing required placeholder ${sourcesList}",
      );
    });

    test("creates parent directories when they do not exist", async () => {
      const nestedDir = join(testDir, "nested", "config", "dir");
      const loader = new FilePromptTemplateLoader(nestedDir);

      const template = await loader.load();

      expect(template).toContain("${question}");
      expect(template).toContain("${sourcesList}");

      const templatePath = join(nestedDir, "prompt_template.md");
      expect(await Bun.file(templatePath).exists()).toBe(true);
    });
  });
});
