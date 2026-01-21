const API_URL = process.env.API_URL || "http://localhost:8000";

export async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Ignore JSON parsing errors
    }
    throw new Error(message);
  }

  return response.json();
}
