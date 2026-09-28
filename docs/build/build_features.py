import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbuild import *

FIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagrams")
OUT = sys.argv[1]

TOC = [
    (1, "1.  Purpose of this document"),
    (1, "2.  How we decided what to build"),
    (2, "2.1  What the four priorities mean"),
    (1, "3.  What the plan adds up to"),
    (1, "4.  Must have"),
    (2, "4.1  Accounts and access"),
    (2, "4.2  Batch, teams and mentor allocation"),
    (2, "4.3  Milestones"),
    (2, "4.4  Deliverables"),
    (2, "4.5  Review and sign-off"),
    (2, "4.6  Meetings and actions"),
    (2, "4.7  Communication"),
    (2, "4.8  Dashboards"),
    (2, "4.9  Notifications and platform"),
    (1, "5.  Should have"),
    (1, "6.  Could have and later"),
    (1, "7.  What we are not building"),
    (1, "8.  Build order and weekly plan"),
    (1, "9.  Every measure and the features behind it"),
    (1, "10.  What has to be settled before we build"),
]

BLUE_ROW = FILL_BLUE


def build(page_map, out_path):
    doc = new_document()
    footer_page_numbers(doc, "PDM Project Space  |  Feature Plan and Priorities")

    cover(
        doc,
        "PDM Project Space",
        "Feature plan, priorities and the build order for the year",
        [
            ("Programme", "M.Tech Product Design and Management, IIIT Hyderabad"),
            ("Batch studied", "PDM 2025 to 2027, Semester 3 and Semester 4 final project"),
            ("Prepared by", "Sri Peri Charan and Keshav Dubey"),
            ("Date", "12 September 2026"),
            ("Document", "2 of 2. The companion document is the Current Process and Proposed Workflows."),
            ("Purpose", "Faculty review of the priorities before the next stage of building"),
        ],
        strapline="FINAL PROJECT  ·  SEMESTER 3 DELIVERABLE",
    )
    page_break(doc)

    doc.add_heading("Contents", level=1)
    contents(doc, TOC, page_map)
    page_break(doc)

    # ------------------------------------------------------------ 1
    doc.add_heading("1.  Purpose of this document", level=1)
    para(doc,
         "This is the build plan. It lists what we intend to make, in what order, and what each piece "
         "is supposed to fix. Problem references such as P3 and measure references such as K2 point "
         "back to the companion document.")
    para(doc,
         "We catalogued 162 features while working through the process. Listing all of them here would "
         "make this unreadable, so Sections 4 and 5 carry the ones we intend to build and the reasoning "
         "behind them, Section 6 summarises the rest by theme, and the complete list is kept in the "
         "project repository for anyone who wants it.")

    # ------------------------------------------------------------ 2
    doc.add_heading("2.  How we decided what to build", level=1)
    para(doc,
         "Every feature had to survive the same four questions. A feature that could not be traced back "
         "to a problem we had observed, and forward to a number that would show whether it worked, was "
         "not included.")
    figure(doc, f"{FIG}/11-feature-logic.png",
           "Figure 1. The test every feature had to pass before it went on the list.",
           max_width_cm=15.0)

    doc.add_heading("2.1  What the four priorities mean", level=2)
    table(doc,
          ["Priority", "What it means", "The test we applied"],
          [
              ["Must have", "The system is not usable or not believable without it this year.",
               "If we removed it, would a mentor or the coordinator stop using the tool at all?"],
              ["Should have", "Makes the core loop clearly better. Painful to leave out, but survivable.",
               "Would someone work around it with a minor annoyance?"],
              ["Could have", "Real value, lower urgency. Built if there is time.",
               "Would anyone notice it missing in the first week?"],
              ["Delighter", "Nobody asked for it. Memorable when it is there.",
               "Would someone show it to a colleague without being prompted?"],
          ],
          widths=[2.6, 7.2, 7.2],
          fills={0: FILL_RED, 1: FILL_AMBER, 2: FILL_BLUE, 3: FILL_GREEN},
          zebra=False)

    callout(doc,
            "A feature only reaches Must have if either the problem behind it is recorded in a document "
            "we hold, or the system cannot be built later without it. Anything resting purely on our own "
            "reading of the process is capped at Should have until an interview confirms it.",
            fill=FILL_GREY, text_colour=INK_RGB, label="The rule we held to")

    # ------------------------------------------------------------ 3
    doc.add_heading("3.  What the plan adds up to", level=1)
    table(doc,
          ["Priority", "Features", "Already working", "Notes"],
          [
              ["Must have", "40", "5", "Sections 4.1 to 4.9. All of it is planned for Weeks 6 to 12."],
              ["Should have", "57", "1", "Section 5. Re-ordered once the Week 3 to 6 interviews are done."],
              ["Could have", "46", "1", "Section 6. Held for the second half of the year."],
              ["Delighter", "17", "0", "Section 6. Only if the must and should work finishes early."],
              ["Total on the list", "160", "7", "Full list held in the project repository."],
          ],
          widths=[3.0, 2.0, 2.6, 9.4],
          fills={0: FILL_RED, 1: FILL_AMBER, 2: FILL_BLUE, 3: FILL_GREEN,
                 (4, 0): (FILL_WHITE, NAVY_RGB, True), (4, 1): (FILL_WHITE, NAVY_RGB, True),
                 (4, 2): (FILL_WHITE, NAVY_RGB, True), (4, 3): FILL_WHITE},
          zebra=False, align_center_cols=(1, 2))

    para(doc,
         "Two further features were catalogued and then ruled out, and Section 7 sets out twelve areas "
         "we are deliberately leaving alone.")
    para(doc,
         "Of the 40 must-have features, 38 rest on something recorded in a document we hold. The other "
         "two are on the list because the system cannot be retrofitted with them later, and both are "
         "named in Section 10.")

    page_break(doc)

    # ------------------------------------------------------------ 4
    doc.add_heading("4.  Must have", level=1)
    para(doc,
         "These forty define the working system. Nothing outside this list gets built until all of it "
         "is done. Five are already working in the prototype and are marked as such.")

    def must(heading, rows, anchor):
        doc.add_heading(heading, level=2)
        table(doc, ["Ref", "Feature", "Problem it removes", "Measure"],
              rows, widths=[1.3, 6.6, 6.1, 3.0], font_size=9,
              align_center_cols=(0, 3))

    must("4.1  Accounts and access", [
        ["A1", "Three roles: student, mentor, coordinator  (working)", "Everything below depends on knowing who is looking", "Enabler"],
        ["A2", "Permission checks on every action, not just hidden buttons", "A student must not be able to sign off their own work", "Enabler"],
        ["A3", "Real login, replacing the demonstration role switcher", "Nothing can be trusted as a record without it", "Enabler"],
        ["A4", "A mentor's rights come from their allocation, not a blanket mentor flag", "P14 mentors seeing work that is not theirs", "Enabler"],
        ["A5", "One person can hold both the mentor and coordinator roles", "The coordinator is also a mentor, so role has to be a view a person switches", "Enabler"],
    ], "a")

    must("4.2  Batch, teams and mentor allocation", [
        ["B1", "Batches with admission and graduation years  (working)", "Keeps 2025-27 separate from the batches that follow", "Enabler"],
        ["B2", "Student and mentor directory  (working)", "P17 nobody can see who is mentoring whom", "Enabler"],
        ["B3", "Teams of one to three students with a named lead", "P17, and the individual projects need to be handled properly", "Enabler"],
        ["B4", "A project record for each team  (working)", "The thing everything else hangs off", "Enabler"],
        ["B5", "Allocation recording both the preferred and the assigned mentor", "P17 teams do not know why they got the mentor they got", "Enabler"],
    ], "b")

    must("4.3  Milestones", [
        ["C1", "The twelve checkpoints held as data the coordinator can edit", "P1 the calendar only exists as a document", "K1, K10"],
        ["C2", "Every team gets its own copy of all twelve checkpoints", "P1, P7 nothing tracks a team against the calendar", "K1"],
        ["C3", "The status flow: not started, in progress, submitted, under review, returned, accepted, overdue", "P6 no record that a deliverable was accepted", "K1"],
        ["C4", "Week arithmetic from the batch start date, so the system knows what week it is", "P1 counting weeks by hand", "K1"],
        ["C5", "The named deliverables inside each checkpoint, as a checklist", "P1 the Week 14 bundle is nine separate artefacts", "K1"],
        ["C6", "A panel showing a team what is due next and in how many days", "P1 teams do not have a single place to look", "K1, K9"],
    ], "c")

    must("4.4  Deliverables", [
        ["D1", "Attach a Drive, Figma or GitHub link to a specific checkpoint", "P5 files spread across four places", "K7"],
        ["D2", "A submit action that timestamps the work and tells the mentor", "P9 no agreed way to submit", "K1, K2"],
        ["D3", "One page listing every artefact the project has produced", "P5 finding a document from three weeks ago", "K7"],
    ], "d")

    must("4.5  Review and sign-off", [
        ["E1", "Only the mentor can mark a checkpoint accepted", "P6 acceptance leaves no trace", "K1"],
        ["E2", "Written feedback stored against the checkpoint, permanently", "P2 feedback is spoken and then gone", "K2"],
        ["E3", "Return for rework, carrying the reason it was returned", "P6 a team does not always know what to change", "K2"],
        ["E4", "The full feedback history for a project, in order", "P2, P4 nobody can look up what was said", "K2, K8"],
    ], "e")

    must("4.6  Meetings and actions", [
        ["F1", "A meeting record: date, who was there, which project", "P15 no trace that a meeting happened", "K5"],
        ["F2", "Minutes stored against the project: discussed, decided, next", "P2 minutes are often not written", "K5"],
        ["F3", "Actions with a named owner and a due date", "P3 actions are not tracked between meetings", "K3"],
        ["F4", "An open since the last meeting list, shown to both sides", "P4 the mentor has to ask whether feedback was acted on", "K3, K8"],
    ], "f")

    must("4.7  Communication", [
        ["G1", "Announcements with a chosen audience: one team, my teams, or the batch", "P13 the same message sent six to eight times", "K6"],
        ["G2", "A mentor's teams as one addressable group with a shared thread", "P13, P14 no way to reach a mentoring line at once", "K6, K11"],
    ], "g")

    must("4.8  Dashboards", [
        ["H1", "The batch grid: 22 projects down, 12 checkpoints across, colour coded", "P7 the coordinator has no view of the batch", "K10, K4"],
        ["H2", "Click a cell to reach that checkpoint's work and its feedback", "P7 a status with no evidence behind it is not useful", "K10"],
        ["H3", "Filter the grid by mentor, status and domain", "P7 22 projects is too many to read at once", "K10"],
        ["H4", "A mentor's own board showing their 6 to 8 teams", "P12 the mentor tracks their teams from memory", "K4, K8"],
    ], "h")

    must("4.9  Notifications and platform", [
        ["I1", "Deadline reminders a week and a day before a checkpoint", "P1 deadlines are missed because nothing reminds anyone", "K1"],
        ["I2", "The mentor is told when a team submits", "P9 submissions can sit unnoticed", "K2"],
        ["I3", "The team is told when a mentor reviews", "P2 feedback lands silently", "K2"],
        ["J1", "Search and filter across projects  (working)", "P5 finding a project among 22", "K7"],
        ["J2", "A backend, so nothing is lost when the page reloads", "Everything above is meaningless without it", "K9"],
        ["J3", "A coordinator area for batches, roles and allocation", "P17 setup currently happens in a form and a spreadsheet", "K10"],
        ["J4", "A milestone template editor, so the calendar can change without a new release", "The next batch's curriculum splits the project differently", "K1"],
    ], "j")

    page_break(doc)

    # ------------------------------------------------------------ 5
    doc.add_heading("5.  Should have", level=1)
    para(doc,
         "Fifty-seven features sit at this level. They are grouped below by what they are for. Most of "
         "them depend on something an interview has to confirm first, which is why they are not in "
         "Section 4.")

    table(doc,
          ["Area", "What we would add", "Problem", "Measure"],
          [
              ["Access", "Institute login, per-project visibility settings, an audit trail of every status change and override",
               "P14", "Enabler"],
              ["Allocation", "Mentor load shown during allocation, support for two mentors on one project, roster import from the registration form",
               "P17", "Enabler"],
              ["Milestones", "A timeline view of the 28 weeks, per-team date adjustments with a recorded reason, an explicit gate at Week 16 and Week 28",
               "P1, P10", "K1"],
              ["Deliverables", "File upload rather than links only, every resubmission kept, nothing overwritten",
               "P5", "K7"],
              ["Review", "A review queue showing what is waiting on a mentor, a two-minute pre-read card before a meeting, comments on a specific part of a document, a marker for how each piece of feedback was addressed",
               "P4, P12", "K2, K8"],
              ["Meetings", "Proposed meeting slots instead of messages back and forth, an agenda drafted from open actions, mentor confirmation that an action is closed",
               "P15, P3", "K3, K5"],
              ["Communication", "Read state on announcements, a private team and mentor thread, a cohort question board so a question is answered once, a faculty-only channel, mentions, email mirroring",
               "P13, P18", "K6, K11"],
              ["Team working", "A task board per project, tasks linked to a checkpoint, an action promoted to a board card, a short weekly plan visible to the mentor",
               "P5", "K9"],
              ["Ideation", "Boards pre-loaded with the template each checkpoint asks for: personas, journey maps, how-might-we, screening matrix, value proposition map. Embedding an existing Miro or Figma board rather than rebuilding it",
               "P16", "Enabler"],
              ["Dashboards", "An attention-needed list built from overdue work, ageing actions and silence, a cohort progress summary, a panel showing the twelve measures",
               "P8", "K4, K9"],
              ["Archive", "Keeping the full checkpoint trail when a project completes, and a decision log of what was tried and dropped",
               "P11", "K12"],
              ["Notifications", "A single notification centre, action reminders, one weekly digest per role rather than a stream of alerts",
               "P1, P3", "K3"],
              ["Search", "Search across projects, feedback, minutes and artefacts",
               "P5", "K7"],
              ["Presentations", "Audience feedback from a community presentation flowing into the team's action list",
               "P11", "K3"],
          ],
          widths=[2.9, 8.4, 2.2, 3.5], font_size=9, align_center_cols=(2, 3))

    page_break(doc)

    # ------------------------------------------------------------ 6
    doc.add_heading("6.  Could have and later", level=1)
    para(doc,
         "Forty-six could-have features and seventeen delighters are held for the second half of the "
         "year. They are summarised here by theme rather than listed one by one.")

    table(doc,
          ["Theme", "What is held here"],
          [
              ["Allocation", "Students submitting ranked mentor preferences in the system, and a tool that suggests a balanced allocation."],
              ["Milestones", "Checkpoint dependencies, different tracks for research-heavy and build-heavy projects, a calendar feed of deadlines."],
              ["Review", "Scoring against the criteria for each checkpoint, saved responses for advice a mentor repeats, voice notes instead of typing."],
              ["Meetings", "Published office hours with self-service booking, recurring cadences, calendar integration, minutes drafted from rough notes."],
              ["Ideation", "Our own sticky-note board with live editing, dot voting that produces the Week 18 screening matrix directly, a timed jam session run inside the system."],
              ["Archive", "Search by domain, method and mentor. Importing the 22 projects from the 2022 batches. A batch showcase page. Handing a project to a later team with its history."],
              ["Presentations", "Scheduling the community presentation, slot sign-up, and attaching the recording to the checkpoint."],
              ["Integrations", "Google Drive picker, Figma embed, GitHub activity, Moodle handover, filing an email against a project."],
              ["Comfort", "Saved filters, a command palette, notification preferences and quiet hours."],
          ],
          widths=[2.8, 14.2], font_size=9)

    # ------------------------------------------------------------ 7
    doc.add_heading("7.  What we are not building", level=1)
    para(doc,
         "Two of these were tempting and were left out on judgement rather than for lack of time. They "
         "are marked.")
    table(doc,
          ["Not building", "Why"],
          [
              ["Marks, grades or any assessment record", "The programme owns assessment. A second, unofficial record of performance is a risk we should not create."],
              ["Effort or hours tracking", "Left out on judgement. Measuring how long students work turns a mentoring tool into a monitoring tool, and would cost us the goodwill this project depends on."],
              ["Comparing mentors on responsiveness", "Left out on judgement. Ranking four named faculty members is not a product feature. We would revisit only if the programme asked."],
              ["Video calling", "Meet, Zoom and Teams already do this. We hold the link."],
              ["Live document co-editing", "Docs and Figma do this better. We hold the link and the context around it."],
              ["A general whiteboard product", "Only the templates the checkpoints actually ask for, not a replacement for Miro."],
              ["Replacing WhatsApp", "Informal conversation stays where it already happens. We take the part that needs to be found again later."],
              ["Plagiarism checking", "Not part of the programme's stated needs."],
              ["Alumni networking and placements", "Adjacent, but a different product."],
              ["A portal for interviewees and customers", "People a team interviews are never users of this system."],
              ["Production hosting, support and uptime commitments", "The project commits to a validated prototype and a handover, not to running software."],
              ["Mobile apps", "Responsive web only, within this scope."],
          ],
          widths=[5.2, 11.8], font_size=9)

    # ------------------------------------------------------------ 8
    doc.add_heading("8.  Build order and weekly plan", level=1)
    para(doc,
         "Two things have to exist before anything else is worth building: the milestone calendar, and "
         "somewhere for the data to live. Everything useful follows shortly after them. We work at "
         "roughly ten person-hours a week between the two of us, and each week ends with something we "
         "can show.")

    figure(doc, f"{FIG}/10-build-order.png",
           "Figure 2. The order the work has to happen in.", max_width_cm=13.5)

    table(doc,
          ["Week", "What gets built", "Refs", "What we can show at the end of it"],
          [
              ["6", "The milestone calendar and each team's copy of it", "C1, C2, C4, C5, C6",
               "Open any of the 22 projects and see its twelve checkpoints, due weeks and what is due next, on real data"],
              ["7", "Status on every checkpoint, and the batch grid", "C3, H1, H3",
               "The 22 by 12 grid, colour coded, filterable by mentor"],
              ["8", "Login and a backend", "A2, A3, A5, J2",
               "Two different people log in and see the same data, and the coordinator switches to their mentor view"],
              ["9", "Submitting and signing off", "D1, D2, E1, E3, H2",
               "A team submits, a mentor accepts or returns it, and the grid cell changes"],
              ["10", "Feedback that stays", "E2, E4, H4, I2, I3",
               "The mentor board with a review queue, and a project's feedback history"],
              ["11", "The meeting loop", "F1, F2, F3, F4",
               "Open actions since the last meeting, answered without asking the team"],
              ["12", "One message, once", "G1, G2, I1, B3, B5",
               "A mentor reaches seven teams in one action, and deadline reminders go out"],
              ["13 onwards", "Should-have work, re-ordered by what the interviews found", "Section 5",
               "Reviewed with faculty before we commit to it"],
          ],
          widths=[1.6, 4.6, 3.0, 7.8], font_size=9, align_center_cols=(0,))

    para(doc,
         "Week 6 deliberately stops short of status changes and submissions. Those need the backend "
         "from Week 8 to mean anything, and a demonstration that pretends otherwise is worse than no "
         "demonstration.", italic=True)

    # ------------------------------------------------------------ 9
    doc.add_heading("9.  Every measure and the features behind it", level=1)
    para(doc,
         "This is the check on the whole plan. Each of the twelve measures from the companion document "
         "needs a feature that produces its data. The four in blue are the ones the project should be "
         "judged on.")

    krows = [
        ["K1", "On-time deliverable rate", "C1, C2, C3, C4, D2, I1", "Week 7"],
        ["K2", "Time from submission to feedback", "D2, E2, I2, I3", "Week 10"],
        ["K3", "Actions closed before the next meeting", "F3, F4", "Week 11"],
        ["K4", "Time to spot a project in trouble", "H1, H4, and the attention list in Section 5", "Week 13"],
        ["K5", "Meetings with minutes recorded", "F1, F2", "Week 11"],
        ["K6", "Effort to reach all of a mentor's teams", "G1, G2", "Week 12"],
        ["K7", "Deliverables retrievable from one place", "D1, D3, J1", "Week 9"],
        ["K8", "Repeat requests for context the system already holds", "E4, F4, H4", "Week 13"],
        ["K9", "Teams active in a given week", "C6, J2", "Week 8"],
        ["K10", "Time to produce a batch status view", "H1, H2, H3, J3", "Week 7"],
        ["K11", "Questions answered once and reused", "G2, and the question board in Section 5", "Week 13"],
        ["K12", "Use of earlier batches' work", "Archive work in Section 5", "Week 13"],
    ]
    kf = {}
    for i in range(4):
        for c in range(4):
            kf[(i, c)] = (BLUE_ROW, TEXT_NAVY, c in (0, 1))
    table(doc, ["Ref", "What we measure", "Features that move it", "Measurable from"],
          krows, widths=[1.2, 6.0, 6.6, 3.2], fills=kf, align_center_cols=(0, 3))

    callout(doc,
            "If K1, K2, K3 and K4 do not move, the rest of the plan does not matter. We would rather "
            "be told now that these are the wrong four than find out in Week 26.",
            fill=FILL_BLUE, label="")

    # ------------------------------------------------------------ 10
    doc.add_heading("10.  What has to be settled before we build", level=1)
    para(doc,
         "Six things change the plan depending on the answer. The first two change it substantially.")

    table(doc,
          ["Question", "What it affects", "What changes if the answer surprises us"],
          [
              ["How is a deliverable submitted today, and does anything have to go through Moodle?",
               "D1, D2, E1 and everything downstream",
               "If submissions must run through Moodle, roughly a third of this plan becomes an integration rather than a feature"],
              ["Is the stage model seven phases, twelve checkpoints, or nine stages?",
               "C1 to C6, the whole spine",
               "The checkpoints are held as editable data for exactly this reason, so the fix is configuration rather than rework"],
              ["Who records that a deliverable was accepted, and where does that record live?",
               "E1, E3, C3",
               "If a record already exists somewhere, we read it rather than create a second one"],
              ["Is there a reviewer or panel separate from the mentor?",
               "A1 to A5, the role model",
               "A fourth role with review-only access, added before permissions are written"],
              ["Do mentors want to see each other's projects, and what must stay private?",
               "A4, H1, H4",
               "Visibility becomes a setting rather than a default. We would not ship an open default"],
              ["Would an automatic flag on a slipping project help a mentor or undermine them?",
               "The attention list in Section 5",
               "The flag becomes visible only to the team and their own mentor, not to the programme"],
          ],
          widths=[6.2, 4.2, 6.6], font_size=9)

    doc.add_heading("Two features we have promoted without evidence", level=2)
    para(doc,
         "Thirty-eight of the forty must-have features rest on something recorded. These two do not. "
         "They are on the list because the system cannot be retrofitted with them later, and we would "
         "rather say so plainly than present them as settled.")
    table(doc,
          ["Ref", "Feature", "What we are assuming", "What we do if we are wrong"],
          [
              ["F4", "Open since the last meeting",
               "That mentors repeatedly have to ask whether earlier feedback was acted on",
               "Move it to should-have. Keep the actions, drop the dedicated view"],
              ["H4", "A mentor's own board",
               "That mentors currently track their teams from memory",
               "Move it to should-have and replace it with a filtered project list"],
          ],
          widths=[1.2, 4.0, 6.0, 5.8], font_size=9, align_center_cols=(0,))

    doc.save(out_path)


if __name__ == "__main__":
    import tempfile
    WORK = tempfile.mkdtemp(prefix="pdmdoc-")
    draft = os.path.join(WORK, "draft.docx")
    build({}, draft)
    pages = page_map_from_docx(draft, TOC, WORK)
    build(pages, OUT)
    missing = [t for _, t in TOC if t not in pages]
    print("written", OUT, "| headings located:", len(pages), "| missing:", missing)
