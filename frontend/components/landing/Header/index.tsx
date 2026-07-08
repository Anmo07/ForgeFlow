"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import menuData from "./menuData";
import { useAuthStore } from "@/store/auth";

const Header = () => {
  const { isAuthenticated } = useAuthStore();
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
    return () => window.removeEventListener("scroll", handleStickyNavbar);
  }, []);

  // submenu handler
  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  const usePathName = usePathname();

  return (
    <>
      <header
        className={`header left-0 top-0 z-40 flex w-full items-center transition-all duration-500 ${sticky
            ? "fixed z-[9999] bg-white/70 dark:bg-[#0b1220]/70 shadow-lg shadow-black/[0.04] dark:shadow-black/[0.2] backdrop-blur-xl border-b border-white/10 dark:border-white/[0.06] py-2"
            : "absolute bg-transparent py-4"
          }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4 xl:mr-12">
              <Link
                href="/"
                className="header-logo block w-full py-2"
              >
                <span className="text-2xl font-extrabold tracking-tight">
                  <span className="gradient-text">Forge</span>
                  <span className="text-foreground">Flow</span>
                </span>
              </Link>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="absolute right-4 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-[6px] ring-primary focus:ring-2 lg:hidden"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-foreground transition-all duration-300 ${navbarOpen ? " top-[7px] rotate-45" : " "
                      }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-foreground transition-all duration-300 ${navbarOpen ? "opacity-0 " : " "
                      }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-foreground transition-all duration-300 ${navbarOpen ? " top-[-8px] -rotate-45" : " "
                      }`}
                  />
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar absolute right-0 z-30 w-[250px] rounded-xl border border-border/50 bg-white/90 dark:bg-[#0b1220]/90 backdrop-blur-xl px-6 py-4 duration-300 lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:!backdrop-blur-none lg:p-0 lg:opacity-100 ${navbarOpen
                      ? "visibility top-full opacity-100"
                      : "invisible top-[120%] opacity-0"
                    }`}
                >
                  <ul className="block lg:flex lg:space-x-10">
                    {menuData.map((menuItem, index) => (
                      <li key={index} className="group relative">
                        {menuItem.path ? (
                          <Link
                            href={menuItem.path}
                            className={`relative flex py-2 text-base font-medium lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 transition-colors duration-300 ${usePathName === menuItem.path
                                ? "text-primary"
                                : "text-foreground/70 hover:text-primary"
                              }`}
                          >
                            {menuItem.title}
                            {usePathName === menuItem.path && (
                              <span className="absolute bottom-4 left-0 right-0 mx-auto h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-[#0ea5e9] lg:block hidden" />
                            )}
                          </Link>
                        ) : (
                          <>
                            <p
                              onClick={() => handleSubmenu(index)}
                              className="flex cursor-pointer items-center justify-between py-2 text-base text-foreground/70 group-hover:text-primary lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 transition-colors duration-300"
                            >
                              {menuItem.title}
                              <span className="pl-3">
                                <svg width="25" height="24" viewBox="0 0 25 24">
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M6.29289 8.8427C6.68342 8.45217 7.31658 8.45217 7.70711 8.8427L12 13.1356L16.2929 8.8427C16.6834 8.45217 17.3166 8.45217 17.7071 8.8427C18.0976 9.23322 18.0976 9.86639 17.7071 10.2569L12 15.964L6.29289 10.2569C5.90237 9.86639 5.90237 9.23322 6.29289 8.8427Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                            </p>
                            <div
                              className={`submenu relative left-0 top-full rounded-xl bg-white/90 dark:bg-[#0b1220]/90 backdrop-blur-xl transition-[top] duration-300 group-hover:opacity-100 lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[250px] lg:p-4 lg:opacity-0 lg:shadow-xl lg:shadow-black/[0.08] lg:border lg:border-border/40 lg:group-hover:visible lg:group-hover:top-full ${openIndex === index ? "block" : "hidden"
                                }`}
                            >
                              {menuItem.submenu?.map((submenuItem, index) => (
                                <Link
                                  href={submenuItem.path || "#"}
                                  key={index}
                                  className="block rounded-lg py-2.5 text-sm text-foreground/70 hover:text-primary hover:bg-primary/5 transition-colors lg:px-3"
                                >
                                  {submenuItem.title}
                                </Link>
                              ))}
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              <div className="flex items-center justify-end gap-3 pr-16 lg:pr-0">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="hidden rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 md:block"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="hidden px-5 py-2.5 text-sm font-semibold text-foreground/80 hover:text-primary transition-colors duration-300 md:block"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="hidden rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 md:block"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
                <div>
                  <ThemeToggler />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
