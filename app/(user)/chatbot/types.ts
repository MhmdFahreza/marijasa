export type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  data?: any;
  image?: {
    base64: string;
    type: string;
    preview: string;
  };
};

export type ChatbotConfig = {
  welcomeMessages?: string[];
  autoReplyDelay?: number;
  supportHours?: {
    start: string;
    end: string;
    timezone: string;
  };
};

export type ImageUpload = {
  base64: string;
  type: string;
  preview: string;
  file: File;
};

export type VendorCard = {
  vendor_id: string;
  name: string;
  category: string;
  rating: number;
  review_count: number;
  service_areas: string[];
  specialties: string[];
  phone: string;
  avatar: string;
  description?: string;
};