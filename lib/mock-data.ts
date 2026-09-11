import type { Batch, Domain, Person, Project } from "@/lib/types"

// Fixed demo identities used by the role switcher to simulate the three
// audiences from the PRD without building real accounts.
export const DEMO_USER_IDS = {
  student: "u-student",
  mentor: "u-mentor",
  coordinator: "u-coordinator",
} as const

// Roll numbers follow <admission year><6-digit serial>, e.g. "2024100041" —
// the prefix differs by the student's batch (2022/2023/2024 admission years).
export const seedPeople: Person[] = [
  { id: "u-student", name: "You (Student)", email: "you.student@pdm.edu", role: "student", rollNumber: "2024100041" },
  { id: "u-mentor", name: "You (Mentor)", email: "you.mentor@pdm.edu", role: "mentor" },
  { id: "u-coordinator", name: "You (Coordinator)", email: "you.coordinator@pdm.edu", role: "coordinator" },
  { id: "p-arjun", name: "Arjun Nair", email: "arjun.nair@pdm.edu", role: "student", rollNumber: "2024100042" },
  { id: "p-meera", name: "Meera Iyer", email: "meera.iyer@pdm.edu", role: "student", rollNumber: "2024100043" },
  { id: "p-devika", name: "Devika Pillai", email: "devika.pillai@pdm.edu", role: "student", rollNumber: "2023100044" },
  { id: "p-rohan", name: "Rohan Kulkarni", email: "rohan.kulkarni@pdm.edu", role: "student", rollNumber: "2024100045" },
  { id: "p-sana", name: "Sana Sheikh", email: "sana.sheikh@pdm.edu", role: "student", rollNumber: "2023100046" },
  { id: "p-kavita", name: "Dr. Kavita Sharma", email: "kavita.sharma@pdm.edu", role: "mentor" },
  { id: "p-vikram", name: "Prof. Vikram Desai", email: "vikram.desai@pdm.edu", role: "mentor" },
  { id: "p-anjali", name: "Anjali Menon", email: "anjali.menon@pdm.edu", role: "coordinator" },
]

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const seedBatches: Batch[] = [
  { id: "b-2024", label: "PDM 2022–2024", admissionYear: 2022, graduationYear: 2024, createdAt: daysAgo(400) },
  { id: "b-2025", label: "PDM 2023–2025", admissionYear: 2023, graduationYear: 2025, createdAt: daysAgo(220) },
  { id: "b-2026", label: "PDM 2024–2026", admissionYear: 2024, graduationYear: 2026, createdAt: daysAgo(40) },
]

export const seedDomains: Domain[] = [
  { id: "d-health", label: "Healthcare" },
  { id: "d-fintech", label: "Fintech" },
  { id: "d-edtech", label: "EdTech" },
  { id: "d-sustainability", label: "Sustainability" },
  { id: "d-mobility", label: "Mobility" },
]

export const seedProjects: Project[] = [
  {
    id: "proj-1",
    coverImage: "https://picsum.photos/seed/proj-1/300/300",
    title: "Smart Queue Management for Outpatient Clinics",
    description:
      "A queueing and notification system that reduces wait-room crowding at outpatient clinics.",
    teamMemberIds: ["u-student", "p-arjun"],
    batchId: "b-2026",
    mentorIds: ["p-kavita"],
    domainId: "d-health",
    status: "ongoing",
    problem:
      "Outpatient clinics rely on paper tokens, which causes crowding and unpredictable wait times for patients.",
    workOrOutcome:
      "Team has completed the patient-flow study and a clickable prototype of the check-in and notification flow.",
    materials: [
      { id: "m-1", label: "Problem research", url: "https://drive.google.com/example-research" },
      { id: "m-2", label: "Prototype (Figma)", url: "https://figma.com/example-prototype" },
    ],
    archived: false,
    createdBy: "u-student",
    createdAt: daysAgo(40),
    updatedBy: "u-student",
    updatedAt: daysAgo(3),
  },
  {
    id: "proj-2",
    coverImage: "https://picsum.photos/seed/proj-2/300/300",
    title: "Peer Lending Circles for Gig Workers",
    description:
      "A trust-based micro-lending model for gig workers without formal credit history.",
    teamMemberIds: ["p-meera", "p-rohan"],
    batchId: "b-2026",
    mentorIds: ["p-vikram"],
    domainId: "d-fintech",
    status: "ongoing",
    problem:
      "Gig workers are frequently denied credit because they lack a formal income record.",
    workOrOutcome: "",
    materials: [{ id: "m-3", label: "Repository", url: "https://github.com/example/peer-lending" }],
    archived: false,
    createdBy: "p-meera",
    createdAt: daysAgo(25),
    updatedBy: "p-meera",
    updatedAt: daysAgo(25),
  },
  {
    id: "proj-3",
    coverImage: "https://picsum.photos/seed/proj-3/300/300",
    title: "Adaptive Practice Sets for Remedial Math",
    description:
      "An adaptive worksheet generator that targets a student's specific remedial math gaps.",
    teamMemberIds: ["p-devika"],
    batchId: "b-2025",
    mentorIds: [],
    domainId: "d-edtech",
    status: "completed",
    problem:
      "Generic worksheets don't target the specific gaps a struggling student has, so practice time is wasted.",
    workOrOutcome:
      "Piloted with two after-school programmes; average error rate on target skills dropped by 22% over six weeks.",
    materials: [
      { id: "m-4", label: "Final report", url: "https://drive.google.com/example-final-report" },
    ],
    archived: false,
    createdBy: "p-devika",
    createdAt: daysAgo(220),
    updatedBy: "p-devika",
    updatedAt: daysAgo(60),
  },
  {
    id: "proj-4",
    coverImage: "https://picsum.photos/seed/proj-4/300/300",
    title: "Curbside E-Waste Pickup Scheduling",
    description:
      "A scheduling tool that lets residents book verified e-waste pickups from informal collectors.",
    teamMemberIds: ["p-sana"],
    batchId: "b-2025",
    mentorIds: ["p-kavita"],
    domainId: "d-sustainability",
    status: "completed",
    problem:
      "Residents don't know which e-waste collectors are legitimate, so devices end up in general trash.",
    workOrOutcome:
      "Outcome: matched 40 pilot households with verified collectors; report documents drop-off vs pickup behaviour.",
    materials: [],
    archived: false,
    createdBy: "p-sana",
    createdAt: daysAgo(300),
    updatedBy: "p-sana",
    updatedAt: daysAgo(140),
  },
  {
    id: "proj-5",
    coverImage: "https://picsum.photos/seed/proj-5/300/300",
    title: "Shared Cargo-Bike Routing for Last-Mile Delivery",
    description:
      "A routing layer that pools last-mile parcels across small vendors onto shared cargo-bike runs.",
    teamMemberIds: ["u-student", "p-rohan", "p-meera"],
    batchId: "b-2026",
    mentorIds: [],
    domainId: "d-mobility",
    status: "ongoing",
    problem: "",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-rohan",
    createdAt: daysAgo(10),
    updatedBy: "p-rohan",
    updatedAt: daysAgo(10),
  },
  {
    id: "proj-6",
    coverImage: "https://picsum.photos/seed/proj-6/300/300",
    title: "Smart Queueing System for Outpatient Departments",
    description:
      "An earlier take on clinic queueing, kept here to test duplicate detection against proj-1.",
    teamMemberIds: ["p-arjun"],
    batchId: "b-2025",
    mentorIds: [],
    domainId: "d-health",
    status: "completed",
    problem: "",
    workOrOutcome: "Superseded by a later team's version of the same idea.",
    materials: [],
    archived: false,
    createdBy: "p-arjun",
    createdAt: daysAgo(400),
    updatedBy: "p-arjun",
    updatedAt: daysAgo(400),
  },
]
