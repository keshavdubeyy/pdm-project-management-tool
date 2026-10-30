import type { MilestoneActivity, MilestoneTemplateItem } from "@/lib/types"

/** The 2026 milestone sheet, as data.
 *
 * Source: "PDM Project — Milestones · Activities · Deliverable · Suggested
 * Timelines". Seven phases, twelve dated checkpoints, weeks 4 to 36. The sheet
 * reads Semester → Phase → Activity → Sub-activity, with the week on the row
 * that closes a deliverable; each checkpoint here is one such row, and its
 * `activities` are the rows above it.
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
    // What a team ticks off is exactly the sub-activities, so the two can
    // never drift apart in the seed.
    deliverables: item.activities.flatMap((a) =>
      a.subActivities.map((sub) => sub.title)
    ),
    id: `mt-${batchId}-${index + 1}`,
    batchId,
    order: index + 1,
  }))
}

type TemplateSeed = Omit<
  MilestoneTemplateItem,
  "id" | "batchId" | "order" | "deliverables" | "activities"
> & { activities: MilestoneActivity[] }

const TEMPLATE: TemplateSeed[] = [
  {
    semester: 3,
    phase: "Product scope",
    title: "Detailed Project Plan",
    dueWeek: 4,
    description:
      "The product or business vision, who the customer is, what they need, and how the year will run.",
    activities: [
      {
        title: "Create Product/Business Vision Statement",
        subActivities: [
          { title: "Write the product/business vision statement" },
          { title: "Specify potential customer" },
          { title: "Specify assumed primary need of the customers or opportunity statement" },
          { title: "Write initial idea about product or business" },
          { title: "Assumed key benefits and customer value" },
          { title: "Potential competitive alternatives" },
          { title: "Specify potential key differentiator, unique features" },
        ],
      },
      {
        title: "High level project plan",
        subActivities: [
          { title: "Create high level project plan including activities, efforts and timelines, with risks and their mitigation plan", output: "Detailed Project Plan" },
        ],
      },
    ],
  },
  {
    semester: 3,
    phase: "Domain research",
    title: "Domain Research Report",
    dueWeek: 6,
    description: "What is already happening in the domain, and who is already solving this.",
    activities: [
      {
        title: "Domain research",
        subActivities: [
          { title: "Technical aspects and trends" },
          { title: "Competitors" },
          { title: "Market: existing products and solutions", output: "Domain Research Report" },
        ],
      },
    ],
  },
  {
    semester: 3,
    phase: "Customer discovery",
    title: "Customer Validation Report",
    dueWeek: 8,
    description: "Assumptions written down so they can be tested, then tested against real people.",
    activities: [
      {
        title: "Customer Discovery Plan including methods",
        subActivities: [
          { title: "Write the customer discovery plan and methods" },
          { title: "Identify target customer" },
          { title: "Document all assumptions you made" },
          { title: "Assumptions are testable" },
          { title: "Assumptions are specific (what, why and when)" },
          { title: "Each assumption describes only one thing" },
          { title: "Test all the assumptions with the customers" },
          { title: "Validate customer's problem", output: "Customer Validation Report" },
        ],
      },
    ],
  },
  {
    semester: 3,
    phase: "Customer discovery",
    title: "Idea Validation Report",
    dueWeek: 10,
    description: "Whether the idea solves the problem, and whether anyone would pay for it.",
    activities: [
      {
        title: "Test product idea/concept",
        subActivities: [
          { title: "Validate if your product or service idea solves the customer's problem" },
          { title: "Validate if customer is willing to pay for your product or service" },
          { title: "Validate if your product or service will be profitable", output: "Idea Validation Report" },
        ],
      },
    ],
  },
  {
    semester: 3,
    phase: "Customer discovery",
    title: "Research Pack and Market Opportunity",
    dueWeek: 14,
    description:
      "The largest single bundle in the calendar. Nine artefacts, four weeks after the previous checkpoint.",
    activities: [
      {
        title: "Customer Research",
        subActivities: [
          { title: "Define customer research goal and objectives" },
          { title: "Define research methods and tools", output: "Selected Research Tools" },
          { title: "Develop interview, survey or focus-group plan", output: "Interview/Survey Questionnaire" },
          { title: "Develop customer/user personas", output: "User Personas" },
          { title: "Identify customer/user goals and needs", output: "User Requirement Document" },
          { title: "Identify customer's challenges and barriers", output: "Document customer's pain points" },
          { title: "Identify their motivation and values", output: "Document customer's perceived gains" },
          { title: "Map customer journey to achieve their goals", output: "Customer Journey Map(s)" },
          { title: "Define product requirement", output: "Product Feature List including priority" },
          { title: "Market opportunity", output: "Market Opportunity" },
        ],
      },
    ],
  },
  {
    semester: 3,
    phase: "Define actionable problem statement",
    title: "Actionable Problem Statement",
    dueWeek: 17,
    isGate: true,
    description:
      "The semester boundary. The problem has to be settled before solution work begins.",
    activities: [
      {
        title: "Customer Point of View",
        subActivities: [
          { title: "Create customer point-of-view statements" },
          { title: "Define value proposition", output: "Value Proposition Map" },
          { title: "Define How Might We (HMW) statement", output: "Actionable Problem Statement" },
        ],
      },
    ],
  },
  {
    semester: 4,
    phase: "Ideate solution and build MVP",
    title: "Ideas and Screening Matrix",
    dueWeek: 23,
    description: "Diverge first, then choose deliberately rather than settling on the first idea.",
    activities: [
      {
        title: "Ideate Solution",
        subActivities: [
          { title: "Create multiple ad-lib statements", output: "List of Ideas" },
          { title: "Develop idea screening matrix", output: "Screening Matrix" },
          { title: "Solution-customer/user fit", output: "Customer Profile, Value Map, Fit" },
          { title: "Prioritise features list" },
        ],
      },
    ],
  },
  {
    semester: 4,
    phase: "Ideate solution and build MVP",
    title: "Low-Fidelity Prototype",
    dueWeek: 25,
    description: "Something a customer can react to.",
    activities: [
      {
        title: "Build MVP",
        subActivities: [
          { title: "Create low-fidelity prototype or MVP", output: "Low Fidelity Prototype/MVP" },
        ],
      },
    ],
  },
  {
    semester: 4,
    phase: "Ideate solution and build MVP",
    title: "Updated Plan and Requirements",
    dueWeek: 26,
    description: "What the build taught you, folded back into the plan.",
    activities: [
      {
        title: "Update Project Scope",
        subActivities: [
          { title: "Update project plan" },
          { title: "Update product requirement document", output: "Updated project plan and deliverables" },
        ],
      },
    ],
  },
  {
    semester: 4,
    phase: "Hi-fidelity project plan",
    title: "Hi-Fidelity Prototype",
    dueWeek: 32,
    description: "The version you would put in front of a real user.",
    activities: [
      {
        title: "Hi Fidelity Prototype",
        subActivities: [
          { title: "Build hi-fidelity prototype", output: "Hi-Fidelity Prototype" },
        ],
      },
    ],
  },
  {
    semester: 4,
    phase: "Hi-fidelity project plan",
    title: "Validation Report",
    dueWeek: 34,
    description: "Tested with representative users, and what the testing changed.",
    activities: [
      {
        title: "User Validation",
        subActivities: [
          { title: "Develop customer validation plan", output: "Validation Matrix" },
          { title: "Conduct validation" },
          { title: "Analyse validation result", output: "Validation Report" },
        ],
      },
    ],
  },
  {
    semester: 4,
    phase: "Go-to-market strategy",
    title: "Go-to-Market Strategy",
    dueWeek: 36,
    isGate: true,
    description: "How this would reach the people it is for.",
    activities: [
      {
        title: "Go-to-Market strategy",
        subActivities: [
          { title: "Develop go-to-market strategy", output: "Go-to-Market strategy document" },
        ],
      },
    ],
  },
]

/** Phases in calendar order, for grouping headers. */
export const PHASE_ORDER = [
  "Product scope",
  "Domain research",
  "Customer discovery",
  "Define actionable problem statement",
  "Ideate solution and build MVP",
  "Hi-fidelity project plan",
  "Go-to-market strategy",
]

/** A checkpoint's work as activities. One a coordinator added by hand has none
 * recorded, so its deliverables stand in as a single activity. */
export function activitiesOf(item: MilestoneTemplateItem): MilestoneActivity[] {
  if (item.activities?.length) return item.activities
  return [
    {
      title: item.title,
      subActivities: item.deliverables.map((title) => ({ title })),
    },
  ]
}

/** What teams ticked under the earlier deliverable names, and the
 * sub-activities that replace them. An old item that bundled several steps
 * ticks all of them; several old items that described one step all tick it.
 * Names that are the same in both lists map to themselves, which is what makes
 * running this twice harmless. */
export const LEGACY_TICKS: Record<string, string[]> = {
  "Product or business vision statement": ["Write the product/business vision statement"],
  "Potential customer identified": ["Specify potential customer"],
  "Assumed primary need or opportunity statement": ["Specify assumed primary need of the customers or opportunity statement"],
  "Initial product idea written up": ["Write initial idea about product or business"],
  "Key benefits and customer value": ["Assumed key benefits and customer value"],
  "Competitive alternatives": ["Potential competitive alternatives"],
  "Key differentiator": ["Specify potential key differentiator, unique features"],
  "High-level plan with effort, timeline and risks": ["Create high level project plan including activities, efforts and timelines, with risks and their mitigation plan"],

  "Technical aspects and trends": ["Technical aspects and trends"],
  "Competitor analysis": ["Competitors"],
  "Market and existing products": ["Market: existing products and solutions"],

  "Customer discovery plan and methods": ["Write the customer discovery plan and methods"],
  "Target customer identified": ["Identify target customer"],
  "Assumptions documented, testable and specific": [
    "Document all assumptions you made",
    "Assumptions are testable",
    "Assumptions are specific (what, why and when)",
    "Each assumption describes only one thing",
  ],
  "Assumptions tested with customers": ["Test all the assumptions with the customers"],
  "Customer's problem validated": ["Validate customer's problem"],

  "Idea solves the customer's problem": ["Validate if your product or service idea solves the customer's problem"],
  "Customer willingness to pay": ["Validate if customer is willing to pay for your product or service"],
  "Evidence the product could be profitable": ["Validate if your product or service will be profitable"],

  "Research goals and objectives": ["Define customer research goal and objectives"],
  "Research methods and tools selected": ["Define research methods and tools"],
  "Interview, survey or focus-group questionnaire": ["Develop interview, survey or focus-group plan"],
  "User personas": ["Develop customer/user personas"],
  "User requirement document": ["Identify customer/user goals and needs"],
  "Customer pain points": ["Identify customer's challenges and barriers"],
  "Customer perceived gains": ["Identify their motivation and values"],
  "Customer journey map": ["Map customer journey to achieve their goals"],
  "Prioritised product feature list": ["Define product requirement"],
  "Market opportunity": ["Market opportunity"],

  "Customer point-of-view statements": ["Create customer point-of-view statements"],
  "Value proposition map": ["Define value proposition"],
  "How-Might-We statements": ["Define How Might We (HMW) statement"],
  "Articulated actionable problem statement": ["Define How Might We (HMW) statement"],

  "Multiple ad-lib statements": ["Create multiple ad-lib statements"],
  "List of ideas": ["Create multiple ad-lib statements"],
  "Idea screening matrix": ["Develop idea screening matrix"],
  "Customer profile, value map and fit": ["Solution-customer/user fit"],
  "Prioritised feature list": ["Prioritise features list"],

  "Low-fidelity prototype or MVP": ["Create low-fidelity prototype or MVP"],
  "Updated project plan": ["Update project plan"],
  "Updated product requirement document": ["Update product requirement document"],
  "Hi-fidelity prototype": ["Build hi-fidelity prototype"],
  "Customer validation plan": ["Develop customer validation plan"],
  "Validation matrix": ["Develop customer validation plan"],
  // A finished report means the validation was carried out, so both tick.
  "Validation report": ["Conduct validation", "Analyse validation result"],
  "Go-to-market strategy document": ["Develop go-to-market strategy"],
}

/** True for a deliverable list that still carries the earlier names, i.e. one
 * that has not been moved onto the sub-activities yet. */
export function hasLegacyDeliverables(deliverables: string[]): boolean {
  return deliverables.some((d) => {
    const next = LEGACY_TICKS[d]
    return next !== undefined && !(next.length === 1 && next[0] === d)
  })
}

/** Ticks under the earlier names, rewritten as sub-activities. Anything not
 * recognised is kept as it is. */
export function migrateTicks(ticks: string[]): string[] {
  const out: string[] = []
  ticks.forEach((tick) => {
    ;(LEGACY_TICKS[tick] ?? [tick]).forEach((name) => {
      if (!out.includes(name)) out.push(name)
    })
  })
  return out
}
