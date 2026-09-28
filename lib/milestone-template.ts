import type { MilestoneTemplateItem } from "@/lib/types"

/** The 2026 milestone sheet, as data.
 *
 * Source: "PDM Project — Milestones · Activities · Deliverable · Suggested
 * Timelines". Seven phases, twelve dated checkpoints, weeks 4 to 28.
 *
 * This lives in the database rather than in code because the coordinator has
 * to be able to change it: the 2025–27 curriculum runs the final project as a
 * single 24-credit unit and the 2026–28 curriculum splits it into two parts
 * with an internship alternative, so the shape of the calendar is not a
 * constant of the programme.
 */
export function milestoneTemplateFor(batchId: string): MilestoneTemplateItem[] {
  return TEMPLATE.map((item, index) => ({
    ...item,
    id: `mt-${batchId}-${index + 1}`,
    batchId,
    order: index + 1,
  }))
}

type TemplateSeed = Omit<MilestoneTemplateItem, "id" | "batchId" | "order">

const TEMPLATE: TemplateSeed[] = [
  {
    semester: 3,
    phase: "Product scope",
    title: "Detailed Project Plan",
    dueWeek: 4,
    description:
      "The product or business vision, who the customer is, what they need, and how the year will run.",
    deliverables: [
      "Product or business vision statement",
      "Potential customer identified",
      "Assumed primary need or opportunity statement",
      "Initial product idea written up",
      "Key benefits and customer value",
      "Competitive alternatives",
      "Key differentiator",
      "High-level plan with effort, timeline and risks",
    ],
  },
  {
    semester: 3,
    phase: "Domain research",
    title: "Domain Research Report",
    dueWeek: 6,
    description: "What is already happening in the domain, and who is already solving this.",
    deliverables: [
      "Technical aspects and trends",
      "Competitor analysis",
      "Market and existing products",
    ],
  },
  {
    semester: 3,
    phase: "Customer discovery",
    title: "Customer Validation Report",
    dueWeek: 8,
    description: "Assumptions written down so they can be tested, then tested against real people.",
    deliverables: [
      "Customer discovery plan and methods",
      "Target customer identified",
      "Assumptions documented, testable and specific",
      "Assumptions tested with customers",
      "Customer's problem validated",
    ],
  },
  {
    semester: 3,
    phase: "Customer discovery",
    title: "Idea Validation Report",
    dueWeek: 10,
    description: "Whether the idea solves the problem, and whether anyone would pay for it.",
    deliverables: [
      "Idea solves the customer's problem",
      "Customer willingness to pay",
      "Evidence the product could be profitable",
    ],
  },
  {
    semester: 3,
    phase: "Customer research",
    title: "Research Pack and Market Opportunity",
    dueWeek: 14,
    description:
      "The largest single bundle in the calendar. Nine artefacts, four weeks after the previous checkpoint.",
    deliverables: [
      "Research goals and objectives",
      "Research methods and tools selected",
      "Interview, survey or focus-group questionnaire",
      "User personas",
      "User requirement document",
      "Customer pain points",
      "Customer perceived gains",
      "Customer journey map",
      "Prioritised product feature list",
      "Market opportunity",
    ],
  },
  {
    semester: 3,
    phase: "Problem definition",
    title: "Actionable Problem Statement",
    dueWeek: 16,
    isGate: true,
    description:
      "The semester boundary. The problem has to be settled before solution work begins.",
    deliverables: [
      "Customer point-of-view statements",
      "Value proposition map",
      "How-Might-We statements",
      "Articulated actionable problem statement",
    ],
  },
  {
    semester: 4,
    phase: "Ideation",
    title: "Ideas and Screening Matrix",
    dueWeek: 18,
    description: "Diverge first, then choose deliberately rather than settling on the first idea.",
    deliverables: [
      "Multiple ad-lib statements",
      "List of ideas",
      "Idea screening matrix",
      "Customer profile, value map and fit",
      "Prioritised feature list",
    ],
  },
  {
    semester: 4,
    phase: "Build",
    title: "Low-Fidelity Prototype",
    dueWeek: 21,
    description: "Something a customer can react to.",
    deliverables: ["Low-fidelity prototype or MVP"],
  },
  {
    semester: 4,
    phase: "Re-plan",
    title: "Updated Plan and Requirements",
    dueWeek: 22,
    description: "What the build taught you, folded back into the plan.",
    deliverables: ["Updated project plan", "Updated product requirement document"],
  },
  {
    semester: 4,
    phase: "Hi-fidelity",
    title: "Hi-Fidelity Prototype",
    dueWeek: 25,
    description: "The version you would put in front of a real user.",
    deliverables: ["Hi-fidelity prototype"],
  },
  {
    semester: 4,
    phase: "User validation",
    title: "Validation Report",
    dueWeek: 26,
    description: "Tested with representative users, and what the testing changed.",
    deliverables: ["Customer validation plan", "Validation matrix", "Validation report"],
  },
  {
    semester: 4,
    phase: "Go to market",
    title: "Go-to-Market Strategy",
    dueWeek: 28,
    isGate: true,
    description: "How this would reach the people it is for.",
    deliverables: ["Go-to-market strategy document"],
  },
]

/** Phases in calendar order, for grouping headers. */
export const PHASE_ORDER = [
  "Product scope",
  "Domain research",
  "Customer discovery",
  "Customer research",
  "Problem definition",
  "Ideation",
  "Build",
  "Re-plan",
  "Hi-fidelity",
  "User validation",
  "Go to market",
]
