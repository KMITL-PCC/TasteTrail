"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const ProfileTabs = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "default";
  const [activeTab, setActiveTab] = useState(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  return <div>Current tab: {activeTab}</div>;
};

export default ProfileTabs;
