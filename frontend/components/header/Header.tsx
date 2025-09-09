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
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Utensils } from "lucide-react";

import Logo from "../Logo";
import Link from "next/link";

interface User {
  role: string;
}

interface UserInfo {
  user: User;
}

const getUserInfo = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
};

const userLogout = async () => {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {
      credentials: "include",
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
};

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") || "";

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [search, setSearch] = useState<string>(initialSearch);

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

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userInfo = await getUserInfo();
      setUserInfo(userInfo);
    };
    fetchUserInfo();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border bg-background">
      <div className="flex items-center justify-between gap-8 px-8 py-4 mx-auto md:px-14">
        <Logo width={50} height={50} />

        {/* Search */}
        <form className="relative flex-1" onSubmit={handleSearch}>
          <Search className="absolute -translate-y-1/2 top-1/2 left-2" />
          <Input
            type="text"
            placeholder="Search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 border rounded-full border-border focus-visible:ring-0"
          />
        </form>

        {/* Auth action */}
        <Suspense fallback={<div>Loading...</div>}>
          {/* desktop */}
          <div className="items-center hidden gap-2 md:flex">
            {userInfo ? (
              // Show user info when authenticated
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <User
                      size={30}
                      className="border rounded-full border-border"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="mt-2">
                    <DropdownMenuItem>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User size={20} />
                        <span>ข้อมูลส่วนตัว</span>
                      </Link>
                    </DropdownMenuItem>

                    {userInfo?.user.role === "RestaurantOwner" ? (
                      <DropdownMenuItem>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2"
                        >
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
                      onClick={() => {
                        userLogout().then(() => {
                          setUserInfo(null);
                          router.push("/");
                        });
                      }}
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

          <DropdownMenu>
            <DropdownMenuTrigger className="md:hidden">
              <Menu size={20} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-5">
              {userInfo ? (
                // Show user options when authenticated
                <>
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User
                        size={20}
                        className="border rounded-full border-border"
                      />
                      <span>ข้อมูลส่วนตัว</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {userInfo?.user.role === "RestaurantOwner" ? (
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
                    onClick={() => {
                      userLogout().then(() => {
                        setUserInfo(null);
                        router.push("/");
                      });
                    }}
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
        </Suspense>
      </div>
    </header>
  );
};
export default Header;
