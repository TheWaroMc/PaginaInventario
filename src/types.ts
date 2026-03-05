
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
}

export interface SavedLayout {
  id: string;
  name: string;
  slots: Record<number, string>;
  rows: number;
  timestamp: number;
}
