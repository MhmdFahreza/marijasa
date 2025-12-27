export type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
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