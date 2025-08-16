"use client";

import { cn } from "@/lib/utils";
import { UserButton } from "@stackframe/stack";
import { LucideIcon, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { buttonVariants } from "./ui/button";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";

function useSegment(basePath: string) {
  const path = usePathname();
  const result = path.slice(basePath.length, path.length);
  return result ? result : "/";
}

type Item = {
  name: React.ReactNode;
  href: string;
  icon: LucideIcon;
  type: "item";
  subItems?: SubItem[];
};

type SubItem = {
  name: React.ReactNode;
  href: string;
  icon: LucideIcon;
  type: "subitem";
};

type Sep = {
  type: "separator";
};

type Label = {
  name: React.ReactNode;
  type: "label";
};

export type SidebarItem = Item | Sep | Label;

function SubNavItem(props: {
  item: SubItem;
  onClick?: () => void;
  basePath: string;
}) {
  const segment = useSegment(props.basePath);
  const selected = segment === props.item.href;

  return (
    <Link
      href={props.basePath + props.item.href}
      className={cn(
        "flex items-center gap-3 px-6 py-2 mx-1 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
        selected 
          ? "bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-md shadow-blue-400/20" 
          : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 hover:shadow-sm",
        "w-full ml-4"
      )}
      onClick={props.onClick}
      prefetch={true}
    >
      <props.item.icon className={cn(
        "h-4 w-4 transition-all duration-200",
        selected ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
      )} />
      <span className="relative z-10">{props.item.name}</span>
    </Link>
  );
}

function NavItem(props: {
  item: Item;
  onClick?: () => void;
  basePath: string;
}) {
  const segment = useSegment(props.basePath);
  const selected = segment === props.item.href;
  const hasSubItems = props.item.subItems && props.item.subItems.length > 0;
  const hasSelectedSubItem = hasSubItems && props.item.subItems!.some(subItem => segment === subItem.href);
  
  // Only highlight parent if it's directly selected, not when sub-items are selected
  const shouldHighlightParent = selected && !hasSelectedSubItem;

  return (
    <div className="w-full">
      <Link
        href={props.basePath + props.item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
          shouldHighlightParent
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25" 
            : "text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:shadow-md",
          "w-full"
        )}
        onClick={props.onClick}
        prefetch={true}
      >
        <props.item.icon className={cn(
          "h-5 w-5 transition-all duration-200",
          shouldHighlightParent ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
        )} />
        <span className="relative z-10">{props.item.name}</span>
        {shouldHighlightParent && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10 rounded-xl" />
        )}
      </Link>
      
      {hasSubItems && (
        <div className="mt-1 space-y-1">
          {props.item.subItems!.map((subItem, index) => (
            <SubNavItem
              key={index}
              item={subItem}
              onClick={props.onClick}
              basePath={props.basePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent(props: {
  onNavigate?: () => void;
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  basePath: string;
}) {
  const path = usePathname();
  const segment = useSegment(props.basePath);

  return (
    <div className="flex flex-col h-full items-stretch bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 border-r border-slate-200/60 dark:border-slate-700/60">
      <div className="h-16 flex items-center px-4 shrink-0 mr-10 md:mr-0 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
        {props.sidebarTop}
      </div>
      <div className="flex flex-grow flex-col gap-1 pt-6 px-3 overflow-y-auto">
        {props.items.map((item, index) => {
          if (item.type === "separator") {
            return <Separator key={index} className="my-4 bg-slate-200/60 dark:bg-slate-700/60" />;
          } else if (item.type === "item") {
            return (
              <NavItem
                key={index}
                item={item}
                onClick={props.onNavigate}
                basePath={props.basePath}
              />
            );
          } else {
            return (
              <div key={index} className="flex my-3">
                <div className="flex-grow justify-start text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 uppercase tracking-wider">
                  {item.name}
                </div>
              </div>
            );
          }
        })}

        <div className="flex-grow" />
      </div>
    </div>
  );
}

export type HeaderBreadcrumbItem = { title: string; href: string };

function HeaderBreadcrumb(props: { items: SidebarItem[], baseBreadcrumb?: HeaderBreadcrumbItem[], basePath: string }) {
  const segment = useSegment(props.basePath);
  console.log(segment)
  const item = props.items.find((item) => item.type === 'item' && item.href === segment);
  const title: string | undefined = (item as any)?.name

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {props.baseBreadcrumb?.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}

        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function SidebarLayout(props: {
  children?: React.ReactNode;
  baseBreadcrumb?: HeaderBreadcrumbItem[];
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  basePath: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="w-full flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex-col w-[260px] h-screen sticky top-0 hidden md:flex">
        <SidebarContent items={props.items} sidebarTop={props.sidebarTop} basePath={props.basePath} />
      </div>
      <div className="flex flex-col flex-grow w-0">
        <div className="h-16 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 px-4 md:px-6 shadow-sm">
          <div className="hidden md:flex">
            <HeaderBreadcrumb baseBreadcrumb={props.baseBreadcrumb} basePath={props.basePath} items={props.items} />
          </div>

          <div className="flex md:hidden items-center">
            <Sheet
              onOpenChange={(open) => setSidebarOpen(open)}
              open={sidebarOpen}
            >
              <SheetTrigger>
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SidebarContent
                  onNavigate={() => setSidebarOpen(false)}
                  items={props.items}
                  sidebarTop={props.sidebarTop}
                  basePath={props.basePath}
                />
              </SheetContent>
            </Sheet>

            <div className="ml-4 flex md:hidden">
              <HeaderBreadcrumb baseBreadcrumb={props.baseBreadcrumb} basePath={props.basePath} items={props.items} />
            </div>
          </div>

          <UserButton
            colorModeToggle={() =>
              setTheme(resolvedTheme === "light" ? "dark" : "light")
            }
          />
        </div>
        <div className="flex-grow">{props.children}</div>
      </div>
    </div>
  );
}
