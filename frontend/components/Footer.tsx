import Link from "next/link";
import Logo from "./Logo";

const links = [
  {
    title: "Restaurants",
    href: "/restaurants",
  },
  {
    title: "Terms",
    href: "/terms",
  },
  {
    title: "Privacy",
    href: "/privacy",
  },
  {
    title: "Contact",
    href: "https://github.com/KMITL-PCC/TasteTrail",
  },
];

export default function Footer() {
  return (
    <footer className="bg-background border py-4">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center justify-center gap-2 md:justify-between lg:flex-row lg:gap-12">
          <div className="order-last flex items-center gap-3 lg:order-first">
            <Logo width={50} height={50} />
            <span className="text-muted-foreground block text-center text-sm">
              © {new Date().getFullYear()} TasteTrail, All rights reserved
            </span>
          </div>

          <div className="order-first flex flex-wrap gap-x-6 gap-y-4">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-muted-foreground hover:text-primary block duration-150"
              >
                <span>{link.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
