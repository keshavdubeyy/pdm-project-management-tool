import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docbuild import *

FIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "diagrams")
OUT = sys.argv[1]

TOC = [
    (1, "1.  Purpose of this document"),
    (1, "2.  The programme and the people involved"),
    (2, "2.1  What each group is responsible for"),
    (2, "2.2  Mentor allocation as we currently hold it"),
    (1, "3.  The project timeline"),
    (2, "3.1  Deliverables in full"),
    (1, "4.  How the process runs today"),
    (2, "4.1  The student team's week"),
    (2, "4.2  The mentor's week"),
    (2, "4.3  The coordinator's year"),
    (1, "5.  Where the process breaks"),
    (1, "6.  What we are proposing"),
    (2, "6.1  A deliverable has a state that only the mentor can close"),
    (2, "6.2  Meetings produce actions that carry forward"),
    (2, "6.3  One message reaches a mentor's whole group"),
    (1, "7.  Scope of the system"),
    (1, "8.  How we will measure whether this works"),
    (1, "9.  What we have confirmed and what we have not"),
    (2, "9.1  Confirmed from documents we hold or from the programme site"),
    (2, "9.2  Still to be confirmed, in the order it blocks us"),
    (1, "10.  What we are asking for in this review"),
    (1, "Appendix A.  Where the material in this document comes from"),
]

def build(page_map, out_path):
    doc = new_document()
    footer_page_numbers(doc, "Digitizing the PDM Final Project Lifecycle  |  Current Process and Proposed Workflows")

    # ------------------------------------------------------------------ cover
    cover(
        doc,
        "Digitizing the PDM Final Project Lifecycle",
        "Current process, proposed workflows and scope of the system",
        [
            ("Programme", "M.Tech Product Design and Management, IIIT Hyderabad"),
            ("Batch studied", "PDM 2025 to 2027, Semester 3 and Semester 4 final project"),
            ("Prepared by", "Sri Peri Charan and Keshav Dubey"),
            ("Date", "12 September 2026"),
            ("Document", "1 of 2. The companion document is the Feature Plan and Priorities."),
            ("Purpose", "Faculty review of the workflows and the scope before development continues"),
        ],
        strapline="FINAL PROJECT  ·  SEMESTER 3 DELIVERABLE",
    )
    page_break(doc)

    doc.add_heading("Contents", level=1)
    contents(doc, TOC, page_map)
    page_break(doc)

    # ------------------------------------------------------------------ 1
    doc.add_heading("1.  Purpose of this document", level=1)
    para(doc,
         "We are studying how the PDM final project runs from start to finish, so that we can decide "
         "what is worth building and what is not. This document records the process as we currently "
         "understand it, the points where it loses time or information, the changes we propose, and the "
         "measures we will use to judge whether those changes helped.")
    para(doc,
         "The process described here comes from four sources: the programme milestone sheet for 2026, "
         "the project registration form for this batch, the published programme pages on the institute "
         "website, and our own experience as students in the batch. Interviews with students, mentors "
         "and the coordinator run from Week 3 to Week 6 and will correct anything stated here.")
    para(doc,
         "Sections 8, 9 and 10 are the parts we would most like reviewed. Section 8 sets out the numbers "
         "we intend to move, Section 9 separates what we have confirmed from what we are still assuming, "
         "and Section 10 lists the questions we need answered before the next stage of work.")

    # ------------------------------------------------------------------ 2
    doc.add_heading("2.  The programme and the people involved", level=1)
    para(doc,
         "The final project runs across Semesters 3 and 4 and is worth 24 credits under the 2025 to 2027 "
         "curriculum, where it is registered as PD9.403 and PD9.404. Students become eligible after "
         "completing 28 credits. The current batch runs it as follows.")

    table(doc,
          ["Item", "Detail"],
          [
              ["Project teams", "22"],
              ["Team size", "19 teams of two students, 3 individual projects"],
              ["Students on projects", "41"],
              ["Faculty mentors", "4 mentoring lines, one of which is a pair of mentors working together"],
              ["Teams per mentor", "Between 6 and 8, as stated by the programme"],
              ["Programme coordinator", "1"],
              ["Duration", "28 teaching weeks with 12 dated deliverables"],
          ],
          widths=[5.2, 11.8])

    figure(doc, f"{FIG}/01-stakeholders.png",
           "Figure 1. Who is involved in the final project and what passes between them.",
           max_width_cm=12.5)

    doc.add_heading("2.1  What each group is responsible for", level=2)
    table(doc,
          ["Group", "What they do", "What they need to see"],
          [
              ["Student team", "Run the project, produce the twelve deliverables, meet the mentor and act on feedback.",
               "What is due next, what the mentor last said, and what they owe the mentor."],
              ["Faculty mentor", "Guide 6 to 8 teams, review work, give feedback and decide when a deliverable is good enough.",
               "The state of each of their teams before a meeting, and which ones are slipping."],
              ["Programme coordinator", "Own the calendar, run mentor allocation, watch progress across the batch and close the year.",
               "All 22 projects against all 12 checkpoints, in one place."],
              ["Later batches", "Use completed work as reference material.",
               "What earlier teams did, and why they made the choices they made."],
          ],
          widths=[3.4, 7.6, 6.0])

    doc.add_heading("2.2  Mentor allocation as we currently hold it", level=2)
    para(doc,
         "The batch registration form records both the mentor a team asked for and the mentor a team was "
         "given. The two are not always the same. The allocation we hold does not match the split the "
         "programme has described to us, and it does not include one of the named mentors at all.")

    table(doc,
          ["Mentor", "Teams in our data", "Note"],
          [
              ["Prakash Yalla", "6", "Matches the stated range."],
              ["Dr. Raman Saxena", "10", "Higher than the stated range of 6 to 8. Also listed on the programme site as Programme Coordinator."],
              ["Dr. Raghu Reddy", "6", "Works with Ramesh Loganathan on these teams."],
              ["Ramesh Loganathan", "Co-mentor", "Not allocated teams separately in the form."],
              ["Manisha", "Not in our data", "Named to us as a mentor but absent from the registration data and from the published faculty list."],
          ],
          widths=[4.2, 3.0, 9.8],
          fills={(1, 1): (FILL_AMBER, TEXT_AMBER, True), (4, 1): (FILL_RED, TEXT_RED, True)})

    callout(doc,
            "We need the authoritative allocation for 2025 to 2027, including Manisha's teams, before the "
            "directory in our prototype can be treated as a record rather than a draft.",
            fill=FILL_AMBER, text_colour=TEXT_AMBER, label="To confirm")

    page_break(doc)

    # ------------------------------------------------------------------ 3
    doc.add_heading("3.  The project timeline", level=1)
    para(doc,
         "The milestone sheet defines seven phases and twelve dated deliverables. Six of them fall in "
         "Semester 3 and six in Semester 4. The gap between Week 10 and Week 14 carries the largest "
         "single bundle of work, and the semester boundary at Week 16 is where the problem statement "
         "has to be settled before solution work begins.")

    figure(doc, f"{FIG}/02-timeline.png",
           "Figure 2. The twelve dated deliverables across the two semesters.",
           max_width_cm=13.0, max_height_cm=19.5)

    page_break(doc)
    doc.add_heading("3.1  Deliverables in full", level=2)
    table(doc,
          ["Due", "Phase", "What has to be handed in"],
          [
              ["Week 4", "Product scope", "Detailed project plan, with the product vision, the customer, the value, the competitors, the differentiator, and a risk plan"],
              ["Week 6", "Domain research", "Domain research report covering technical trends, competitors and existing products"],
              ["Week 8", "Customer discovery", "Customer validation report, with the assumptions tested against real customers"],
              ["Week 10", "Customer discovery", "Idea validation report, covering problem fit, willingness to pay and profitability"],
              ["Week 14", "Customer research", "Research tools, questionnaire, personas, user requirements, pain points, gains, journey map, prioritised feature list and market opportunity"],
              ["Week 16", "Problem definition", "Value proposition map and the actionable problem statement"],
              ["Week 18", "Ideation", "List of ideas, screening matrix, and the customer profile and value map fit"],
              ["Week 21", "Build", "Low-fidelity prototype or MVP"],
              ["Week 22", "Re-plan", "Updated project plan and updated product requirement document"],
              ["Week 25", "Hi-fidelity", "Hi-fidelity prototype"],
              ["Week 26", "User validation", "Validation matrix and validation report"],
              ["Week 28", "Go to market", "Go-to-market strategy document"],
          ],
          widths=[1.9, 3.2, 11.9],
          fills={i: FILL_BLUE for i in (4, 5)} if False else None)

    para(doc,
         "The sheet also carries a column headed Community Presentation against every milestone. It is "
         "blank for all twelve. We do not yet know whether that event is planned, run informally, or no "
         "longer part of the programme.", italic=True, colour=GREY_RGB)

    page_break(doc)

    # ------------------------------------------------------------------ 4
    doc.add_heading("4.  How the process runs today", level=1)
    para(doc,
         "The three workflows below describe the same fortnight from three points of view. Boxes shaded "
         "red are the steps where work is repeated, information is lost, or nobody can see what happened.")
    legend(doc, [(FILL_RED, "Loses time or information"), (FILL_GREY, "Works as intended")])

    doc.add_heading("4.1  The student team's week", level=2)
    figure(doc, f"{FIG}/03-student-week.png",
           "Figure 3. What a team does in a normal week and when a deliverable falls due.")
    para(doc, "What goes wrong here:")
    bullets(doc, [
        ("The calendar is a PDF. ", "A team has to open a document and count weeks to know what is due next."),
        ("Files end up in four places. ", "Drive, a laptop, Figma and a chat thread. Finding a document from three weeks ago is slow."),
        ("The mentor update is rebuilt every time. ", "Nothing carries forward from the last meeting, so the same summary is written again."),
        ("Actions agreed in a meeting are often not written down. ", "They are remembered, or they are not."),
        ("There is no fixed way to submit. ", "It varies by mentor, and nothing records that a deliverable was accepted."),
    ])

    page_break(doc)
    doc.add_heading("4.2  The mentor's week", level=2)
    figure(doc, f"{FIG}/04-mentor-week.png",
           "Figure 4. How a mentor moves through 6 to 8 teams in a week.")
    para(doc, "What goes wrong here:")
    bullets(doc, [
        ("Which team needs attention is held in the mentor's head. ", "There is no list, so a quiet team can go unnoticed for weeks."),
        ("There is no pre-read. ", "The first ten minutes of a meeting are spent re-establishing where the team had reached."),
        ("Feedback is spoken and then gone. ", "It cannot be looked up, and a student cannot check what was said."),
        ("The mentor has to ask whether last time's feedback was acted on. ", "Across four mentors, roughly 25 teams and 28 weeks, that question is asked several hundred times a year."),
        ("One message goes out six to eight times. ", "There is no way to address all of a mentor's teams at once."),
    ])

    page_break(doc)
    doc.add_heading("4.3  The coordinator's year", level=2)
    figure(doc, f"{FIG}/05-coordinator.png",
           "Figure 5. How the programme is set up, run and closed.")
    para(doc, "What goes wrong here:")
    bullets(doc, [
        ("Progress is second-hand. ", "The coordinator learns how a project is doing by asking its mentor, or by waiting for the next checkpoint."),
        ("Problems surface late. ", "A team that stalls in Week 11 may not be visible until Week 14. That is two to four weeks of a 28-week project."),
        ("Completion is not defined in writing. ", "There is no recorded criterion for when a project is finished, and no stated outcome for one that is not."),
        ("The archive keeps the poster and drops the work. ", "The published archive stores a title, a summary, the team names and a poster image. Nothing else survives."),
    ])

    callout(doc,
            "The published PDM graduation projects page holds 22 completed projects from the January 2022 "
            "and July 2022 batches. For each one it records the title, a short product summary, the student "
            "names and a poster. There are no reports, no research, no prototypes and no search.",
            fill=FILL_BLUE, label="Checked on the programme site:")

    page_break(doc)

    # ------------------------------------------------------------------ 5
    doc.add_heading("5.  Where the process breaks", level=1)
    para(doc,
         "These are the problems we have identified so far, ordered by how much they cost the programme. "
         "The last column states how confident we are: Recorded means a document we hold says so, "
         "Partly means it is named as an open question in our proposal, and Assumed means it is our own "
         "reading and still has to be tested in interviews.")

    legend(doc, [(FILL_RED, "High cost"), (FILL_AMBER, "Medium cost"), (FILL_GREEN, "Low cost")])

    R = (FILL_RED, TEXT_RED, True)
    A = (FILL_AMBER, TEXT_AMBER, True)
    G = (FILL_GREEN, TEXT_GREEN, True)

    rows = [
        ["P1", "The milestone calendar exists only as a document, so nothing can act on it", "Everyone", "High", "Recorded"],
        ["P2", "Feedback given in a meeting is not written down anywhere", "Student, Mentor", "High", "Partly"],
        ["P3", "Actions agreed in a meeting are not tracked to the next meeting", "Student, Mentor", "High", "Partly"],
        ["P4", "The mentor has to ask again whether earlier feedback was acted on", "Mentor", "High", "Partly"],
        ["P5", "Project files are spread across Drive, laptops, Figma and chat", "Student, Mentor", "High", "Partly"],
        ["P6", "There is no record that a deliverable was accepted", "Everyone", "High", "Assumed"],
        ["P7", "The coordinator sees progress only through mentors or at checkpoints", "Coordinator", "High", "Partly"],
        ["P8", "A project going off track is noticed two to four weeks late", "Coordinator, Student", "High", "Assumed"],
        ["P9", "There is no agreed way to submit a deliverable", "Student", "High", "Assumed"],
        ["P10", "Completion criteria are not written down", "Everyone", "High", "Recorded"],
        ["P11", "Only the poster survives when a project is archived", "Later batches", "High", "Recorded"],
        ["P12", "The mentor works out which teams need attention from memory", "Mentor", "Medium", "Assumed"],
        ["P13", "A mentor sends the same message to each team separately", "Mentor", "Medium", "Assumed"],
        ["P14", "Mentors cannot see how teams under other mentors are doing", "Mentor", "Medium", "Partly"],
        ["P15", "Meeting times are fixed through back-and-forth messages", "Both", "Medium", "Assumed"],
        ["P16", "Ideation work sits in outside tools and is submitted as a link", "Student, Mentor", "Medium", "Assumed"],
        ["P17", "Allocation is opaque: teams do not know why they got the mentor they got", "Student", "Medium", "Partly"],
        ["P18", "Announcements have no read state", "Coordinator", "Low", "Assumed"],
    ]
    fills = {}
    for i, r in enumerate(rows):
        fills[(i, 3)] = R if r[3] == "High" else (A if r[3] == "Medium" else G)
        fills[(i, 4)] = (FILL_GREEN, TEXT_GREEN, False) if r[4] == "Recorded" else (
            (FILL_BLUE, TEXT_NAVY, False) if r[4] == "Partly" else (FILL_GREY, GREY_RGB, False))

    table(doc, ["Ref", "Problem", "Who it affects", "Cost", "How sure"],
          rows, widths=[1.0, 8.4, 3.0, 1.8, 2.0], fills=fills,
          align_center_cols=(0, 3, 4))

    page_break(doc)

    # ------------------------------------------------------------------ 6
    doc.add_heading("6.  What we are proposing", level=1)
    para(doc,
         "Three changes cover most of the cost above. Each one replaces something that currently happens "
         "in a person's memory or in a chat thread with something the system holds.")

    doc.add_heading("6.1  A deliverable has a state that only the mentor can close", level=2)
    para(doc,
         "Every team gets its own copy of all twelve checkpoints. The team can move a deliverable as far "
         "as Submitted. Only the mentor can mark it Accepted, and the date and the person are recorded "
         "when they do. A returned deliverable carries the reason it was returned. This answers P1, P6 "
         "and P9, and it is what makes a programme-wide view possible at all.")
    figure(doc, f"{FIG}/06-milestone-status.png",
           "Figure 6. The states a deliverable moves through. Green is the only state a student cannot set.",
           max_width_cm=11.5)

    page_break(doc)
    doc.add_heading("6.2  Meetings produce actions that carry forward", level=2)
    para(doc,
         "A meeting is recorded against the project, decisions are saved as minutes, and each action gets "
         "an owner and a due date. Open actions appear at the top of the next meeting's agenda without "
         "anyone assembling them. This answers P2, P3 and P4, which together are the most expensive "
         "problems in the list.")
    figure(doc, f"{FIG}/07-meeting-loop.png",
           "Figure 7. The meeting loop today and as proposed.")

    page_break(doc)
    doc.add_heading("6.3  One message reaches a mentor's whole group", level=2)
    para(doc,
         "A mentor writes an announcement once and chooses who sees it: one team, all of their teams, or "
         "the whole batch. It is delivered inside the system and mirrored to email, it shows who has read "
         "it, and it stays attached to the project instead of scrolling away. This answers P13 and P18.")
    figure(doc, f"{FIG}/08-communication.png",
           "Figure 8. Sending one message to seven teams, today and as proposed.",
           max_width_cm=14.5)
    para(doc,
         "We are not trying to replace WhatsApp. Informal conversation will stay where it already is. "
         "What we are moving into the system is the part WhatsApp handles badly: messages that need to be "
         "found again later, and messages that are tied to a specific project or deadline.")

    page_break(doc)

    # ------------------------------------------------------------------ 7
    doc.add_heading("7.  Scope of the system", level=1)
    para(doc,
         "The proposal for this project commits to a validated prototype and a handoff document rather "
         "than production software. The boundaries below reflect that, and they also reflect two "
         "decisions we have taken deliberately.")

    figure(doc, f"{FIG}/09-scope.png",
           "Figure 9. What the system covers, what it connects to, and what it leaves alone.")

    table(doc,
          ["Area", "Decision", "Reason"],
          [
              ["Marks, grades, assessment records", "Out", "The programme owns assessment. A second, unofficial record of student performance would be a risk, and nobody has asked for it."],
              ["Effort or hours tracking", "Out", "Measuring how long students work turns a mentoring tool into a monitoring tool and would cost us the goodwill the project depends on."],
              ["Comparing mentors on responsiveness", "Out", "Ranking four named faculty members is not a product feature. We would only revisit this if the programme asked for it."],
              ["Video calls, document editing, design files", "Connect, do not rebuild", "Meet, Drive and Figma already do these well. We hold the links and the context around them."],
              ["Whiteboards and sticky-note work", "Connect first", "We will embed existing boards before building our own, and only build the templates the milestones actually ask for."],
              ["Login", "Connect", "Institute accounts, once the system is real. The role switcher in the current prototype is a demonstration device only."],
          ],
          widths=[4.0, 3.4, 9.6])

    page_break(doc)

    # ------------------------------------------------------------------ 8
    doc.add_heading("8.  How we will measure whether this works", level=1)
    para(doc,
         "These are the numbers we intend to move. Most of them have no baseline today because nothing "
         "measures them, so the first job of the system is to establish one. The four marked in blue are "
         "the ones that decide whether the project was worth doing. If those do not move, the rest does "
         "not matter.")

    kpi_rows = [
        ["K1", "On-time deliverable rate\nShare of the twelve checkpoints submitted in their due week",
         "Not measured", "Baseline, then a 20 point improvement", "P1, P9", "Week 7"],
        ["K2", "Time to feedback\nHours from a team submitting to the mentor responding",
         "Not measured", "Under 72 hours", "P2, P6", "Week 10"],
        ["K3", "Action closure rate\nShare of agreed actions closed before the next meeting",
         "Not measured", "Above 70 percent", "P3, P4", "Week 11"],
        ["K4", "Time to spot a project in trouble\nDays between a project stalling and someone noticing",
         "Two to four weeks", "Under 7 days", "P7, P8", "Week 13"],
        ["K5", "Meetings with minutes recorded", "Believed low", "Above 80 percent", "P2, P3", "Week 11"],
        ["K6", "Effort to reach all of a mentor's teams", "6 to 8 separate messages", "1 action", "P13", "Week 12"],
        ["K7", "Deliverables retrievable from one place", "Believed low", "All submitted work", "P5", "Week 9"],
        ["K8", "Repeat requests for context a mentor already has", "Not measured", "Falling each month", "P4, P12", "Week 13"],
        ["K9", "Teams active in a given week", "Not measured", "Above 80 percent", "P8", "Week 8"],
        ["K10", "Time to produce a batch status view", "Hours, by asking mentors", "Under a minute", "P7", "Week 7"],
        ["K11", "Questions answered once and reused by other teams", "Not applicable", "Above 40 percent of answered questions", "P14", "Week 13"],
        ["K12", "Use of earlier batches' work by a new batch", "Believed near zero", "Baseline, then growth", "P11", "Week 13"],
    ]
    kfills = {}
    for i in range(4):
        kfills[(i, 0)] = (FILL_BLUE, TEXT_NAVY, True)
        kfills[(i, 1)] = FILL_BLUE
        kfills[(i, 2)] = FILL_BLUE
        kfills[(i, 3)] = (FILL_BLUE, TEXT_NAVY, True)
        kfills[(i, 4)] = FILL_BLUE
        kfills[(i, 5)] = FILL_BLUE

    table(doc,
          ["Ref", "What we measure", "Where it stands", "Target", "Problems it tracks", "Measurable from"],
          kpi_rows, widths=[1.0, 5.6, 2.9, 3.3, 2.1, 2.1], fills=kfills,
          align_center_cols=(0, 5), font_size=8.5)

    para(doc,
         "Every feature in the companion document is tied to one of these twelve. A feature that cannot "
         "be tied to one of them does not get built.", bold=True, colour=NAVY_RGB)

    page_break(doc)

    # ------------------------------------------------------------------ 9
    doc.add_heading("9.  What we have confirmed and what we have not", level=1)

    doc.add_heading("9.1  Confirmed from documents we hold or from the programme site", level=2)
    table(doc,
          ["#", "Statement", "Source"],
          [
              ["1", "The project runs 28 weeks with 12 dated deliverables in 7 phases", "Milestone sheet 2026"],
              ["2", "The deliverable required at each checkpoint is fixed and known", "Milestone sheet 2026"],
              ["3", "The batch has 22 teams, mostly pairs, with three individual projects", "Batch registration form"],
              ["4", "Teams state a preferred mentor and are given an assigned mentor, and the two can differ", "Batch registration form"],
              ["5", "Mentor load is uneven across the four mentoring lines", "Batch registration form"],
              ["6", "The final project is 24 credits under this batch's curriculum, as PD9.403 and PD9.404", "Programme academics page"],
              ["7", "The next batch's curriculum splits the project differently, with an internship alternative", "Programme academics page"],
              ["8", "The programme coordinator is also one of the mentoring faculty", "Programme about page"],
              ["9", "The published archive stores only title, summary, students and poster", "Programme graduation projects page"],
              ["10", "Completion criteria, the reviewer role and archival policy are not documented anywhere", "Absent from all sources"],
          ],
          widths=[0.9, 10.6, 5.5], align_center_cols=(0,))

    doc.add_heading("9.2  Still to be confirmed, in the order it blocks us", level=2)
    para(doc,
         "The five marked in amber block work that is otherwise ready to start. We would like these "
         "answered in the Week 6 session.")

    vrows = [
        ["V1", "Is the stage model seven phases, twelve checkpoints, or the nine stages the programme sometimes refers to?", "Coordinator", "Blocking"],
        ["V2", "How is a deliverable submitted today, and does anything have to go through Moodle?", "Mentors, Coordinator", "Blocking"],
        ["V3", "Who records that a deliverable was accepted, and where does that record live?", "Mentors, Coordinator", "Blocking"],
        ["V4", "Is there a reviewer or panel separate from the mentor?", "Coordinator", "Blocking"],
        ["V5", "What is the authoritative mentor allocation for this batch, including Manisha?", "Coordinator", "Blocking"],
        ["V6", "Are minutes of meetings written today, by whom, and where do they go?", "Students, Mentors", "Week 3 and 5"],
        ["V7", "How does a mentor currently notice that a team is falling behind?", "Mentors", "Week 5"],
        ["V8", "Do mentors want to see other mentors' projects, and do they want theirs seen?", "Mentors", "Week 5"],
        ["V9", "What has to stay private between a team and its mentor?", "Mentors, Students", "Week 5"],
        ["V10", "Would an automatic flag on a slipping project help a mentor or undermine them?", "Mentors", "Week 5"],
        ["V11", "What tools do teams use today, and which would they refuse to give up?", "Students", "Week 3"],
        ["V12", "Does the coordinator want a live view, or is a periodic report enough?", "Coordinator", "Week 6"],
        ["V13", "What happens to a project that is not finished?", "Coordinator", "Week 6"],
        ["V14", "Does anyone actually look at earlier batches' projects, and for what?", "Alumni, Coordinator", "Week 4 and 6"],
        ["V15", "Is the community presentation planned, informal, or no longer run?", "Coordinator", "Week 6"],
        ["V16", "Would faculty use a whiteboard inside the system, or will they always use Miro or Figma?", "Mentors, Students", "Week 3 and 5"],
        ["V17", "Are there institute rules about where student project data may be held?", "Coordinator", "Week 6"],
    ]
    vfills = {}
    for i, r in enumerate(vrows):
        if r[3] == "Blocking":
            vfills[(i, 3)] = (FILL_AMBER, TEXT_AMBER, True)
    table(doc, ["Ref", "Question", "Who can answer it", "When"],
          vrows, widths=[1.0, 9.8, 3.4, 2.8], fills=vfills, align_center_cols=(0, 3))

    page_break(doc)

    # ------------------------------------------------------------------ 10
    doc.add_heading("10.  What we are asking for in this review", level=1)
    para(doc, "We would value a response on five points.")
    numbered(doc, [
        "Is the process in Sections 4 and 5 recognisable? Tell us where it is wrong, and what we have missed entirely.",
        "Of the eighteen problems in Section 5, which three matter most to you? We will build against your answer rather than our ordering.",
        "Section 6 proposes that only a mentor can mark a deliverable accepted, and that the record is kept. Is that the right rule, and is it something you would be willing to do each time?",
        "Section 7 states what we will not build. Is anything there that you expected us to cover?",
        "Section 8 lists the measures. Are they the right things to be judged on, and is there a measure the programme already cares about that we have not included?",
    ])
    para(doc,
         "The answers to Section 9.2 also decide what we build next. Five of those questions are holding "
         "up work that is otherwise ready to start.")

    doc.add_heading("Appendix A.  Where the material in this document comes from", level=1)
    table(doc,
          ["Source", "Used for"],
          [
              ["PDM Project Milestones, Activities, Deliverable and Suggested Timelines, 2026", "Sections 3 and 3.1, the full deliverable list and due weeks"],
              ["PDM 2025 to 2027 batch project registration form", "Section 2, team composition and mentor allocation"],
              ["Proposal: Digitizing the PDM Final Project Lifecycle", "Sections 5 and 7, the open questions and the scope commitment"],
              ["Research Plan and Participant List, Weeks 3 to 6", "Section 9.2, who answers which question and when"],
              ["pdm.iiit.ac.in, academics and about pages", "Section 2 and 9.1, credits, course codes and faculty roles"],
              ["pdm.iiit.ac.in, graduation projects page", "Section 4.3 and 9.1, what the archive stores"],
              ["Review of comparable tools in use elsewhere", "Section 6, the patterns we have borrowed rather than invented"],
          ],
          widths=[7.0, 10.0])

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
