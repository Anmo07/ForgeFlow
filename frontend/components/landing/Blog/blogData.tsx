import { Blog } from "@/types/blog";

const blogData: Blog[] = [
  {
    id: 1,
    title: "How MSPs Can Automate 80% of Their Billing Workflow",
    paragraph:
      "Discover how ForgeFlow's billing engine handles retainers, per-seat licensing, and T&M contracts automatically — eliminating manual invoice creation.",
    image: "/images/blog/blog-placeholder-1.jpg",
    author: {
      name: "ForgeFlow Team",
      image: "/images/blog/author-placeholder.jpg",
      designation: "Product Engineering",
    },
    tags: ["billing"],
    publishDate: "2026",
  },
  {
    id: 2,
    title: "Building a Zero-Trust MSP Platform with Cloudflare Tunnel",
    paragraph:
      "Learn how ForgeFlow leverages Cloudflare Tunnel, Turnstile, and MFA to create an enterprise-grade security posture without exposing any ingress ports.",
    image: "/images/blog/blog-placeholder-2.jpg",
    author: {
      name: "ForgeFlow Team",
      image: "/images/blog/author-placeholder.jpg",
      designation: "Security Engineering",
    },
    tags: ["security"],
    publishDate: "2026",
  },
  {
    id: 3,
    title: "Multi-Tenant Architecture: Keeping Client Data Truly Isolated",
    paragraph:
      "A deep dive into ForgeFlow's ORM-level tenant isolation, field encryption, and how automatic SQLAlchemy event listeners prevent cross-tenant data leakage.",
    image: "/images/blog/blog-placeholder-3.jpg",
    author: {
      name: "ForgeFlow Team",
      image: "/images/blog/author-placeholder.jpg",
      designation: "Platform Engineering",
    },
    tags: ["architecture"],
    publishDate: "2026",
  },
];
export default blogData;
