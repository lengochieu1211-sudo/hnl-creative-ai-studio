// Multi-Page Design & Template Engine with Data Binding

import { CanvasSchema, CanvasElement } from "../types/canvas";
import { BrandKitSchema } from "../types/project";

export interface TemplateDefinition {
  id: string;
  name: string;
  category: "menu" | "catalogue" | "invitation" | "poster" | "social" | "brochure";
  width: number;
  height: number;
  previewUrl?: string;
  elements: Array<Partial<CanvasElement>>;
}

export const DESIGN_TEMPLATES: TemplateDefinition[] = [
  {
    id: "menu-luxury-restaurant",
    name: "Luxury Restaurant Menu",
    category: "menu",
    width: 1080,
    height: 1920,
    elements: [
      { id: "bg-shape", type: "shape", name: "Background Frame", x: 40, y: 40, width: 1000, height: 1840, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 0, isLocked: false, isVisible: true, shapeType: "rectangle", fill: "#0f172a", stroke: "#d97706", strokeWidth: 2, borderRadius: 16 },
      { id: "menu-title", type: "text", name: "Menu Title", x: 140, y: 120, width: 800, height: 100, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 1, isLocked: false, isVisible: true, content: "{{brand.name}} EXCLUSIVE MENU", fontSize: 48, fontFamily: "serif", fontWeight: "bold", color: "#fbbf24", textAlign: "center" },
      { id: "dish-1", type: "text", name: "Signature Dish 1", x: 100, y: 280, width: 600, height: 50, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 2, isLocked: false, isVisible: true, content: "1. Bò Wagyu Nướng Sốt Nấm Truffle", fontSize: 28, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      { id: "dish-1-price", type: "text", name: "Price 1", x: 750, y: 280, width: 230, height: 50, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 2, isLocked: false, isVisible: true, content: "850.000 đ", fontSize: 28, fontWeight: "bold", color: "#34d399", textAlign: "right" },
      { id: "dish-2", type: "text", name: "Signature Dish 2", x: 100, y: 380, width: 600, height: 50, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 2, isLocked: false, isVisible: true, content: "2. Tôm Hùm Nướng Bơ Tỏi Thượng Hạng", fontSize: 28, fontWeight: "bold", color: "#ffffff", textAlign: "left" },
      { id: "dish-2-price", type: "text", name: "Price 2", x: 750, y: 380, width: 230, height: 50, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 2, isLocked: false, isVisible: true, content: "1.250.000 đ", fontSize: 28, fontWeight: "bold", color: "#34d399", textAlign: "right" }
    ]
  },
  {
    id: "catalogue-grid-4",
    name: "Modern Product Catalogue (4-Grid)",
    category: "catalogue",
    width: 1200,
    height: 1600,
    elements: [
      { id: "cat-header", type: "text", name: "Catalogue Header", x: 80, y: 60, width: 1040, height: 80, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 1, isLocked: false, isVisible: true, content: "NEW COLLECTION CATALOGUE", fontSize: 42, fontWeight: "bold", color: "#0f172a", textAlign: "center" }
    ]
  },
  {
    id: "invitation-gold-event",
    name: "Golden VIP Event Invitation",
    category: "invitation",
    width: 1080,
    height: 1920,
    elements: [
      { id: "inv-title", type: "text", name: "Invitation Header", x: 100, y: 200, width: 880, height: 120, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 1, isLocked: false, isVisible: true, content: "TRỌNG THỂ KÍNH MỜI", fontSize: 48, fontFamily: "serif", fontWeight: "bold", color: "#d97706", textAlign: "center" },
      { id: "inv-body", type: "text", name: "Invitation Body", x: 120, y: 360, width: 840, height: 200, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex: 1, isLocked: false, isVisible: true, content: "Kính mời Quý Khách tới tham dự Lễ Khai Trương / Sự Kiện Đặc Biệt\nThời gian: 18:30 - Ngày 28/08/2026\nĐịa điểm: Grand Ballroom, TP. Hồ Chí Minh", fontSize: 26, lineHeight: 1.8, color: "#1e293b", textAlign: "center" }
    ]
  }
];

export class TemplateEngine {
  static applyDataBindings(canvas: CanvasSchema, data: { brand?: BrandKitSchema; [key: string]: any }): CanvasSchema {
    const updatedElements = canvas.elements.map((el) => {
      if (el.type === "text" && el.content) {
        let text = el.content;
        text = text.replace(/\{\{brand\.name\}\}/g, data.brand?.name || "HNL Studio");
        text = text.replace(/\{\{brand\.phone\}\}/g, data.brand?.phone || "");
        text = text.replace(/\{\{brand\.website\}\}/g, data.brand?.website || "");
        return { ...el, content: text };
      }
      return el;
    });
    return { ...canvas, elements: updatedElements };
  }
}
