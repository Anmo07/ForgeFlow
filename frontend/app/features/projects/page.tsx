"use client";

import Link from "next/link";
import { BarChart3, Layers, CheckSquare, Users, Clock, Target, ArrowLeft } from "lucide-react";

const capabilities = [
  { title: "Kanban Boards", description: "Drag-and-drop task management across customizable columns. Move tasks through stages visually and keep your entire team aligned.", icon: Layers },
  { title: "Priority Levels", description: "Assign critical, high, medium, and low priority tags to every task. Filter and sort by priority to focus on what matters most.", icon: Target },
  { title: "Task Assignment", description: "Assign tasks to specific team members with clear ownership. Track who's working on what across all active projects.", icon: Users },
  { title: "Progress Tracking", description: "Monitor project completion percentages, task counts by status, and overall sprint velocity at a glance.", icon: CheckSquare },
  { title: "Billable Hours", description: "Log time directly against tasks. Hours automatically feed into the billing engine for T&M invoice generation.", icon: Clock },
  { title: "Project Analytics", description: "Dashboard views showing active project counts, task distribution, team utilization rates, and delivery timelines.", icon: BarChart3 },
];

export default function ProjectsFeaturePage() {
  return (
    <div className="dark:bg-gray-dark bg-white">
      <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-[80px]">
        <div className="container">
          <Link href="/features" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-body-color hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Features
          </Link>
          <div className="max-w-[700px]">
            <span className="mb-4 inline-block rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-500">
              Project Management
            </span>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-5xl">
              Kanban-Powered Project Management
            </h1>
            <p className="text-base text-body-color dark:text-body-color-dark sm:text-lg">
              Organize sprints, track billable hours, assign tasks, and monitor delivery — all from an intuitive drag-and-drop interface connected to your billing engine.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-20 lg:pb-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <div key={index} className="rounded-xl border border-body-color/10 bg-white p-7 shadow-one dark:border-white/10 dark:bg-gray-dark dark:shadow-gray-dark">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-black dark:text-white">{cap.title}</h3>
                  <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">{cap.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 p-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-black dark:text-white">Manage projects smarter, not harder</h2>
            <p className="mx-auto mb-6 max-w-md text-body-color dark:text-body-color-dark">Every task tracked, every hour billed, every project delivered on time.</p>
            <Link href="/register" className="rounded-sm bg-primary px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80">Get Started Free</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
