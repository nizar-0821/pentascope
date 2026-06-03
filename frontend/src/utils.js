export const SEV = {
  CRITICAL: { color: "#ff4d4f", bg: "rgba(255, 77, 79, 0.08)", border: "rgba(255, 77, 79, 0.3)" },
  HIGH: { color: "#faad14", bg: "rgba(250, 173, 20, 0.08)", border: "rgba(250, 173, 20, 0.3)" },
  MEDIUM: { color: "#fadb14", bg: "rgba(250, 219, 20, 0.08)", border: "rgba(250, 219, 20, 0.3)" },
  LOW: { color: "#52c41a", bg: "rgba(82, 196, 26, 0.08)", border: "rgba(82, 196, 26, 0.3)" },
};

export const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
