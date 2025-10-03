import RestaurantEditForm from "@/components/restaurants/RestaurantEditForm";
import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import { getRestaurantById } from "../page";

const RestaurantEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const { restaurantInfo } = await getRestaurantById(id);

  return (
    <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-2 p-4 pt-2 md:p-8 md:pt-2">
      <BreadcrumbComponent restaurantName={restaurantInfo.name} />
      <RestaurantEditForm />
    </div>
  );
};

export default RestaurantEditPage;
