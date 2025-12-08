export interface AskOptions {
  sources: string[];
  question: string;
}

export interface AskResult {
  answer: string;
  stderr?: string;
}

export interface ChatOptions {
  sources: string[];
}
