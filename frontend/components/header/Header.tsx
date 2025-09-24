"use client";

import { LogIn, Menu, Search, User, UserPlus } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Utensils } from "lucide-react";
import { useUserStore } from "@/store/user-store";

import Logo from "../Logo";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

const getUserInfo = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
    credentials: "include",
  });

  if (!res.ok) {
    console.error("Error fetching user info:", res.statusText);
    return null;
  }

  const { user } = await res.json();
  return user;
};

const userLogout = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`,
    {
      credentials: "include",
    },
  );
  if (!res.ok) {
    console.error("Error logging out:", res.statusText);
  }
  return await res.json();
};

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState<string>(initialSearch);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, setUser, clearUser } = useUserStore();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.length > 0) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLogout = async () => {
    try {
      await userLogout();
      clearUser();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await getUserInfo();
        console.log(user);
        setUser(user);
        return user;
      } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  return (
    <header className="bg-background sticky top-0 z-50 w-full border">
      <div className="mx-auto flex items-center justify-between gap-8 px-8 py-4 md:px-14">
        <Logo width={50} height={50} />

        {/* Search */}
        <form className="relative max-w-xl flex-1" onSubmit={handleSearch}>
          <Search className="absolute top-1/2 left-2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border w-full rounded-full border pl-10 focus-visible:ring-0"
          />
        </form>

        {/* Auth action */}
        {/* desktop */}
        <div className="hidden w-[250px] items-center justify-end gap-2 md:flex">
          {loading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : user ? (
            // Show user info when authenticated
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <User
                    size={30}
                    className="border-border rounded-full border"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-2">
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User size={20} />
                      <span>ข้อมูลส่วนตัว</span>
                    </Link>
                  </DropdownMenuItem>

                  {user?.role === "RestaurantOwner" ? (
                    <DropdownMenuItem>
                      <Link href="/profile" className="flex items-center gap-2">
                        <Utensils size={20} />
                        <span>ร้านค้าของฉัน</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem>
                      <Link
                        href="/restaurants/create"
                        className="flex items-center gap-2"
                      >
                        <Utensils size={20} />
                        <span>สร้างร้านค้า</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogIn size={20} />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            // Show login/register when not authenticated
            <>
              <Button variant="outline" className="rounded-full" asChild>
                <Link href="/register" className="flex items-center gap-2">
                  <UserPlus size={20} />
                  <span>สมัครสมาชิก</span>
                </Link>
              </Button>

              <Button className="rounded-full" asChild>
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn size={20} />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="md:hidden">
            <Menu size={20} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mt-5">
            {user ? (
              // Show user options when authenticated
              <>
                <DropdownMenuItem>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User
                      size={20}
                      className="border-border rounded-full border"
                    />
                    <span>ข้อมูลส่วนตัว</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {user?.role === "RestaurantOwner" ? (
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center gap-2">
                      <Utensils size={20} />
                      <span>ร้านค้าของฉัน</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>
                    <Link
                      href="/restaurants/create"
                      className="flex items-center gap-2"
                    >
                      <Utensils size={20} />
                      <span>สร้างร้านค้า</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogIn size={20} />
                  <span>ออกจากระบบ</span>
                </DropdownMenuItem>
              </>
            ) : (
              // Show login/register when not authenticated
              <>
                <DropdownMenuItem>
                  <Link href="/register" className="flex items-center gap-2">
                    <UserPlus size={20} />
                    <span>สมัครสมาชิก</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/login" className="flex items-center gap-2">
                    <LogIn size={20} />
                    <span>เข้าสู่ระบบ</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
export default Header;
