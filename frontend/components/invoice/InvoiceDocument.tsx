"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InvoiceLineItemData {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount?: number;
}

export interface InvoiceDocumentProps {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  status?: string;
  clientName?: string;
  orgName?: string;
  lineItems?: InvoiceLineItemData[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
  className?: string;
}

export function InvoiceDocument({
  invoiceNumber = "INV-2026-008",
  issueDate = "2026-07-22",
  dueDate = "2026-07-29",
  status = "DRAFT",
  clientName = "Acme Digital",
  orgName = "Acme Digital Agency",
  lineItems = [
    { description: "test invoice", quantity: 20.0, unit_price: 20.0, amount: 400.0 },
  ],
  subtotal = 400.0,
  taxRate = 5.0,
  taxAmount = 20.0,
  total = 420.0,
  notes,
  className,
}: InvoiceDocumentProps) {
  const formattedIssueDate = issueDate ? issueDate.split("T")[0] : "2026-07-22";
  const formattedDueDate = dueDate ? dueDate.split("T")[0] : "2026-07-29";

  return (
    <div
      className={cn(
        "bg-white text-slate-900 shadow-2xl rounded-sm p-8 md:p-12 max-w-[800px] w-full border border-gray-200 font-sans text-left transition-all select-none",
        className
      )}
    >
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-200 pb-6 gap-6">
        {/* Left: Brand logo & Org Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              F
            </div>
            <span className="text-2xl font-black tracking-tight text-indigo-950 font-sans">
              FORGEFLOW
            </span>
          </div>
          <p className="font-bold text-sm text-slate-900">{orgName}</p>
          <p className="text-xs text-slate-600 font-medium">ForgeFlow.com</p>
          <p className="text-xs text-slate-600 font-medium">kenw.digitalagency.com</p>
          <p className="text-xs text-slate-600 font-medium">info@resflow.com</p>
        </div>

        {/* Right: TAX INVOICE Header & Metadata */}
        <div className="text-left md:text-right space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase mb-2">
            TAX INVOICE
          </h1>
          <p className="text-xs font-semibold text-slate-800">
            Invoice No: <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
          </p>
          <p className="text-xs text-slate-700">
            Issue Date: <span className="font-medium">{formattedIssueDate}</span>
          </p>
          <p className="text-xs text-slate-700">
            Due Date: <span className="font-medium">{formattedDueDate}</span>
          </p>
          <p className="text-xs text-slate-700">
            Status: <span className="font-bold uppercase tracking-wider text-slate-900">{status}</span>
          </p>
        </div>
      </div>

      {/* 2. ISSUED BY / BILLED TO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Issued By Card */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-xs space-y-1">
          <p className="font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-2">
            ISSUED BY
          </p>
          <p className="font-bold text-sm text-slate-900">ForgeFlow</p>
          <p className="text-xs text-slate-700 font-medium">{orgName}</p>
          <p className="text-xs text-slate-600">Forgeflow.com</p>
        </div>

        {/* Billed To (Client) Card */}
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-xs space-y-1">
          <p className="font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-2">
            BILLED TO (CLIENT)
          </p>
          <p className="font-bold text-sm text-slate-900">{clientName}</p>
          <p className="text-xs text-slate-700 font-medium">Acme Digital Agency</p>
          <p className="text-xs text-slate-600">Etrent incontined</p>
        </div>
      </div>

      {/* 3. LINE ITEMS TABLE */}
      <div className="my-6 rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-gray-100 text-slate-900 font-bold uppercase border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-4">Line Item</th>
              <th className="py-2.5 px-4 text-center">Qty</th>
              <th className="py-2.5 px-4 text-right">Price</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-slate-800 font-medium">
            {lineItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50">
                <td className="py-3 px-4 text-slate-900 font-semibold">{item.description}</td>
                <td className="py-3 px-4 text-center font-mono">{Number(item.quantity).toFixed(1)}</td>
                <td className="py-3 px-4 text-right font-mono">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  ${(item.amount ?? item.quantity * item.unit_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. TOTALS SECTION */}
      <div className="flex flex-col items-end space-y-2 my-6 text-xs text-slate-800">
        <div className="flex justify-between w-full max-w-[280px] font-medium">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between w-full max-w-[280px] font-medium">
          <span className="text-slate-600">Tax ({taxRate.toFixed(1)}%)</span>
          <span className="font-mono font-semibold">${taxAmount.toFixed(2)}</span>
        </div>

        {/* Soft Purple/Indigo Highlight Box */}
        <div className="bg-[#dbe2fe] rounded-md px-4 py-2.5 flex justify-between items-center w-full max-w-[300px] text-sm font-bold text-[#1e1b4b] shadow-xs mt-1">
          <span>Total Amount Due</span>
          <span className="font-mono text-base">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* 5. SEAL & SIGNATURE BLOCK */}
      <div className="grid grid-cols-2 gap-8 my-8 text-center items-center pt-4">
        {/* Left: Seal */}
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="relative size-16 rounded-full border-2 border-indigo-700/80 flex items-center justify-center p-1 bg-indigo-50/20">
            <div className="size-13 rounded-full border border-dashed border-indigo-700/70 flex items-center justify-center flex-col">
              <span className="text-[7px] font-black tracking-widest text-indigo-900 uppercase">
                FORGEFLOW
              </span>
              <span className="text-xs font-black text-indigo-800">F</span>
              <span className="text-[6px] font-extrabold text-indigo-700 uppercase">
                OFFICIAL
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-800 mt-1">Seal</span>
        </div>

        {/* Right: Signature */}
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <span className="font-serif italic font-extrabold text-xl text-slate-900 tracking-wide">
            Eleanor S. Montgomery
          </span>
          <span className="text-xs font-semibold text-slate-900">
            Eleanor S. Montgomery
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Signature
          </span>
        </div>
      </div>

      {/* 6. PAYMENT NOTES & INSTRUCTIONS */}
      <div className="space-y-2 border-t border-gray-100 pt-4 my-4 text-left">
        <p className="font-bold text-xs text-slate-900">Payment Notes & Instructions:</p>
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {notes || "This invoice is ceans comneted with te received and througns the ofmariroctor.\nPayment Notes & Instructions: Died the sead,"}
        </p>
        <p className="text-xs text-slate-700 leading-relaxed font-normal pt-1">
          Standard terms are clearly set out. Slean roms is continued in instruction approaching payments tunaked suminating pay sunt the seconds.
        </p>
      </div>

      {/* 7. FOOTER */}
      <div className="border-t border-gray-200 pt-4 mt-6 text-center text-[10px] font-medium text-slate-500">
        Generated by ForgeFlow Enterprise Billing System • Reference: {invoiceNumber} • Page 1 of 1
      </div>
    </div>
  );
}
