"use client";

import React, { useState, Suspense } from "react";
import {
  Menu,
  Minus,
  Plus,
  RotateCw,
  LayoutGrid,
  Download,
  Printer,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import { useSearchParams } from "next/navigation";

function InvoiceViewerContent() {
  const searchParams = useSearchParams();
  const invNum = searchParams.get("num") || "INV-2026-008";
  const issueDate = searchParams.get("issue") || "2026-07-22";
  const dueDate = searchParams.get("due") || "2026-07-29";
  const status = searchParams.get("status") || "DRAFT";
  const clientName = searchParams.get("client") || "Acme Digital";
  const totalParam = searchParams.get("total");

  const totalVal = totalParam ? parseFloat(totalParam) : 420.0;
  const subtotalVal = totalVal > 20 ? totalVal - 20 : 400.0;
  const taxVal = totalVal - subtotalVal;

  const [zoomLevel, setZoomLevel] = useState(84);
  const [rotation, setRotation] = useState(0);

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(50, prev - 10));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(150, prev + 10));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#323639] text-gray-200 flex flex-col font-sans select-none overflow-x-hidden">
      {/* PDF Viewer Dark Top Toolbar */}
      <header className="h-12 bg-[#323639] border-b border-black/40 px-4 flex items-center justify-between text-xs shrink-0 z-20">
        {/* Left: Menu & Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            title="Back to Invoices"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <button className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white">
            <Menu className="size-4" />
          </button>
          <span className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
            ForgeFlow
          </span>
        </div>

        {/* Center: PDF Page & Zoom Toolbar Controls */}
        <div className="flex items-center gap-3 bg-[#2a2e33] px-3 py-1 rounded-md border border-white/10">
          <span className="text-gray-300 text-[11px]">Page 1 / 1</span>
          <span className="h-3 w-px bg-white/20" />
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="font-mono font-medium text-xs text-white min-w-[36px] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <Plus className="size-3.5" />
          </button>
          <span className="h-3 w-px bg-white/20" />
          <button
            className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="View Mode"
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Rotate Clockwise"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>

        {/* Right: Actions (Download, Print, Overflow) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Download PDF"
          >
            <Download className="size-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Print Document"
          >
            <Printer className="size-4" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="More Options"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Body Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnail Drawer Panel */}
        <aside className="w-48 bg-[#323639] border-r border-black/40 p-4 hidden md:flex flex-col items-center gap-3 shrink-0">
          <div className="border-2 border-blue-500 rounded p-1 bg-white shadow-lg cursor-pointer transform hover:scale-105 transition-transform w-28">
            <div className="scale-[0.18] origin-top-left w-[500px] h-[700px] bg-white pointer-events-none overflow-hidden p-4">
              <InvoiceDocument
                invoiceNumber={invNum}
                issueDate={issueDate}
                dueDate={dueDate}
                status={status}
                clientName={clientName}
                subtotal={subtotalVal}
                taxAmount={taxVal}
                total={totalVal}
              />
            </div>
          </div>
          <span className="text-xs text-gray-400 font-semibold">1</span>
        </aside>

        {/* Center PDF Render Viewport */}
        <main className="flex-1 bg-[#525659] p-4 md:p-8 overflow-y-auto flex justify-center items-start min-h-[calc(100vh-48px)]">
          <div
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="my-4"
          >
            <InvoiceDocument
              invoiceNumber={invNum}
              issueDate={issueDate}
              dueDate={dueDate}
              status={status}
              clientName={clientName}
              subtotal={subtotalVal}
              taxAmount={taxVal}
              total={totalVal}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function InvoiceViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#323639] flex items-center justify-center text-white text-sm">Loading PDF Viewer...</div>}>
      <InvoiceViewerContent />
    </Suspense>
  );
}
