export interface PDFTableCell {
  content: string;
  styles?: {
    fontStyle?: "bold" | "normal" | "italic";
    fillColor?: [number, number, number];
    halign?: "left" | "center" | "right";
    textColor?: number;
    cellPadding?: number;
    cellWidth?: number;
    minCellHeight?: number;
    font?: string;
  };
}

export type PDFTableRow = PDFTableCell[];
