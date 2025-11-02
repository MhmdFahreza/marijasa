export type CardDataItem = {
  category: string;
  title: string;
  src: string;
  text?: string;
  imageUrl?: string;
};

export const cardData: CardDataItem[] = [
  {
    category: "Tukang Listrik",
    title: "You can do more with AI.",
    src: "/tukanglistrik.jpg",
    text:
      "Keep a journal, quickly jot down a grocery list, and take amazing class notes.",
    // imageUrl: "https://assets.aceternity.com/macbook.png",
  },
  {
    category: "Tukang AC",
    title: "Enhance your productivity.",
    src: "/tukangac.jpg",
    text:
      "Organize your day, automate routine tasks, and focus on deep work.",
    // imageUrl: "https://assets.aceternity.com/macbook.png",
  },
  {
    category: "Tukang Pembersihan Rumah",
    title: "Launching the new Apple Vision Pro.",
    src: "/tukangbersih.jpg",
    text:
      "Immersive experience, new workflow, and better collaboration.",
    // imageUrl: "https://assets.aceternity.com/macbook.png",
  },
  {
    category: "Tukang Ledeng/Pipa",
    title: "Maps for your iPhone 15 Pro Max.",
    src: "/tukangledeng_pipa.jpg",
    text: "Navigate smarter with real-time data.",
    // imageUrl: "https://assets.aceternity.com/macbook.png",
  },
  {
    category: "Tukang Sedot WC",
    title: "Photography just got better.",
    src: "/tukangsedotwc.jpg",
    text: "Edit, share, and capture in one seamless flow.",
    // imageUrl: "https://assets.aceternity.com/macbook.png",
  },
  {
    category: "Tukang Kebun",
    title: "Hiring for a Staff Software Engineer",
    src: "/tukangkebun.jpg",
    text: "Join a high-impact, product-minded team.",
    // imageUrl: "https://assets.aceternity.com/macbook.png",
  },
  {
    category: "Tukang Mebel/Furnitur",
    title: "Hiring for a Staff Software Engineer",
    src: "/tukangmebel_furnitur.jpg",
    text: "Join a high-impact, product-minded team.",
    // imageUrl: "https://assets.aceternity.com/macbook.png",
  },
];
