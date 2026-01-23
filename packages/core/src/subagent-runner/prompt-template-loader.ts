import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import defaultTemplatePath from "./default_prompt_template.md";

export interface PromptTemplateLoader {
  load(): Promise<string>;
}

export class FilePromptTemplateLoader implements PromptTemplateLoader {
  private readonly templatePath: string;

  constructor(configDirectory: string) {
    this.templatePath = join(configDirectory, "prompt_template.md");
  }

  async load(): Promise<string> {
    const file = Bun.file(this.templatePath);

    if (!(await file.exists())) {
      await this.createDefaultTemplate();
    }

    const template = await Bun.file(this.templatePath).text();
    this.validate(template);
    return template;
  }

  private async createDefaultTemplate(): Promise<void> {
    const dir = dirname(this.templatePath);
    await mkdir(dir, { recursive: true });
    const defaultTemplate = await Bun.file(defaultTemplatePath).text();
    await Bun.write(this.templatePath, defaultTemplate);
  }

  private validate(template: string): void {
    const requiredPlaceholders = ["${sourcesList}", "${question}"];
    for (const placeholder of requiredPlaceholders) {
      if (!template.includes(placeholder)) {
        throw new Error(
          `Invalid prompt template: missing required placeholder ${placeholder}`,
        );
      }
    }
  }
}
