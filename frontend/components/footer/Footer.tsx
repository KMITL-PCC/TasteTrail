import Link from "next/link";
import Logo from "../Logo";

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
    <footer className="py-4 mt-8 border bg-background">
      <div className="max-w-5xl px-6 mx-auto">
        <div className="flex flex-col items-center justify-center gap-2 md:justify-between lg:flex-row lg:gap-12">
          <div className="flex items-center order-last gap-3 lg:order-first">
            <Logo width={50} height={50} />
            <span className="block text-sm text-center text-muted-foreground">
              © {new Date().getFullYear()} TasteTrail, All rights reserved
            </span>
          </div>

          <div className="flex flex-wrap order-first gap-x-6 gap-y-4">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="block duration-150 text-muted-foreground hover:text-primary"
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
