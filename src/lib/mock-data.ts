import type { Submission } from "./types";

const now = new Date();
const hours = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();
const ago = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "DOC-2025-001",
    token: "mock-secure-token",
    clientCompany: "Al Noor Trading LLC",
    contactPerson: "Ahmed Al Mansouri",
    email: "ahmed@alnoortrading.ae",
    phone: "+971 4 330 8000",
    status: "pending",
    createdAt: ago(1),
    expiresAt: hours(1),
  },
  {
    id: "DOC-2025-002",
    token: "k7m2p9x4n8q1w5e3",
    clientCompany: "Gulf Star Industries",
    contactPerson: "Fatima Hassan",
    email: "f.hassan@gulfstar.ae",
    phone: "+971 2 555 1200",
    status: "opened",
    createdAt: ago(3),
    expiresAt: hours(0.5),
    openedAt: ago(2),
  },
  {
    id: "DOC-2025-003",
    token: "r3t8y2u6i9o1p4a7",
    clientCompany: "Emirates Logistics FZE",
    contactPerson: "Rajesh Kumar",
    email: "rajesh@emirateslogistics.ae",
    status: "submitted",
    createdAt: ago(48),
    expiresAt: ago(46),
    openedAt: ago(47),
    submittedAt: ago(46),
    formData: undefined,
  },
  {
    id: "DOC-2025-004",
    token: "z5x1c8v2b9n4m7k3",
    clientCompany: "Desert Bloom Contracting",
    contactPerson: "Omar Khalil",
    email: "omar@desertbloom.ae",
    status: "expired",
    createdAt: ago(72),
    expiresAt: ago(70),
  },
  {
    id: "DOC-2025-005",
    token: "h4j6l8p0q2s4u6w8",
    clientCompany: "Skyline Properties LLC",
    contactPerson: "Layla Ibrahim",
    email: "layla@skylineproperties.ae",
    phone: "+971 50 123 4567",
    status: "opened",
    createdAt: ago(0.5),
    expiresAt: hours(1.5),
    openedAt: ago(0.3),
  },
];
