// ========== STYLIST AUTH ==========
const STYLIST_CREDENTIALS = {
  email: "stylist@glowup.com",
  password: "password123",
  stylistId: "4", // matches an existing stylist (Glow Nails GH)
};

export const loginStylist = async (email: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  if (email === STYLIST_CREDENTIALS.email && password === STYLIST_CREDENTIALS.password) {
    localStorage.setItem("stylistAuth", JSON.stringify({ isAuthenticated: true, stylistId: STYLIST_CREDENTIALS.stylistId }));
    return { success: true, stylistId: STYLIST_CREDENTIALS.stylistId };
  }
  throw new Error("Invalid credentials");
};

export const logoutStylist = () => {
  localStorage.removeItem("stylistAuth");
};

export const isStylistAuthenticated = () => {
  const auth = localStorage.getItem("stylistAuth");
  if (!auth) return false;
  try {
    const { isAuthenticated } = JSON.parse(auth);
    return isAuthenticated === true;
  } catch {
    return false;
  }
};

export const getCurrentStylistId = (): string | null => {
  const auth = localStorage.getItem("stylistAuth");
  if (!auth) return null;
  try {
    const { stylistId } = JSON.parse(auth);
    return stylistId || null;
  } catch {
    return null;
  }
};

// ========== CONSUMER AUTH ==========
export interface ConsumerUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: "google" | "apple" | "facebook" | "email";
}

const CONSUMER_STORAGE_KEY = "glowup_consumer_user";

export const getCurrentConsumer = (): ConsumerUser | null => {
  try {
    const data = localStorage.getItem(CONSUMER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const isConsumerAuthenticated = (): boolean => {
  return getCurrentConsumer() !== null;
};

export const logoutConsumer = () => {
  localStorage.removeItem(CONSUMER_STORAGE_KEY);
};

// Mock social login
export const socialLogin = (provider: "google" | "apple" | "facebook"): Promise<ConsumerUser> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user: ConsumerUser = {
        id: `consumer_${provider}_${Date.now()}`,
        name: provider === "google" ? "Google User" : provider === "apple" ? "Apple User" : "Facebook User",
        email: `${provider}@example.com`,
        provider,
      };
      localStorage.setItem(CONSUMER_STORAGE_KEY, JSON.stringify(user));
      resolve(user);
    }, 600);
  });
};

// Email/password login (mock)
export const loginConsumer = (email: string, password: string): Promise<ConsumerUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password) {
        const user: ConsumerUser = {
          id: `consumer_email_${Date.now()}`,
          name: email.split("@")[0],
          email,
          provider: "email",
        };
        localStorage.setItem(CONSUMER_STORAGE_KEY, JSON.stringify(user));
        resolve(user);
      } else {
        reject(new Error("Invalid credentials"));
      }
    }, 500);
  });
};

// Signup (mock)
export const signupConsumer = (name: string, email: string, password: string): Promise<ConsumerUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (name && email && password) {
        const user: ConsumerUser = {
          id: `consumer_email_${Date.now()}`,
          name,
          email,
          provider: "email",
        };
        localStorage.setItem(CONSUMER_STORAGE_KEY, JSON.stringify(user));
        resolve(user);
      } else {
        reject(new Error("Missing fields"));
      }
    }, 500);
  });
};