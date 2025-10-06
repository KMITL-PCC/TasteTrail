import { useSearchParams } from "next/navigation";
import RestaurantcreateForm from "@/components/restaurants/RestaurantcreateForm";

export default function CreateRestaurantFormClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "info"; // 🔹 ค่าเริ่มต้น

  return <RestaurantcreateForm initialTab={tab} />;
}
