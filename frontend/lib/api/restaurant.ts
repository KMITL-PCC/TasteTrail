export const getRestaurantById = async (id: string) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/restaurant/get/${id}`,
      {
        credentials: "include",
      },
    );
    if (!res.ok) {
      throw new Error("Failed to fetch restaurant" + res.status);
    }
    return res.json();
  } catch (error) {
    throw new Error("Failed to fetch restaurant" + error);
  }
};
