"use client";

import Link from "next/link";
import { DollarSign, RefreshCw, FileText, CreditCard, Clock, BarChart3, ArrowLeft } from "lucide-react";

const capabilities = [
  { title: "Dynamic Retainers", description: "Automated fixed-monthly billing contracts. Set it once, and ForgeFlow generates invoices on schedule without manual intervention.", icon: RefreshCw },
  { title: "Per-Seat Subscriptions", description: "Dynamic counts of active client contacts mapped directly to monthly licensing fees. Seats auto-adjust as contacts are added or removed.", icon: DollarSign },
  { title: "Time & Materials", description: "Aggregate billable task logging from project boards feeds directly into automated billing runs. Every hour is captured and invoiced.", icon: Clock },
  { title: "PDF Invoice Generation", description: "Professional, branded invoices generated as PDF documents. Automatically include line items, tax calculations, and payment terms.", icon: FileText },
  { title: "Payment Tracking", description: "Register partial and full payments against invoices. Track collection progress with real-time dashboards showing outstanding and overdue balances.", icon: CreditCard },
  { title: "Financial Analytics", description: "Pipeline value, total billed, collected, outstanding, and overdue metrics at a glance. Make informed decisions about cash flow and revenue forecasting.", icon: BarChart3 },
];

export default function BillingFeaturePage() {
  return (
    <div className="dark:bg-gray-dark bg-white">
      <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-[80px]">
        <div className="container">
          <Link href="/features" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-body-color hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Features
          </Link>
          <div className="max-w-[700px]">
            <span className="mb-4 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-500">
              Billing Engine
            </span>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-5xl">
              Automated Billing for Every MSP Model
            </h1>
            <p className="text-base text-body-color dark:text-body-color-dark sm:text-lg">
              Whether you bill retainers, per-seat, or time & materials — ForgeFlow automates the entire cycle from contract to collected payment.
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
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-black dark:text-white">{cap.title}</h3>
                  <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">{cap.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 p-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-black dark:text-white">Stop billing manually</h2>
            <p className="mx-auto mb-6 max-w-md text-body-color dark:text-body-color-dark">Automate your entire billing workflow and never miss a billable hour again.</p>
            <Link href="/register" className="rounded-sm bg-primary px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80">Get Started Free</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
