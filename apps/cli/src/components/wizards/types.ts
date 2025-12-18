import type { SourceType } from "@lctx/core";

export interface SourceData {
  type: SourceType;
  url?: string;
  path?: string;
  name: string;
  description: string;
  branch?: string;
}

export interface WizardProps {
  onComplete: (source: SourceData) => void;
  onCancel: () => void;
}
