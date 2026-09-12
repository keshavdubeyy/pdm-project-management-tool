import type { Batch, Domain, Person, Project, Team } from "@/lib/types"

// Real roster for the PDM 2025–2027 batch, sourced from the batch's project
// registration form. Each project's mentorIds reflects the mentor actually
// assigned to that team — a separate field on the form from the mentor the
// team preferred, which isn't tracked here.
export const seedPeople: Person[] = [
  {
    id: "p-mentor-prakash",
    name: "Prakash Yalla",
    email: "prakash.yalla@pdm.edu",
    roles: ["mentor"],
    affiliation: "Professor of Practice",
  },
  {
    id: "p-mentor-raman",
    name: "Dr. Raman Saxena",
    email: "raman.saxena@pdm.edu",
    // Listed on the programme site as "Professor & Program Coordinator", so
    // this person holds both roles and switches between them.
    roles: ["mentor", "coordinator"],
    affiliation: "Professor · Programme Coordinator",
  },
  {
    id: "p-mentor-raghu",
    name: "Dr. Raghu Reddy",
    email: "raghu.reddy@pdm.edu",
    roles: ["mentor"],
    affiliation: "Associate Professor, SERC",
  },
  {
    id: "p-mentor-ramesh",
    name: "Ramesh Loganathan",
    email: "ramesh.loganathan@pdm.edu",
    roles: ["mentor"],
    affiliation: "Professor of Practice, Co-innovations",
  },
  {
    id: "p-2024204015",
    name: "Yerrabachu Keerthy Rao",
    email: "2024204015@pdm.edu",
    roles: ["student"],
    rollNumber: "2024204015",
  },
  {
    id: "p-2025204001",
    name: "Kalluri Lakshmi Prathyusha",
    email: "2025204001@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204001",
  },
  {
    id: "p-2025204002",
    name: "Sanapathi Kishore Naidu",
    email: "2025204002@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204002",
  },
  {
    id: "p-2025204003",
    name: "Nagam Chandrakanth Reddy",
    email: "2025204003@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204003",
  },
  {
    id: "p-2025204004",
    name: "Rahul Saha",
    email: "2025204004@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204004",
  },
  {
    id: "p-2025204005",
    name: "Dhawal Pawanarkar",
    email: "2025204005@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204005",
  },
  {
    id: "p-2025204006",
    name: "Shada Praneeth Reddy",
    email: "2025204006@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204006",
  },
  {
    id: "p-2025204007",
    name: "Devansh Singh",
    email: "2025204007@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204007",
  },
  {
    id: "p-2025204008",
    name: "Mohd Shahid Kaleem",
    email: "2025204008@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204008",
  },
  {
    id: "p-2025204009",
    name: "Ekansh Patidar",
    email: "2025204009@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204009",
  },
  {
    id: "p-2025204010",
    name: "Kushal Karan",
    email: "2025204010@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204010",
  },
  {
    id: "p-2025204011",
    name: "Harsh Jaiswal",
    email: "2025204011@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204011",
  },
  {
    id: "p-2025204012",
    name: "Vadali SS Bharadwaja",
    email: "2025204012@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204012",
  },
  {
    id: "p-2025204013",
    name: "Patil Varun Nitin",
    email: "2025204013@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204013",
  },
  {
    id: "p-2025204014",
    name: "Gaurav Goswami",
    email: "2025204014@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204014",
  },
  {
    id: "p-2025204015",
    name: "Anjali Yadav",
    email: "2025204015@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204015",
  },
  {
    id: "p-2025204016",
    name: "Prakash Bhabad",
    email: "2025204016@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204016",
  },
  {
    id: "p-2025204017",
    name: "Anukriti Gongle",
    email: "2025204017@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204017",
  },
  {
    id: "p-2025204018",
    name: "Anil Kumar",
    email: "2025204018@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204018",
  },
  {
    id: "p-2025204019",
    name: "K Lakshmi Sai Aasritha",
    email: "2025204019@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204019",
  },
  {
    id: "p-2025204020",
    name: "V Venkata Raghava Sai Srividya",
    email: "2025204020@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204020",
  },
  {
    id: "p-2025204021",
    name: "P. Sai Harsha Vardhan",
    email: "2025204021@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204021",
  },
  {
    id: "p-2025204022",
    name: "Paila Tejeswara Rao",
    email: "2025204022@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204022",
  },
  {
    id: "p-2025204023",
    name: "Panem Chaitanya Pavan Kumar",
    email: "2025204023@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204023",
  },
  {
    id: "p-2025204024",
    name: "Manali Gupta",
    email: "2025204024@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204024",
  },
  {
    id: "p-2025204025",
    name: "Rishabh singh",
    email: "2025204025@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204025",
  },
  {
    id: "p-2025204026",
    name: "Kedar Dalvi",
    email: "2025204026@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204026",
  },
  {
    id: "p-2025204027",
    name: "Kaushal Negi",
    email: "2025204027@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204027",
  },
  {
    id: "p-2025204028",
    name: "Vinit Jain",
    email: "2025204028@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204028",
  },
  {
    id: "p-2025204029",
    name: "Snigdha Pani",
    email: "2025204029@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204029",
  },
  {
    id: "p-2025204030",
    name: "Eshwar Prasad Pingili",
    email: "2025204030@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204030",
  },
  {
    id: "p-2025204031",
    name: "Neha Susan Manoj",
    email: "2025204031@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204031",
  },
  {
    id: "p-2025204033",
    name: "Deepti Koranga",
    email: "2025204033@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204033",
  },
  {
    id: "p-2025204034",
    name: "Metta Venkata Ramana Murthy",
    email: "2025204034@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204034",
  },
  {
    id: "p-2025204035",
    name: "Bhumika Mehndiratta",
    email: "2025204035@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204035",
  },
  {
    id: "p-2025204036",
    name: "Gargi Saini",
    email: "2025204036@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204036",
  },
  {
    id: "p-2025204037",
    name: "Rahul chand",
    email: "2025204037@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204037",
  },
  {
    id: "p-2025204039",
    name: "Samir Saurabh",
    email: "2025204039@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204039",
  },
  {
    id: "p-2025204040",
    name: "Peri Sri Charan",
    email: "2025204040@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204040",
  },
  {
    id: "p-2025204041",
    name: "Keshav Dubey",
    email: "2025204041@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204041",
  },
  {
    id: "p-2025204042",
    name: "Abhinav Borah",
    email: "2025204042@pdm.edu",
    roles: ["student"],
    rollNumber: "2025204042",
  },
]

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const seedBatches: Batch[] = [
  {
    id: "b-2025-2027",
    label: "PDM 2025–2027",
    admissionYear: 2025,
    graduationYear: 2027,
    // Week 1 of the final project. Every due date derives from this date.
    startDate: "2026-08-03",
    description: "Semester 3 and 4 final project. 22 teams, 4 mentoring lines.",
    archived: false,
    createdAt: daysAgo(60),
  },
]

export const seedDomains: Domain[] = [
  { id: "d-health", label: "Healthcare" },
  { id: "d-fintech", label: "Fintech" },
  { id: "d-edtech", label: "EdTech" },
  { id: "d-sustainability", label: "Sustainability" },
  { id: "d-mobility", label: "Mobility" },
]

// Project ideas as submitted on the registration form. Both potential ideas
// each team pitched are kept in full under `problem`, since the form does
// not record which one was ultimately finalized with the mentor.
/** Teams derived from the batch's project registration form. A team name
 * is the members' surnames; none of the teams named themselves. */
export const seedTeams: Team[] = [
  {
    id: "team-1",
    batchId: "b-2025-2027",
    name: "Nitin & Kaleem",
    memberIds: ["p-2025204013", "p-2025204008"],
    leadId: "p-2025204013",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-2",
    batchId: "b-2025-2027",
    name: "Dalvi & Jain",
    memberIds: ["p-2025204026", "p-2025204028"],
    leadId: "p-2025204026",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-3",
    batchId: "b-2025-2027",
    name: "Dubey & Aasritha",
    memberIds: ["p-2025204041", "p-2025204019"],
    leadId: "p-2025204041",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-4",
    batchId: "b-2025-2027",
    name: "chand & singh",
    memberIds: ["p-2025204037", "p-2025204025"],
    leadId: "p-2025204037",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-5",
    batchId: "b-2025-2027",
    name: "Gupta & Rao",
    memberIds: ["p-2025204024", "p-2024204015"],
    leadId: "p-2025204024",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-6",
    batchId: "b-2025-2027",
    name: "Pingili & Negi",
    memberIds: ["p-2025204030", "p-2025204027"],
    leadId: "p-2025204030",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-7",
    batchId: "b-2025-2027",
    name: "Reddy & Reddy",
    memberIds: ["p-2025204006", "p-2025204003"],
    leadId: "p-2025204006",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-8",
    batchId: "b-2025-2027",
    name: "Bharadwaja & Naidu",
    memberIds: ["p-2025204012", "p-2025204002"],
    leadId: "p-2025204012",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-9",
    batchId: "b-2025-2027",
    name: "Gongle & Pani",
    memberIds: ["p-2025204017", "p-2025204029"],
    leadId: "p-2025204017",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-10",
    batchId: "b-2025-2027",
    name: "Mehndiratta & Goswami",
    memberIds: ["p-2025204035", "p-2025204014"],
    leadId: "p-2025204035",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-11",
    batchId: "b-2025-2027",
    name: "Srividya",
    memberIds: ["p-2025204020"],
    leadId: "p-2025204020",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-12",
    batchId: "b-2025-2027",
    name: "Rao & Vardhan",
    memberIds: ["p-2025204022", "p-2025204021"],
    leadId: "p-2025204022",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-13",
    batchId: "b-2025-2027",
    name: "Saha & Jaiswal",
    memberIds: ["p-2025204004", "p-2025204011"],
    leadId: "p-2025204004",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-14",
    batchId: "b-2025-2027",
    name: "Borah & Singh",
    memberIds: ["p-2025204042", "p-2025204007"],
    leadId: "p-2025204042",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-15",
    batchId: "b-2025-2027",
    name: "Saini & Pawanarkar",
    memberIds: ["p-2025204036", "p-2025204005"],
    leadId: "p-2025204036",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-16",
    batchId: "b-2025-2027",
    name: "Manoj",
    memberIds: ["p-2025204031"],
    leadId: "p-2025204031",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-17",
    batchId: "b-2025-2027",
    name: "Kumar",
    memberIds: ["p-2025204023"],
    leadId: "p-2025204023",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-18",
    batchId: "b-2025-2027",
    name: "Karan & Kumar",
    memberIds: ["p-2025204010", "p-2025204018"],
    leadId: "p-2025204010",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-19",
    batchId: "b-2025-2027",
    name: "Yadav & Murthy",
    memberIds: ["p-2025204015", "p-2025204034"],
    leadId: "p-2025204015",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-20",
    batchId: "b-2025-2027",
    name: "Koranga & Bhabad",
    memberIds: ["p-2025204033", "p-2025204016"],
    leadId: "p-2025204033",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-21",
    batchId: "b-2025-2027",
    name: "Charan & Prathyusha",
    memberIds: ["p-2025204040", "p-2025204001"],
    leadId: "p-2025204040",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  {
    id: "team-22",
    batchId: "b-2025-2027",
    name: "Patidar & Saurabh",
    memberIds: ["p-2025204009", "p-2025204039"],
    leadId: "p-2025204009",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
]

export const seedProjects: Project[] = [
  {
    id: "proj-1",
    title: "Everything-for-rent platform",
    description:
      "an app that lets people easily rent useful items locally for short periods instead of buying them outright.",
    teamId: "team-1",
    teamMemberIds: ["p-2025204013", "p-2025204008"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-prakash"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nEverything-for-rent platform: an app that lets people easily rent useful items locally for short periods instead of buying them outright.\n\n---\n\nIdea 2 (also proposed):\n\nTrust-first resale marketplace: an app that makes buying and selling used expensive items feel safe and reliable by adding inspection, escrow, and warranty.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204013",
    createdAt: "2026-07-18T23:19:51.000Z",
    updatedBy: "p-2025204013",
    updatedAt: "2026-07-18T23:19:51.000Z",
  },
  {
    id: "proj-2",
    title: "Financial Caregiving Platform for Aging Parents",
    description:
      "As families become geographically distributed, adult children increasingly help manage their aging parents' finances remotely.",
    teamId: "team-2",
    teamMemberIds: ["p-2025204026", "p-2025204028"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nProject Title\n\nFinancial Caregiving Platform for Aging Parents\n\nProblem Statement\n\nAs families become geographically distributed, adult children increasingly help manage their aging parents' finances remotely. Existing banking and finance apps are designed for individual users and do not support collaborative financial caregiving, making it difficult to manage bills, insurance, fraud protection, and emergency financial information while preserving parents' independence.\n\nProposed Solution\n\nDevelop a collaborative financial caregiving platform that enables aging parents and trusted family members to securely manage financial responsibilities together. The platform will provide permission-based access, bill and renewal management, emergency financial information, fraud alerts, and AI-assisted reminders to reduce financial stress while maintaining privacy and autonomy.\n\n---\n\nIdea 2 (also proposed):\n\nAI-Powered Product Discovery Platform:\n\nProblem Statement:\n\nProduct teams collect customer feedback from multiple sources such as interviews, app reviews, support tickets, surveys, and sales calls. This information is often unstructured and scattered across different platforms, making it difficult to identify recurring pain points, prioritize opportunities, and make data-driven product decisions. As a result, product discovery becomes slow, inconsistent, and heavily dependent on manual analysis.\n\nProposed Solution:\n\nDevelop an AI-powered product discovery platform that consolidates customer feedback from multiple sources, automatically extracts insights, clusters similar pain points, generates personas and user journeys, identifies opportunities, recommends feature priorities, and assists product managers by generating PRDs and success metrics. The platform aims to reduce the effort involved in product discovery while improving decision quality.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204026",
    createdAt: "2026-07-19T14:42:18.000Z",
    updatedBy: "p-2025204026",
    updatedAt: "2026-07-19T14:42:18.000Z",
  },
  {
    id: "proj-3",
    title:
      "Outpatient consultations extend well beyond the clinical encounter itself.",
    description:
      "Doctors in independent and small-clinic settings must simultaneously manage documentation, maintain records, prepare prescriptions, review diagnostic reports, and coordinate follow-ups, often across disconnected…",
    teamId: "team-3",
    teamMemberIds: ["p-2025204041", "p-2025204019"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raghu"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nOutpatient consultations extend well beyond the clinical encounter\nitself. Doctors in independent and small-clinic settings must\nsimultaneously manage documentation, maintain records, prepare\nprescriptions, review diagnostic reports, and coordinate follow-ups,\noften across disconnected processes.\nThese activities create additional workload and friction throughout the\nconsultation journey, affecting not only doctors but every stakeholder\ninvolved in care delivery.\n\n---\n\nIdea 2 (also proposed):\n\nPharmacies often rely on manual inventory planning and intuition to manage thousands of medicines, leading to stock-outs, excess inventory, expired medicines, and inefficient procurement decisions. AI Inventory Intelligence for Pharmacies is a predictive inventory intelligence platform that analyses sales, inventory levels, expiry dates, supplier lead times, and seasonal demand to recommend what to order, when to order, and in what quantity, helping pharmacies optimise inventory, reduce wastage, and ensure medicine availability.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204041",
    createdAt: "2026-07-19T15:08:02.000Z",
    updatedBy: "p-2025204041",
    updatedAt: "2026-07-19T15:08:02.000Z",
  },
  {
    id: "proj-4",
    title:
      "PetSensei is a personalized pet care companion that guides pet owners through every stage…",
    description:
      "of their pet's life with timely advice, trusted recommendations, and proactive care reminders.",
    teamId: "team-4",
    teamMemberIds: ["p-2025204037", "p-2025204025"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nPetSensei is a personalized pet care companion that guides pet owners through every stage of their pet's life with timely advice, trusted recommendations, and proactive care reminders.\n\n---\n\nIdea 2 (also proposed):\n\nAn intelligent autonomous workplace where AI agents think, collaborate, and execute tasks across departments, allowing humans to focus on strategy and complex decision making.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204037",
    createdAt: "2026-07-19T15:24:56.000Z",
    updatedBy: "p-2025204037",
    updatedAt: "2026-07-19T15:24:56.000Z",
  },
  {
    id: "proj-5",
    title: "Fraud detection using AI",
    description: "Fraud detection using AI",
    teamId: "team-5",
    teamMemberIds: ["p-2025204024", "p-2024204015"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-prakash"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem: "Idea 1:\n\nFraud detection using AI",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204024",
    createdAt: "2026-07-19T15:40:22.000Z",
    updatedBy: "p-2025204024",
    updatedAt: "2026-07-19T15:40:22.000Z",
  },
  {
    id: "proj-6",
    title:
      "AI System to diagnose and reduce workspace friction for radiologists",
    description:
      "AI System to diagnose and reduce workspace friction for radiologists",
    teamId: "team-6",
    teamMemberIds: ["p-2025204030", "p-2025204027"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-prakash"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nAI System to diagnose and reduce workspace friction for radiologists\n\n---\n\nIdea 2 (also proposed):\n\nIntelligent systems that automates waste collection",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204030",
    createdAt: "2026-07-19T15:40:46.000Z",
    updatedBy: "p-2025204030",
    updatedAt: "2026-07-19T15:40:46.000Z",
  },
  {
    id: "proj-7",
    title: "Human-AI Performance Manager",
    description:
      "Exploring how productivity, collaboration quality, and decision-making effectiveness can be measured and improved in teams where humans and AI agents work together as contributors.",
    teamId: "team-7",
    teamMemberIds: ["p-2025204006", "p-2025204003"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nHuman-AI Performance Manager: Exploring how productivity, collaboration quality, and decision-making effectiveness can be measured and improved in teams where humans and AI agents work together as contributors.\n\n---\n\nIdea 2 (also proposed):\n\nProduct Evolution Engine: Investigating how continuous user feedback, behavioral signals, and market changes can be transformed into actionable insights for guiding a product’s future direction and evolution.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204006",
    createdAt: "2026-07-19T16:13:38.000Z",
    updatedBy: "p-2025204006",
    updatedAt: "2026-07-19T16:13:38.000Z",
  },
  {
    id: "proj-8",
    title:
      "Traffic enforcement in India remains fragmented and largely dependent on manual…",
    description: "monitoring and multiple disconnected systems.",
    teamId: "team-8",
    teamMemberIds: ["p-2025204012", "p-2025204002"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raghu"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nTraffic enforcement in India remains fragmented and largely dependent on manual monitoring and multiple disconnected systems. As a result, many traffic violations, expired vehicle documents, and vehicle-related crimes such as stolen or cloned vehicles often go undetected or are identified only after significant delay. This reduces enforcement efficiency, increases road safety risks, and contributes to environmental pollution.\n\n---\n\nIdea 2 (also proposed):\n\nThe rapid adoption of Large Language Models (LLMs) has led to the rise of 'vibe coding', where users accept AI-generated code without understanding its implementation. Existing AI coding assistants prioritize solving problems instead of teaching users the reasoning behind the generated code. As a result, developers become increasingly dependent on AI rather than improving their own software engineering skills.\nModern frameworks for Web Development, Mobile Development, Artificial Intelligence, Data Science, and Cloud Computing provide extensive documentation. However, documentation is often lengthy, difficult to navigate, and disconnected from real-world project workflows. Beginners frequently abandon documentation in favor of AI tools that provide immediate answers but little educational value.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204012",
    createdAt: "2026-07-19T16:14:50.000Z",
    updatedBy: "p-2025204012",
    updatedAt: "2026-07-19T16:14:50.000Z",
  },
  {
    id: "proj-9",
    title:
      "An AI-powered Operating System for Freelance Photography Businesses.",
    description:
      "An AI-powered Operating System for Freelance Photography Businesses.",
    teamId: "team-9",
    teamMemberIds: ["p-2025204017", "p-2025204029"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nAn AI-powered Operating System for Freelance Photography Businesses.\n\n---\n\nIdea 2 (also proposed):\n\nVisual Post-Op Wound Care Tracker:\nA low-friction app that uses a Vision API to compare daily photos of a surgical site against a baseline, acting as a reassuring triage tool for anxious post-op patients.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204017",
    createdAt: "2026-07-19T16:19:51.000Z",
    updatedBy: "p-2025204017",
    updatedAt: "2026-07-19T16:19:51.000Z",
  },
  {
    id: "proj-10",
    title: "Preserving Memories of a physical object in a digitalise format",
    description:
      "Preserving Memories of a physical object in a digitalise format",
    teamId: "team-10",
    teamMemberIds: ["p-2025204035", "p-2025204014"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-prakash"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nPreserving Memories of a physical object in a digitalise format\n\n---\n\nIdea 2 (also proposed):\n\nVoice Cloning Detection; Identifies AI-generated voices.)",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204035",
    createdAt: "2026-07-19T16:19:55.000Z",
    updatedBy: "p-2025204035",
    updatedAt: "2026-07-19T16:19:55.000Z",
  },
  {
    id: "proj-11",
    title: "Enterprise Revenue Intelligence & Assurance",
    description:
      "A broader business solution focused on helping enterprises improve revenue realization, financial efficiency, and operational performance.",
    teamId: "team-11",
    teamMemberIds: ["p-2025204020"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nEnterprise Revenue Intelligence & Assurance — A broader business solution focused on helping enterprises improve revenue realization, financial efficiency, and operational performance. The idea spans identifying revenue leakage, process and reconciliation gaps, billing and pricing discrepancies, missed revenue opportunities, and inefficiencies across interconnected business functions. It aims to provide enterprises with greater visibility into how revenue moves through their operations and where value may be lost.\n\n---\n\nIdea 2 (also proposed):\n\nExperience-as-a-Service Platform -  A platform that enables people to access personalized, on-demand experiences and services delivered by verified individuals or professionals. Instead of hiring someone permanently or managing multiple service providers, users can book a specific experience whenever they need it  from home cooking, personal assistance, wellness and fitness, beauty, to celebrations, learning, lifestyle, and other everyday or specialized needs. The platform focuses on making high-quality, trusted experiences accessible on demand, while enabling skilled individuals to monetize their time, expertise, and services.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204020",
    createdAt: "2026-07-19T16:24:39.000Z",
    updatedBy: "p-2025204020",
    updatedAt: "2026-07-19T16:24:39.000Z",
  },
  {
    id: "proj-12",
    title: "AI Voice Agent Platform",
    description:
      "The Problem: - Businesses spend significant time and money on repetitive outbound and inbound calling activities.",
    teamId: "team-12",
    teamMemberIds: ["p-2025204022", "p-2025204021"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nAI Voice Agent Platform\n\n The Problem:\n\n- Businesses spend significant time and money on repetitive outbound and inbound calling activities.\n- Human agents can only handle a limited number of calls, making operations difficult to scale.\n- Hiring, training, and managing large call center teams increases operational costs.\n-Follow-ups are often inconsistent, resulting in lower collections, conversions, and customer engagement.\n\n The Solution:\n\n- An AI Voice Agent platform where businesses can create and deploy specialized voice agents for different use cases.\n- Users onboard by providing business knowledge, call scripts, FAQs, objection handling, and compliance guidelines so the voice agent understands the business context.\n-Businesses can integrate CRM systems, telephony providers, customer databases, calendars, and payment gateways, upload customer lists or connect their CRM, assign campaigns and objectives, and let AI agents autonomously make, receive, and manage calls 24/7.\n- A web and mobile dashboard provides live call monitoring, transcripts, analytics, campaign performance, customer sentiment, and actionable insights.\n\n Use Cases\n\nEMI & loan collections\n Sales outreach\n Lead qualification\n Discovery calls\n Appointment booking\n Customer support\n Customer feedback surveys\n Payment reminders\n Insurance renewals\n Real estate lead engagement\n\n---\n\nIdea 2 (also proposed):\n\nThe AI Agents Company\n\n The Problem:\n\n- Small startups to medium-scale businesses that need to work on technical projects have to hire people at a high cost.\n- Building MVPs or the required software systems for these businesses takes a significant amount of time.\n- Hiring people, getting them to work, and managing engineering teams is a major hassle.\n\nThe Solution:\n\n-The AI Agent Company, where users onboard onto the platform and get an AI agent with the specifications required for the tasks they want to perform or the systems they want to build.\n- During onboarding, users provide KT (Knowledge Transfer), allowing the agent to understand the company. The knowledge base continuously grows over time. Users also provide the necessary accesses to run systems (staging and production deployments) and to store and maintain code (Git and other code repository providers).\n- Users can then create user stories and set deadlines. The AI agent works 24/7, provides reports 24/7, and continuously helps improve the company.\n -Users are given access to an application with a chatbot interface and live notifications about their tasks.\n\nUse Cases:\n\n MVP development for startups\n Building internal business systems\nFeature development for existing products\n Bug fixing and maintenance\nContinuous product enhancement\n Software engineering support for small and medium-sized businesses",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204022",
    createdAt: "2026-07-19T16:25:55.000Z",
    updatedBy: "p-2025204022",
    updatedAt: "2026-07-19T16:25:55.000Z",
  },
  {
    id: "proj-13",
    title: "AI Operating Copilot for Micro & Small Businesses",
    description: "AI Operating Copilot for Micro & Small Businesses",
    teamId: "team-13",
    teamMemberIds: ["p-2025204004", "p-2025204011"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-prakash"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nAI Operating Copilot for Micro & Small Businesses\n\n---\n\nIdea 2 (also proposed):\n\nAI-Powered Digital Land Identity & Property Verification",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204004",
    createdAt: "2026-07-19T16:37:57.000Z",
    updatedBy: "p-2025204004",
    updatedAt: "2026-07-19T16:37:57.000Z",
  },
  {
    id: "proj-14",
    title:
      "Intelligence Layer for AI Agents which respects constraints, adheres to compliance and…",
    description:
      "keeps track of decision points to prevent context drift and easy rollback to previous state.",
    teamId: "team-14",
    teamMemberIds: ["p-2025204042", "p-2025204007"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-prakash"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nIntelligence Layer for AI Agents which respects constraints, adheres to compliance and keeps track of decision points to prevent context drift and easy rollback to previous state.\n\n---\n\nIdea 2 (also proposed):\n\nAgent teams for employees on the go, chat/call natively via phone, imessage, whatsapp 24/7 instead of having to rely on different time zones or work devices (like laptop or a workstation) which ensures the product has minimal downtime.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204042",
    createdAt: "2026-07-19T16:39:10.000Z",
    updatedBy: "p-2025204042",
    updatedAt: "2026-07-19T16:39:10.000Z",
  },
  {
    id: "proj-15",
    title: "Intelligent Shipment Clustering for Urban Logistics",
    description:
      "A logistics optimization platform that aggregates fragmented delivery demand from multiple businesses within the same geographic zone and consolidates them into shared, route-optimized vehicle runs.",
    teamId: "team-15",
    teamMemberIds: ["p-2025204036", "p-2025204005"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raghu"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nProject - Intelligent Shipment Clustering for Urban Logistics\nA logistics optimization platform that aggregates fragmented delivery demand from multiple businesses within the same geographic zone and consolidates them into shared, route-optimized vehicle runs. The system addresses the inefficiency of businesses independently booking dedicated vehicles for partial loads — resulting in underutilized capacity, high per-shipment costs, and redundant routes. The core engine performs zone-based demand clustering, vehicle-load matching, and multi-stop route optimization in real time. Target customers include B2B manufacturers, wholesalers, D2C brands, and retail chains operating in dense urban corridors. The platform provides businesses a cost-per-movement pricing model where they pay only for the capacity they use, with live tracking and delivery confirmation. The research contribution centers on the clustering and dispatch algorithm — specifically, how to optimally group time-sensitive, heterogeneous shipments under dynamic demand conditions at city scale.\n\n---\n\nIdea 2 (also proposed):\n\nProject Obstetric Emergency Referral and Handoff System for Government Hospitals\n\nA digital coordination platform that streamlines emergency obstetric referrals between government healthcare facilities — replacing the current dependency on informal doctor networks and handwritten referral slips with a structured, real-time communication layer. The system addresses two compounding failures identified through primary research with government gynecologists: referring doctors have no visibility into receiving facility capacity before dispatching critical patients, and receiving doctors have no access to patient history or clinical context on arrival. The platform has two linked modules — a structured referral initiation tool that broadcasts severity-graded alerts to district facilities and confirms acceptance before patient dispatch, and an auto-generated digital handoff record that gives the receiving doctor a 30-second patient summary on arrival. An AI-based obstetric risk scoring model classifies incoming referrals by severity tier to help receiving facilities prioritize. The system is designed for low-bandwidth rural conditions and code-switching multilingual environments, with a target pilot across PHC-to-district hospital referral corridors in Telangana.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204036",
    createdAt: "2026-07-19T16:49:33.000Z",
    updatedBy: "p-2025204036",
    updatedAt: "2026-07-19T16:49:33.000Z",
  },
  {
    id: "proj-16",
    title:
      "Exploring a platform that reimagines the technical events ecosystem—either by…",
    description:
      "streamlining end-to-end event management or by helping participants build meaningful professional connections before, during, and after events.",
    teamId: "team-16",
    teamMemberIds: ["p-2025204031"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nExploring a platform that reimagines the technical events ecosystem—either by streamlining end-to-end event management or by helping participants build meaningful professional connections before, during, and after events. The exact problem statement is still being refined.\n\n---\n\nIdea 2 (also proposed):\n\nA platform where users discover micro-gigs, find collaborators, join local communities, attend events together, and build verified portfolios—all in one place.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204031",
    createdAt: "2026-07-19T16:52:23.000Z",
    updatedBy: "p-2025204031",
    updatedAt: "2026-07-19T16:52:23.000Z",
  },
  {
    id: "proj-17",
    title:
      "Design and develop an AI enabled wearable companion that can understand a user's daily…",
    description:
      "interactions and activities to provide contextual assistance and personalized insights.",
    teamId: "team-17",
    teamMemberIds: ["p-2025204023"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raghu"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nDesign and develop an AI enabled wearable companion that can understand a user's daily interactions and activities to provide contextual assistance and personalized insights. The project aims to identify suitable target users, validate their needs through market and user research, build and iterate on a product prototype, and evaluate its usability, desirability, and overall value proposition.\n\n---\n\nIdea 2 (also proposed):\n\nDesign and develop an adaptive Human Machine Interface (HMI) for controlling Unmanned Aerial Vehicles (UAVs) through an intuitive interaction mechanism. Instead of developing a UAV, the focus will be on creating a modular control solution that can potentially integrate with different UAV platforms. The product concept will be validated with relevant stakeholders through user research, prototyping, usability testing, and iterative product development.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204023",
    createdAt: "2026-07-19T16:55:49.000Z",
    updatedBy: "p-2025204023",
    updatedAt: "2026-07-19T16:55:49.000Z",
  },
  {
    id: "proj-18",
    title:
      "Understand how product teams collect customer feedback and decide which features to…",
    description:
      "build, and explore ways to make this process easier and more efficient.",
    teamId: "team-18",
    teamMemberIds: ["p-2025204010", "p-2025204018"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raghu"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nUnderstand how product teams collect customer feedback and decide which features to build, and explore ways to make this process easier and more efficient.\n\n---\n\nIdea 2 (also proposed):\n\nExplore the challenges faced by creators in managing content creation, audience growth, and collaboration, and design a solution to support their workflow.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204010",
    createdAt: "2026-07-19T16:57:37.000Z",
    updatedBy: "p-2025204010",
    updatedAt: "2026-07-19T16:57:37.000Z",
  },
  {
    id: "proj-19",
    title: "Improving Decision-Making in Early-Stage Investments",
    description:
      "Early-stage investors find it difficult to evaluate startups efficiently because critical information is scattered across multiple sources.",
    teamId: "team-19",
    teamMemberIds: ["p-2025204015", "p-2025204034"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nImproving Decision-Making in Early-Stage Investments: Early-stage investors find it difficult to evaluate startups efficiently because critical information is scattered across multiple sources. Investors spend significant time reviewing pitch decks, founder conversations, market data and news reports to understand a startup's potential. This manual process is time-consuming, inconsistent and can lead to important risks being missed. As the number of startups continues to grow, investors face increasing pressure to make faster and better-informed decisions. If left unaddressed, this can result in delayed investments, missed opportunities and poor allocation of capital.\n\n---\n\nIdea 2 (also proposed):\n\nInteractive Live Shopping Experience for Indian E-commerce: Indian online shoppers often struggle to make confident purchase decisions because product images, descriptions and reviews do not fully reflect the actual product. Many switch to platforms like YouTube or Instagram to watch product demonstrations before buying, creating a fragmented shopping journey. Small sellers also have limited opportunities to showcase products and answer customer queries in real time. This leads to lower customer trust, abandoned purchases and missed sales opportunities.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204015",
    createdAt: "2026-07-19T16:58:25.000Z",
    updatedBy: "p-2025204015",
    updatedAt: "2026-07-19T16:58:25.000Z",
  },
  {
    id: "proj-20",
    title:
      "UPI and digital payments have made transactions effortless, but they have not made…",
    description: "financial decision-making any easier.",
    teamId: "team-20",
    teamMemberIds: ["p-2025204033", "p-2025204016"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raghu"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nHypothesis: UPI and digital payments have made transactions effortless, but they have not made financial decision-making any easier.\nHMW: How might we help people make\nconfident spending decisions at the moment they pay, without adding friction to the payment experience?\n\n---\n\nIdea 2 (also proposed):\n\nHow might we help teams move from scattered product signals to a validated, prioritized, what to build next with minimal manual effort?",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204033",
    createdAt: "2026-07-19T16:59:10.000Z",
    updatedBy: "p-2025204033",
    updatedAt: "2026-07-19T16:59:10.000Z",
  },
  {
    id: "proj-21",
    title:
      "Multilingual, low-learning-curve claims coordination platform that helps claimants…",
    description:
      "Insurance claimants often struggle to complete and track claims because documents, communications, approvals and responsibilities are distributed across multiple parties and systems.",
    teamId: "team-21",
    teamMemberIds: ["p-2025204040", "p-2025204001"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nProblem statement:\nInsurance claimants often struggle to complete and track claims because documents, communications, approvals and responsibilities are distributed across multiple parties and systems. Claimants repeatedly submit the same documents, call different stakeholders for updates and receive technical or incomplete explanations about delays.\n\nAt the same time, insurers and service partners spend significant effort responding to status enquiries, identifying missing documents, reconciling inconsistent evidence and coordinating actions across agents, surveyors, repairers, hospitals and claims teams.\n\nThis fragmented process increases claim-processing time, administrative cost, customer anxiety and mistrust between the claimant and insurer\n\nProject idea:\nmultilingual, low-learning-curve claims coordination platform that helps claimants, insurers, brokers, agents, surveyors, hospitals and repair centres understand what has happened in a claim, what evidence is missing, who owns the next action and why the claim is delayed.\n\nThe product would initially focus on one standardised claim category, such as motor own-damage claims or health-insurance reimbursement claims, before expanding into other insurance lines.\n\n---\n\nIdea 2 (also proposed):\n\nProblem statement:\nLocal food businesses receive orders from calls, WhatsApp messages, notebooks, websites, repeat customers and sales staff. Orders frequently change in quantity, menu, delivery time, location and dietary requirements.\n\nThese changes are not consistently reflected across purchasing, kitchen preparation, packing, dispatch and billing. As a result, businesses over-purchase or under-purchase ingredients, prepare incorrect quantities, miss customer instructions, delay deliveries and lose visibility into the profitability of each order.\n\nThe owner or one experienced staff member often becomes the only person who understands the complete operation, limiting the business’s ability to scale.\n\nProject idea:\nWhatsApp- and voice-first production coordination platform for caterers, tiffin providers, cloud kitchens and small food manufacturers.\n\nIt converts changing customer orders into structured ingredient requirements, preparation batches, kitchen tasks, packing plans, delivery schedules and payment follow-ups.\n\nThe product is not a food marketplace or delivery aggregator. It is an internal operating system for businesses that already receive orders directly.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204040",
    createdAt: "2026-07-19T17:08:16.000Z",
    updatedBy: "p-2025204040",
    updatedAt: "2026-07-19T17:08:16.000Z",
  },
  {
    id: "proj-22",
    title:
      "AI-Powered Creator–Brand Collaboration and Campaign Intelligence Platform",
    description:
      "We propose to develop an AI-powered platform that connects content creators with brands for relevant marketing collaborations while providing intelligent recommendations to both stakeholders.",
    teamId: "team-22",
    teamMemberIds: ["p-2025204009", "p-2025204039"],
    batchId: "b-2025-2027",
    mentorIds: ["p-mentor-raman"],
    // The registration form records a preferred mentor as well as the
    // assigned one. We do not hold those values yet, so this stays null
    // until the coordinator fills it in rather than being invented.
    preferredMentorId: null,
    visibility: "team_and_mentor",
    domainId: null,
    status: "ongoing",
    problem:
      "Idea 1:\n\nAI-Powered Creator–Brand Collaboration and Campaign Intelligence Platform\n\nWe propose to develop an AI-powered platform that connects content creators with brands for relevant marketing collaborations while providing intelligent recommendations to both stakeholders.\nFor content creators, the system will analyze their content, engagement patterns, audience interactions, and profile characteristics to identify their content niche, strengths, and potential growth opportunities. Based on these insights, it will recommend suitable content directions, themes, and collaboration opportunities.\nFor brands, the system will analyze their product, target audience, and marketing objectives to recommend suitable campaign strategies, content formats, and categories of creators—such as nano, micro, or macro influencers—for effective collaborations.\nThe project aims to go beyond traditional creator-brand marketplaces by introducing an AI-driven decision-support layer that helps creators make informed content decisions and enables brands to design more relevant influencer marketing campaigns and identify suitable creator segments.\n\n---\n\nIdea 2 (also proposed):\n\nAI-Enabled Multi-Space Rental and Property Management Platform\n\nWe propose to develop an AI-enabled digital platform that connects owners of underutilized spaces with individuals and businesses seeking temporary or long-term access to such spaces. The platform will support a wide range of rentable assets, including residential properties, hostels, PG accommodations, shops, office spaces, parking spaces, event venues, warehouses, and other commercial or personal spaces.\nFor space owners, the system will provide an integrated dashboard to create and manage listings, handle inquiries, verify users, maintain digital rental records, manage agreements, track payments, and monitor occupancy.\nFor tenants and space seekers, the platform will leverage AI to analyze user preferences, location requirements, budget constraints, intended purpose, and historical search behavior to recommend the most suitable spaces. It will also provide verified listings, personalized recommendations, digital documentation, and a streamlined discovery and booking experience, reducing dependence on brokers and informal networks.\nThe project aims to transform the fragmented and largely offline rental ecosystem—particularly in Tier-2 and Tier-3 cities—by introducing an AI-driven marketplace combined with digital property management capabilities. Beyond simply connecting owners and renters, the platform will serve as an intelligent decision-support system that enhances trust, improves space utilization, simplifies rental operations, and enables efficient management of diverse physical spaces through a unified digital ecosystem.",
    workOrOutcome: "",
    materials: [],
    archived: false,
    createdBy: "p-2025204009",
    createdAt: "2026-07-19T17:43:18.000Z",
    updatedBy: "p-2025204009",
    updatedAt: "2026-07-19T17:43:18.000Z",
  },
]
