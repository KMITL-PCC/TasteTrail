import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import ProfileForm from "@/components/profile/ProfileForm";

const ProfilePage = () => {
  return (
    <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-2 p-4 pt-2 md:p-8 md:pt-2 xl:px-16">
      <BreadcrumbComponent />
      <ProfileForm />
    </div>
  );
};

export default ProfilePage;
