export interface Theme {
    name: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  }
  
  export const themes: Theme[] = [
    {
      name: "Default",
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        background: "#ffffff",
        text: "#1f2937",
      },
      fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif",
      },
    },
    {
      name: "Dark",
      colors: {
        primary: "#60a5fa",
        secondary: "#34d399",
        background: "#111827",
        text: "#f3f4f6",
      },
      fonts: {
        heading: "Poppins, sans-serif",
        body: "Roboto, sans-serif",
      },
    },
    {
      name: "Elegant",
      colors: {
        primary: "#8b5cf6",
        secondary: "#ec4899",
        background: "#fffbeb",
        text: "#1e293b",
      },
      fonts: {
        heading: "Playfair Display, serif",
        body: "Merriweather, serif",
      },
    },
  ];
  
  