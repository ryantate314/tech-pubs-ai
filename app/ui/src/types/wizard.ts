export interface Platform {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface Generation {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

export interface DocumentCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export type WizardStep = "platform" | "generation" | "category" | "results";
