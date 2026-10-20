# -*- coding: utf-8 -*-
# Validation report of the SRS "ESL Management System" (Mitu Vladlen, FAF-232), reviewed by Obrijan Filip.
# Separate deliverable: it is not part of the PBL report.

TITLE = "SRS VALIDATION REPORT"
SUBTITLE = ("Review of the Software Requirements Specification “ESL Management System” "
            "by Mitu Vladlen, FAF-232")

ABBREVIATIONS = [
    ("DC", "Design Constraint"),
    ("ERP", "Enterprise Resource Planning, the management system of a company"),
    ("ESL", "Electronic Shelf Label"),
    ("FR", "Functional Requirement"),
    ("MVP", "Minimum Viable Product"),
    ("NFR", "Non-Functional Requirement"),
    ("POS", "Point of Sale, the checkout system of a store"),
    ("SRS", "Software Requirements Specification"),
    ("UC", "Use Case"),
    ("US", "User Story"),
]

REFS = {
    'wiegers': 'K. Wiegers and J. Beatty, Software Requirements, 3rd ed. Redmond, WA, USA: Microsoft Press, 2013.',
}

W5 = [1.5, 2.6, 6.6, 1.8, 5.5]       # ID, location, observation, severity, proposed solution
HDR5 = ["ID", "Location", "Observation", "Severity", "Proposed solution"]

BLOCKS = [
('h1', "1 INTRODUCTION"),
('p', "This report presents the validation of the software requirements specification (SRS) of the ESL Management "
      "System, written by Mitu Vladlen, FAF-232. The system is a desktop application that replaces paper price labels "
      "in a store with electronic shelf labels, simulated in the first version. Two versions of the document were "
      "received: the first one (8 pages) contains the informal requirements, their clarification, the functional and "
      "non-functional requirements, user stories, use cases and diagrams; the second one (11 pages) adds section 4, "
      "with the quality attributes and design constraints. The review was carried out on the second version, which "
      "is the current one."),
('p', "The purpose of the review is to find the problems that would make the requirements hard to implement or "
      "impossible to verify, and to propose concrete corrections. The document was checked against the "
      "characteristics of good requirements described in ISO/IEC/IEEE 29148: each requirement should be necessary, "
      "unambiguous, complete, consistent, feasible, verifiable and traceable [@ieee29148]. The classification of the "
      "non-functional requirements was compared with the product quality model of ISO/IEC 25010:2023 [@iso25010], "
      "and the review practices recommended by Wiegers and Beatty were used to formulate the findings as "
      "observations followed by a proposed solution [@wiegers]."),
('p', "Each finding has an identifier (R-01 to R-23), its location in the reviewed document, a description, a "
      "severity and a proposed solution. The severity shows the effect on the project: high means that the "
      "requirement cannot be implemented or tested as written, or that two parts of the document contradict each "
      "other; medium means that the developer would have to guess an important detail; low means a matter of "
      "wording, terminology or presentation. Chapter 2 summarises the strong points of the document and the remarks on its "
      "presentation, Chapter 3 lists the findings by category, Chapter 4 documents the conflicts between quality attributes, and Chapter 5 "
      "gives the recommendations and the overall conclusion."),

('h1', "2 OVERVIEW OF THE REVIEWED SRS"),
('p', "Before the problems, it is fair to note that the document is well built and covers all the parts required "
      "by the assignment. It starts from a realistic statement of a store manager, which makes the motivation of the "
      "project easy to understand, and moves step by step from informal wishes to a structured specification. "
      "Table 2.1 summarises the content of the document and the assessment of each part."),
('table', "Table 2.1 – Structure of the reviewed SRS and assessment of each part",
    ["Section", "Content", "Assessment"],
    [["1. Informal requirements", "Statement of the store manager and five informal requirements", "Clear and realistic; gives a good basis for the clarification"],
     ["2. Clarification", "Questions and decisions, goals G1–G4, constraints C1–C5, four key user flows", "Strong part of the document; the decisions fix the scope of the MVP"],
     ["3.1–3.2 Description and actors", "Purpose, scope, environment, assumptions, five actors", "Complete; the Scheduler as an actor needs clarification (R-23, P-01)"],
     ["3.3 Functional requirements", "FR-01 to FR-14 with actor and priority", "Well formulated with “shall”, but without acceptance criteria (R-10)"],
     ["3.4 Non-functional requirements", "NFR-01 to NFR-07", "Duplicates section 4.1 with different numbering (R-01)"],
     ["3.5–3.6 User stories and use cases", "Seven user stories, three detailed use cases", "Good alternative flows; stories lack acceptance criteria (R-11, R-15)"],
     ["3.7 Diagrams", "Context diagram and use case diagram", "Readable; correct use of generalisation and «include»"],
     ["4. Quality attributes", "NFR-01 to NFR-13 with ISO/IEC 25010:2023 classes, criteria, verification; DC-01 to DC-05", "Very good: measurable criteria and a verification method for each requirement"]],
    [4.0, 6.6, 7.4]),
('p', "The strongest parts are the clarification table and section 4. Every non-functional requirement in section 4 "
      "has a numeric criterion and a way of checking it, the 2023 names of the ISO/IEC 25010 characteristics are used "
      "correctly, and the design constraints are justified. The use cases also include alternative flows, which "
      "many specifications forget. Most of the findings below therefore concern consistency between sections rather "
      "than the quality of individual statements."),
('p', "The presentation of the document needs only small improvements. The two diagrams are clear and use the UML "
      "notation correctly; the remaining remarks, given in Table 2.2, concern details that help the reader rather "
      "than errors in the content, so they are kept separate from the findings of Chapter 3."),
('table', "Table 2.2 – Remarks on the diagrams and the presentation of the document",
    ["ID", "Location", "Remark", "Proposed solution"],
    [["P-01", "Context diagram", "The Scheduler is drawn as an external entity, although scheduling is listed inside the system box; the arrows carry no labels, so the exchanged data are not visible", "Show the Scheduler as a time trigger or inside the system; label the arrows (price updates, confirmations, status)"],
     ["P-02", "Whole document", "No glossary (ESL, ERP, POS, MVP), no version history and no references; the full name of the author is missing on the first page", "Add a title page with full name and version, a glossary and the referenced standards"]],
    [1.5, 3.0, 7.0, 6.5]),
('p', "Both remarks take little time to correct, but they make the document easier to read for someone who did not "
      "take part in its preparation, which is the usual situation for an SRS."),

('h1', "3 FINDINGS"),
('p', "The findings are grouped into the three categories required by the review: ambiguous or contradictory "
      "requirements, missing verification criteria, and inconsistencies between functional and non-functional "
      "requirements. In total, 23 findings were recorded: 8 of high, 9 of medium and 6 of low severity."),
('p', "None of the findings questions the idea of the system or its scope. Most of them can be corrected by adding "
      "one sentence or one requirement, and the proposed solutions are written so that they can be copied into the "
      "next version of the document almost unchanged."),

('h2', "3.1 Ambiguous or contradictory requirements"),
('p', "A requirement is ambiguous when two readers can understand it differently, and contradictory when two parts "
      "of the document cannot both be true. Table 3.1 lists the first group of such problems, related to terminology and to "
      "the behaviour of prices. The most serious one is the double numbering of the non-functional requirements "
      "(R-01), because every later reference to an NFR becomes uncertain."),
('table', "Table 3.1 – Ambiguous or contradictory requirements: terminology and pricing rules",
    HDR5,
    [["R-01", "Sections 3.4 and 4.1", "The same identifiers mean different requirements: NFR-04 is security in 3.4 and interaction capability in 4.1, NFR-06 is maintainability in 3.4 and reliability in 4.1, NFR-07 is portability in 3.4 and recoverability in 4.1", "High", "Keep a single list of NFRs (section 4.1) and replace section 3.4 with a reference to it"],
     ["R-02", "Section 1, FR-03, FR-12", "The label shows “weight”, while the product has “net quantity, unit”; unclear for goods sold by piece or by litre", "Low", "Use one term, “net quantity with unit”, in all sections"],
     ["R-03", "FR-08", "“With a single action” does not say whether labels update on save or after a separate command; the actor is the manager for a behaviour of the system", "Medium", "“When a price or product detail is saved, the system sends the new content to all labels of the product without further action”"],
     ["R-04", "FR-09, FR-10", "No rule for overlapping events: a scheduled price change during an active discount, or two discounts on the same product", "High", "Add a requirement: overlapping discounts are refused; a discount always applies to the current regular price"],
     ["R-05", "UC-02, step 3a", "“Between 0 and 100” does not say whether 0% and 100% are valid", "Low", "“The percentage is greater than 0 and less than 100”"]],
    W5),
('p', "Findings R-03 and R-04 are related: both are about what exactly happens on the shelf when a price changes. "
      "Without a precise rule, two developers could build two different systems that both satisfy the text."),
('p', "The second group, in Table 3.2, concerns the scope of the MVP: the store layout, the goals, the simulated "
      "labels and the data shown on them."),
('table', "Table 3.2 – Ambiguous or contradictory requirements: scope and data",
    HDR5,
    [["R-06", "C3, section 3.1, DC-04", "The layout is “predefined in the system” in one place and “loaded by the administrator” in others; no FR describes the loading or its format", "Medium", "Add an FR for loading the layout from a file with a defined format, or state that it is built into the application"],
     ["R-07", "G2 and C5", "Goal G2 (no mismatch between shelf and checkout prices) cannot be reached or checked without the POS integration excluded by C5", "High", "For the MVP: “the price on every online label equals the price in the database”; keep G2 for the integration phase"],
     ["R-08", "FR-13, C2, DC-03", "Battery level and offline state are required for labels that only exist as a simulation; key flow 4 says the manager “fixes the issue” without saying how", "Medium", "State that the simulator can be switched to offline or low-battery state, and define the manager's action (retry, reassign)"],
     ["R-09", "FR-12, FR-14, FR-03", "Labels show an expiration date and FR-14 filters by it, but no FR lets a user enter it and FR-03 does not include it", "High", "Add the expiration date (per product or per batch) to FR-03 and say who enters it"]],
    W5),
('p', "Findings R-04 and R-09 deserve attention before implementation. Without a rule for overlapping discounts the "
      "developer has to invent one, and the result may surprise the store manager; without a field for the "
      "expiration date, FR-12 and FR-14 cannot be implemented at all."),

('h2', "3.2 Missing verification criteria"),
('p', "A requirement is verifiable when a test can show whether it is met. Section 4 of the reviewed document is "
      "very good in this respect, but the functional part is not: the functional requirements and the user stories "
      "have no acceptance criteria, and several values are left open. Table 3.3 lists these gaps."),
('table', "Table 3.3 – Missing verification criteria",
    HDR5,
    [["R-10", "Section 3.3", "The 14 FRs have no acceptance criteria and no link to test cases; only the NFRs are measurable", "High", "Add a criterion to every FR, e.g. FR-04: “a barcode with 7 or 15 digits, or one already in use, is rejected with an error message”"],
     ["R-11", "Section 3.5", "The user stories have no acceptance criteria", "Medium", "Add Given/When/Then criteria, e.g. US-02: “given a change planned for 00:00, when that time comes, then all labels show the new price within 5 s”"],
     ["R-12", "FR-09, US-02", "The precision of a scheduled change is not defined", "Medium", "“A scheduled change is applied at most 60 seconds after the planned time”"],
     ["R-13", "Priority column", "The scale High/Medium/Low is not defined and not linked to the MVP", "Low", "Define the scale (e.g. MoSCoW) and mark which FRs belong to the MVP"],
     ["R-14", "NFR-01 (section 4.1)", "The criterion holds for products with up to 10 labels; nothing is said about products with more", "Low", "Set a maximum number of labels per product, or add a criterion for larger groups"],
     ["R-15", "Section 3.6, use case diagram", "Only 3 of the 10 use cases are detailed; FR-14 (expiring products) has no use case at all, and there is no FR ↔ UC ↔ test matrix", "Medium", "Detail the remaining main use cases and add a traceability matrix"]],
    W5),
('p', "Correcting R-10 is the change with the largest effect on the quality of the document. It also makes the "
      "later testing chapter much easier, since each functional requirement will already have the condition that "
      "its test must check."),

('h2', "3.3 Inconsistencies between functional and non-functional requirements"),
('p', "A non-functional requirement should describe the quality of functions that already exist in the functional "
      "part. In the reviewed document, several NFRs introduce new behaviour that no functional requirement describes, "
      "and some of them cannot be met together with the use cases. Table 3.4 lists these inconsistencies."),
('table', "Table 3.4 – Inconsistencies between functional and non-functional requirements",
    HDR5,
    [["R-16", "NFR-12, C5, DC-05", "CSV import and export exists only as an NFR; there is no FR for it, and C5 excludes integration while DC-05 relies on CSV for it", "High", "Add an FR for CSV import and export if it is in the MVP, otherwise move NFR-12 to future scope"],
     ["R-17", "NFR-07", "A daily backup that can be restored is required, but no FR or actor performs backups", "Medium", "Add an administrator FR for backup and restore, or state that backups are made by the database environment"],
     ["R-18", "NFR-08, FR-01, FR-02", "The lockout after 5 failed logins is new behaviour; nothing says how a locked account is unlocked", "Medium", "Extend FR-02: the administrator can unlock an account; the lock expires after 15 minutes"],
     ["R-19", "NFR-05 (3.4), NFR-06 (4.1), UC-01 step 5a", "A database transaction cannot include the labels; UC-01 itself accepts that an offline label keeps the old price, which contradicts “0 mismatches”", "High", "Count mismatches only for online labels; keep a synchronisation state per label (pending, confirmed, offline)"],
     ["R-20", "NFR-01 and NFR-06", "“100% within 5 s” is impossible when a label is offline, a normal case according to FR-13", "Medium", "Measure NFR-01 on online labels only"],
     ["R-21", "NFR-10, FR-09, FR-10", "For scheduled changes it is unclear which user is recorded: the Scheduler or the manager who planned the change", "Low", "Record the user who planned the change and the moment the Scheduler applied it"],
     ["R-22", "NFR-11", "Unit test coverage is classified as modularity and modifiability, while in ISO/IEC 25010 it belongs to testability", "Low", "Split NFR-11 into modularity (one module to replace) and testability (70% coverage)"],
     ["R-23", "FR-09, FR-10, C1, DC-01", "Scheduled changes and the end of discounts must happen even at night, when no desktop client is open; the SRS does not say where the Scheduler runs", "High", "Run the Scheduler as a background service or a database job, independent of the client, and state it in the product perspective"]],
    W5),
('p', "Finding R-23 is the only one that affects the architecture. A desktop application is a reasonable choice "
      "for the interface, but the timed part of the system has to live in a process that is always running, "
      "otherwise FR-09 and FR-10 will work only while somebody keeps the application open."),

('h1', "4 CONFLICTS BETWEEN QUALITY ATTRIBUTES"),
('p', "Some requirements of the reviewed SRS are correct one by one but pull the design in opposite directions. "
      "These are not mistakes to remove; they are trade-offs that should be decided explicitly and written into the "
      "document, so that the developer does not resolve them silently. Table 4.1 documents six such conflicts and "
      "the proposed resolution for each of them."),
('table', "Table 4.1 – Conflicts between quality attributes and proposed resolutions",
    ["ID", "Conflict", "Requirements involved", "Description", "Proposed resolution"],
    [["T-01", "Performance vs security", "NFR-08 vs FR-01, NFR-04", "Slow password hashing makes every login take noticeably longer, and a hard lock after 5 attempts can block a shared account at the busiest moment of the day", "Keep slow hashing, since logins are rare; replace the hard lock with growing delays, or lock per account and computer, with unlocking by the administrator"],
     ["T-02", "Consistency vs availability", "NFR-05, NFR-06 vs FR-13, UC-01", "Strict synchronisation would block a price change whenever one label is offline; allowing it leaves a temporary mismatch", "Save the price in a transaction, send it to the labels through a queue, track the state of each label and show the unsynchronised ones"],
     ["T-03", "Performance vs reliability", "NFR-01 vs NFR-06", "Retrying an unconfirmed label for up to 1 minute makes the final confirmation longer than 5 s", "Separate the two: online labels within 5 s; offline labels retried for 1 minute and then flagged"],
     ["T-04", "Operability vs error protection", "NFR-04 vs NFR-05", "Confirmation dialogs add steps to an operation that should take at most 3", "Ask for confirmation only for deleting, deactivating and unusually large price changes (e.g. over 50%)"],
     ["T-05", "Simplicity vs reliability", "C1, DC-01 vs FR-09, FR-10", "A desktop application can be closed exactly when a scheduled change is due", "Move the Scheduler into a background service; the desktop client remains only the interface"],
     ["T-06", "Interoperability vs security", "NFR-12 vs NFR-09, NFR-10", "A CSV import can change many prices at once, bypassing the role checks and the price history", "Allow import only to managers, validate it with the FR-04 rules, show a preview and record every change in the history"]],
    [1.3, 2.7, 3.0, 5.0, 6.0]),
('p', "The conflicts T-02 and T-05 have the largest effect on the design, because they decide how the system "
      "behaves when part of it is not available. Both resolutions keep the scope of the MVP and do not require real "
      "hardware: they only make explicit what the system does when a label does not answer or when nobody has the "
      "application open."),

('h1', "5 RECOMMENDATIONS AND CONCLUSIONS"),
('p', "To make the proposals concrete, several requirements were rewritten in the form recommended for the next "
      "version. The original text is shortened; the proposed text can replace it directly. Table 5.1 shows these "
      "examples."),
('table', "Table 5.1 – Examples of rewritten requirements",
    ["Requirement", "Original (shortened)", "Proposed version"],
    [["FR-08", "The system shall update all labels showing a product with a single action when its price or details change", "When a price or product detail is saved, the system sends the new content to all labels assigned to the product, without further action; labels that do not confirm within 5 s are retried and marked as unsynchronised"],
     ["FR-10", "The system shall allow the store manager to define a percentage discount with start and end dates", "The system allows the store manager to define a discount greater than 0% and less than 100% with start and end dates; a discount that overlaps an existing one for the same product is refused"],
     ["G2", "Eliminate mismatches between shelf and checkout prices", "Every online label shows the price stored in the database; consistency with the checkout is a goal of the POS integration phase"],
     ["NFR-06", "0 mismatches between database and labels in 1,000 simulated updates with injected failures", "0 mismatches between the database and the online labels in 1,000 simulated updates with injected failures; every offline label is reported as unsynchronised within 1 minute"],
     ["FR-03", "Add, edit and deactivate products with name, barcode, net quantity, unit, price and category", "Add the expiration date (or batch with expiration date) and state who enters it, so that FR-12 and FR-14 can be implemented"]],
    [2.3, 6.2, 9.5]),
('p', "In order of priority, the following actions are recommended for the next version of the document:"),
('list', ["merge sections 3.4 and 4.1 into a single list of non-functional requirements (R-01);",
          "add acceptance criteria to the functional requirements and user stories (R-10, R-11);",
          "add the missing functional requirements for the expiration date, the CSV exchange, the backup and the unlocking of accounts (R-09, R-16, R-17, R-18);",
          "define the behaviour for offline labels and overlapping discounts (R-04, R-19, R-20);",
          "state where the Scheduler runs and make the trade-offs of Chapter 4 explicit (R-23, T-01 to T-06);",
          "add a traceability matrix, a glossary and the version history (R-15, P-02)."]),
('p', "Overall, the reviewed SRS is a solid document. It has a clear origin in a real problem, a well-argued scope "
      "for the MVP and, in section 4, non-functional requirements that are measurable and properly classified. Its "
      "weak points are the consistency between sections and the verifiability of the functional part. The "
      "recommendation of this review is to accept the document with revisions: after the eight findings of high "
      "severity are corrected, the specification can serve as a reliable basis for the design and testing of the "
      "system."),
]
