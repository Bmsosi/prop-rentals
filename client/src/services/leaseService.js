export async function fetchAllLeases() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/leases`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch leases");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching leases:", error);
    return [];
  }
}
