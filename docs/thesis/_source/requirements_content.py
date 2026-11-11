# -*- coding: utf-8 -*-
# Requirements document: functional requirements by module and role, measurable non-functional requirements,
# MoSCoW prioritisation and a traceability matrix (objectives -> requirements -> use cases -> implementation -> tests).
# The requirements are taken from srs_block.py, so this document, the SRS and the report always agree.
import re
import content as C
import srs_block

TITLE = "REQUIREMENTS, PRIORITISATION AND TRACEABILITY"
SUBTITLE = C.TITLE

ABBREVIATIONS = [
    ("API", "Application Programming Interface"),
    ("FR", "Functional Requirement"),
    ("MoSCoW", "Must have, Should have, Could have, Won't have"),
    ("NFR", "Non-Functional Requirement"),
    ("SMART", "Specific, Measurable, Achievable, Relevant, Time-bound"),
    ("SUS", "System Usability Scale"),
    ("TC", "Test Case (automated API test)"),
    ("UC", "Use Case"),
]

REFS = {
    'clegg': 'D. Clegg and R. Barker, Case Method Fast-Track: A RAD Approach. Wokingham, UK: Addison-Wesley, 1994.',
}


def _rows(prefix):
    for b in srs_block.SRS:
        if b[0] == 'table' and b[1] and b[1].startswith(prefix):
            return b[3]
    raise KeyError(prefix)


FR = {r[0]: {'name': r[1], 'desc': r[2], 'role': r[3]} for r in _rows("Table 1.15") + _rows("Table 1.16")}
NFR = {r[0]: {'req': r[1], 'iso': r[2], 'metric': r[3]} for r in _rows("Table 1.19") + _rows("Table 1.20")}

MOSCOW_FR = {k: 'Must' for k in FR}
MOSCOW_FR.update({'FR-04': 'Should', 'FR-10': 'Should', 'FR-21': 'Should', 'FR-22': 'Could'})
MOSCOW_NFR = {k: 'Should' for k in NFR}
MOSCOW_NFR.update({k: 'Must' for k in ('NFR-04', 'NFR-06', 'NFR-07', 'NFR-08', 'NFR-10')})

MODULES = [
    ("Accounts and access", "guest, all users, administrator", ['FR-01', 'FR-02', 'FR-03', 'FR-04', 'FR-05', 'FR-06']),
    ("Catalogue and listings", "guest, seller, distributor", ['FR-07', 'FR-08', 'FR-09', 'FR-10', 'FR-11']),
    ("Orders", "seller, distributor", ['FR-12', 'FR-13', 'FR-14', 'FR-15', 'FR-16']),
    ("Communication and reviews", "seller, distributor", ['FR-17', 'FR-18', 'FR-19']),
    ("Administration", "administrator", ['FR-20', 'FR-21', 'FR-22']),
]

GOALS = {'FR-01': 'G4', 'FR-02': 'G3', 'FR-03': 'G3', 'FR-04': 'G4, O2', 'FR-05': 'G4', 'FR-06': 'G3',
         'FR-07': 'G1', 'FR-08': 'G1, G3', 'FR-09': 'G1, G4, O2', 'FR-10': 'G2', 'FR-11': 'G1, G3, O2',
         'FR-12': 'G1, G2, O1', 'FR-13': 'G1, G2, O1', 'FR-14': 'G2', 'FR-15': 'G2, G3', 'FR-16': 'G2, O2',
         'FR-17': 'G1, G2, O1', 'FR-18': 'G1, O1', 'FR-19': 'G3', 'FR-20': 'G3', 'FR-21': 'G3', 'FR-22': 'G3'}

IMPL = {'FR-01': 'POST /auth/register', 'FR-02': 'POST /auth/verify-email, /auth/resend-code',
        'FR-03': 'POST /auth/login', 'FR-04': 'POST /auth/google',
        'FR-05': 'POST /auth/forgot-password, /auth/reset-password', 'FR-06': 'PATCH /admin/users/:id/status',
        'FR-07': 'GET /listings', 'FR-08': 'GET /listings, /listings/:id/image',
        'FR-09': 'POST, PATCH, DELETE /listings; PATCH /listings/:id/status', 'FR-10': 'PATCH /listings/:id/stock',
        'FR-11': 'Moderation module (rules and AI check)', 'FR-12': 'POST /orders',
        'FR-13': 'PATCH /orders/:id/status', 'FR-14': 'PATCH /orders/:id, /orders/:id/cancel',
        'FR-15': 'PATCH /orders/:id/complete', 'FR-16': 'GET /dashboard/me',
        'FR-17': 'GET, POST /orders/:id/messages', 'FR-18': 'GET /notifications; notification module',
        'FR-19': 'POST /orders/:id/review, PUT /reviews/:id/reply',
        'FR-20': 'PATCH /admin/listings/:id/status, POST /admin/listings/:id/recheck, DELETE /admin/reviews/:id',
        'FR-21': 'GET, PUT /admin/moderation/settings', 'FR-22': 'Daily digest scheduler'}

TESTS = {'FR-01': 'TC01', 'FR-02': 'TC01', 'FR-03': 'TC01, TC02', 'FR-04': 'Manual', 'FR-05': 'Manual',
         'FR-06': 'TC01, TC19', 'FR-07': 'TC05', 'FR-08': 'Manual', 'FR-09': 'TC04, TC05', 'FR-10': 'Manual',
         'FR-11': 'TC05, TC06', 'FR-12': 'TC07, TC08', 'FR-13': 'TC09–TC12', 'FR-14': 'TC15, TC16',
         'FR-15': 'TC13, TC14', 'FR-16': 'Manual', 'FR-17': 'Manual', 'FR-18': 'TC08, TC14, TC18',
         'FR-19': 'TC17', 'FR-20': 'TC05', 'FR-21': 'Manual', 'FR-22': 'Manual'}

NFR_TRACE = {'NFR-01': ('G1, O1', 'Load test, 200 requests'), 'NFR-02': ('G1', 'Load test, 50 virtual users'),
             'NFR-03': ('G1, O1', 'External uptime monitor'), 'NFR-04': ('G2', 'TC11, TC12'),
             'NFR-05': ('G1, G3', 'AI outage simulation'), 'NFR-06': ('G3', 'Database inspection'),
             'NFR-07': ('G3', 'Repeated requests test'), 'NFR-08': ('G3', 'TC03, TC04, TC09, TC19'),
             'NFR-09': ('G4, O2', 'Test with 3 new users, SUS'), 'NFR-10': ('G4, O2', 'Manual test on 4 browsers'),
             'NFR-11': ('G2', 'Automated tests on every push')}

# use cases per FR, inverted from the use case table of the SRS
UC = {k: [] for k in FR}
for row in _rows("Table 1.17"):
    for fr in re.findall(r'FR-\d\d', row[3]):
        UC[fr].append(row[0])

WONT = [
    ("W-01", "Online payments between buyers and sellers", "Requires a payment provider and contracts; outside the budget and the scope"),
    ("W-02", "Issuing fiscal documents and electronic invoices", "Depends on national e-invoicing systems; planned for a later version"),
    ("W-03", "Transport planning and route optimisation", "Physical transport stays with the parties; the project optimises the information flow"),
    ("W-04", "Native mobile applications", "The responsive web interface covers phones without installation"),
    ("W-05", "Interface in Russian and English", "The target users of the first version work in Romanian"),
]


def _fr_table(caption, ids):
    return ('table', caption, ["ID", "Requirement", "Role", "Priority"],
            [[i, "%s. %s" % (FR[i]['name'], FR[i]['desc']), FR[i]['role'], MOSCOW_FR[i]] for i in ids],
            [1.5, 11.7, 2.9, 1.9])


def _nfr_table(caption, ids):
    return ('table', caption, ["ID", "Category (ISO/IEC 25010)", "Requirement and metric", "Priority"],
            [[i, NFR[i]['iso'], "%s. %s" % (NFR[i]['req'], NFR[i]['metric']), MOSCOW_NFR[i]] for i in ids],
            [1.9, 3.7, 10.5, 1.9])


def _trace_table(caption, ids):
    return ('table', caption, ["FR", "Priority", "Goals and objectives", "Use case", "Implementation (API, /api)", "Tests"],
            [[i, MOSCOW_FR[i], GOALS[i], ", ".join(UC[i]), IMPL[i], TESTS[i]] for i in ids],
            [1.5, 1.9, 2.3, 1.8, 7.1, 3.4])


def _count(d, v):
    return sum(1 for x in d.values() if x == v)


BLOCKS = [
('h1', "1 INTRODUCTION"),
('p', "This document gathers the requirements of AgroHub, a B2B web platform for wholesale order management and "
      "the optimisation of agricultural product distribution flows. It starts from the purpose of the project and "
      "its objectives, lists all the functional requirements by module and user role, associates measurable metrics "
      "with the non-functional requirements, prioritises everything with the MoSCoW method and links the "
      "requirements to the objectives, the design, the implementation and the tests through a traceability matrix."),
('p', "The purpose of the project is to let Moldovan farmers and wholesale buyers agree and follow wholesale deals in "
      "minutes instead of hours of phone calls, by keeping offers, real stock, orders and the conversation about them "
      "in one place, between verified participants. Table 1.1 lists the goals and the two SMART objectives that the "
      "requirements must serve; the identifiers are used in the traceability matrix in Chapter 5."),
('table', "Table 1.1 – Goals and objectives of the project",
    ["ID", "Goal or objective"],
    [["G1", "Shorten the time needed by producers and buyers to find each other and agree on a deal"],
     ["G2", "Keep a single, shared record of stock, orders and agreements"],
     ["G3", "Build trust between partners who do not know each other"],
     ["G4", "Keep the platform free and easy to use for small producers"],
     ["O1", "SMART: during the pilot (1 February – 31 May 2027), the median time between placing an order and the seller's decision is under 4 hours, on at least 30 orders"],
     ["O2", "SMART: during the pilot, an average SUS score of at least 70 among at least 15 users, and 80% of new sellers publish a first listing in under 3 minutes"]],
    [1.5, 16.5]),
('p', "The requirements were formulated following ISO/IEC/IEEE 29148 [@ieee29148], the non-functional ones were "
      "classified with the quality model of ISO/IEC 25010:2023 [@iso25010], and the detailed use cases and user "
      "stories are given in the software requirements specification of the project."),

('h1', "2 FUNCTIONAL REQUIREMENTS"),
('p', "The functional requirements describe what the system does for each of its users. They are organised in five "
      "modules, each serving one or more roles: the guest (a visitor who has not signed in), the seller (a producer), "
      "the distributor (a wholesale buyer) and the administrator of the platform. The column “Priority” gives "
      "the MoSCoW category explained in Chapter 4."),
('p', "The first module, accounts and access, controls who can enter the platform and with which role. Its "
      "requirements are listed in Table 2.1."),
_fr_table("Table 2.1 – Functional requirements: accounts and access", MODULES[0][2]),
('p', "Signing in with Google (FR-04) is a convenience rather than a necessity, which is why it is the only "
      "requirement of the module that is not a Must."),
('p', "The second module covers the catalogue, through which buyers find offers, and the listings, through which "
      "sellers publish them. Table 2.2 lists its requirements."),
_fr_table("Table 2.2 – Functional requirements: catalogue and listings", MODULES[1][2]),
('p', "The automatic check of listings (FR-11) lets trusted sellers publish in seconds while keeping spam and "
      "unrealistic offers out of the catalogue."),
('p', "The orders module, in Table 2.3, implements the life cycle of a deal: pending, confirmed, rejected, cancelled "
      "and delivered."),
_fr_table("Table 2.3 – Functional requirements: orders", MODULES[2][2]),
('p', "All the requirements of this module are Must, because without them the platform would not replace the oral "
      "agreements by phone, which is the core of its value."),
('p', "Table 2.4 contains the requirements for communication and reviews, and Table 2.5 those of the administrator."),
_fr_table("Table 2.4 – Functional requirements: communication and reviews", MODULES[3][2]),
('p', "Notifications (FR-18) are directly linked to objective O1, since the seller can answer an order quickly only "
      "if the seller learns about it at once."),
('p', "The administration module gives the platform staff the tools to keep the catalogue and the reviews "
      "trustworthy."),
_fr_table("Table 2.5 – Functional requirements: administration", MODULES[4][2]),
('p', "In total, the system has %d functional requirements. Some functions were consciously left out of this "
      "version; they are listed as Won't have in Chapter 4, so that their absence is a documented decision and not an "
      "omission." % len(FR)),

('h1', "3 NON-FUNCTIONAL REQUIREMENTS"),
('p', "The non-functional requirements describe the qualities of the system. Each one is classified according to "
      "ISO/IEC 25010:2023 and has a measurable metric, so that it can be verified objectively. Table 3.1 contains the "
      "requirements for performance and reliability."),
_nfr_table("Table 3.1 – Non-functional requirements: performance and reliability", ['NFR-01', 'NFR-02', 'NFR-03', 'NFR-04', 'NFR-05']),
('p', "The availability target of 99% is lower than the 99.9% often cited for commercial services, because the "
      "first version runs on free hosting plans; it can be raised when the platform moves to paid infrastructure."),
('p', "Table 3.2 contains the requirements for security, ease of use, adaptability and maintainability."),
_nfr_table("Table 3.2 – Non-functional requirements: security, usability, flexibility and maintainability", ['NFR-06', 'NFR-07', 'NFR-08', 'NFR-09', 'NFR-10', 'NFR-11']),
('p', "Requirement NFR-09 uses the same metrics as objective O2, and NFR-01 supports objective O1, so the success of "
      "the project and the quality of the system are measured with the same numbers."),

('h1', "4 PRIORITISATION OF THE REQUIREMENTS"),
('p', "The requirements were prioritised with the MoSCoW method, which divides them into four categories [@clegg]: "
      "Must have (without it the system has no value or cannot be used safely), Should have (important, but the "
      "system works without it), Could have (useful if time allows) and Won't have (consciously excluded from this "
      "version). The criteria were the contribution to the objectives O1 and O2 and to the key flows of the users, "
      "the risk of leaving a requirement out, and the effort compared to the time available."),
('p', "Table 4.1 shows how the requirements are distributed among the categories."),
('table', "Table 4.1 – Distribution of the requirements by MoSCoW category",
    ["Category", "Functional", "Non-functional", "Examples"],
    [["Must have", str(_count(MOSCOW_FR, 'Must')), str(_count(MOSCOW_NFR, 'Must')), "Placing and accepting orders, stock linked to orders, access control"],
     ["Should have", str(_count(MOSCOW_FR, 'Should')), str(_count(MOSCOW_NFR, 'Should')), "Google sign-in, manual stock adjustment, response time"],
     ["Could have", str(_count(MOSCOW_FR, 'Could')), str(_count(MOSCOW_NFR, 'Could')), "Daily summary for the administrators"],
     ["Won't have", str(len(WONT)), "0", "Online payments, route planning (Table 4.2)"]],
    [3.0, 2.4, 2.8, 9.8]),
('p', "Most functional requirements are Must, which is normal for a minimum viable product: each of them covers a "
      "step of the key flows. Among the non-functional requirements, those that protect data and stock are Must, "
      "while the performance targets are Should, because they are verified under load only in the pilot phase."),
('p', "The functions excluded from this version are listed in Table 4.2, together with the reason."),
('table', "Table 4.2 – Won't have requirements of the current version",
    ["ID", "Function", "Reason for exclusion"],
    [list(w) for w in WONT],
    [1.5, 6.5, 10.0]),
('p', "These functions are not rejected for good. They are the first candidates for the next versions, once the "
      "pilot shows how the platform is actually used."),

('h1', "5 TRACEABILITY MATRIX"),
('p', "The traceability matrix shows that every requirement serves the objectives of the project and that every "
      "requirement is designed, implemented and tested. It is read in two directions: from an objective to the "
      "requirements that achieve it (Table 5.1), and from each requirement to its use case, its implementation and "
      "its tests (Tables 5.2–5.4)."),
('table', "Table 5.1 – Objectives and goals traced to requirements",
    ["Objective", "Functional requirements", "Non-functional requirements", "Verification"],
    [["O1. Decision on an order in under 4 hours", "FR-12, FR-13, FR-17, FR-18", "NFR-01, NFR-03", "Pilot timestamps; TC08, TC10, TC14"],
     ["O2. SUS ≥ 70; first listing in under 3 minutes", "FR-04, FR-09, FR-11, FR-16", "NFR-09, NFR-10", "SUS questionnaire; timed first use"],
     ["G1. Less time to find a partner", "FR-07, FR-08, FR-11, FR-12, FR-13, FR-17, FR-18", "NFR-01, NFR-02, NFR-05", "TC05, TC08, TC10"],
     ["G2. One shared record", "FR-10, FR-12 to FR-17", "NFR-04, NFR-11", "TC10 to TC16"],
     ["G3. Trust between partners", "FR-02, FR-03, FR-06, FR-11, FR-15, FR-19 to FR-22", "NFR-05 to NFR-08", "TC01, TC05, TC06, TC17, TC19"],
     ["G4. Free and easy to use", "FR-01, FR-04, FR-05, FR-09", "NFR-09, NFR-10", "Test with new users"]],
    [4.6, 5.0, 3.6, 4.8]),
('p', "Every goal and objective is supported by at least two functional requirements and one non-functional "
      "requirement, and no requirement is left without a goal."),
('p', "Table 5.2 traces the non-functional requirements to the goals and to the method used to verify them."),
('table', "Table 5.2 – Traceability of the non-functional requirements",
    ["NFR", "Priority", "Goals and objectives", "Verification"],
    [[k, MOSCOW_NFR[k], NFR_TRACE[k][0], NFR_TRACE[k][1]] for k in sorted(NFR)],
    [2.0, 2.2, 5.0, 8.8]),
('p', "Three non-functional requirements (NFR-04, NFR-08 and NFR-11) are already verified by the automated tests; the load, availability and usability targets will be measured before and during the pilot."),
('p', "Tables 5.3 and 5.4 trace each functional requirement to the use case of the specification, the API endpoints "
      "that implement it and the tests that verify it. “Manual” marks the requirements that are verified by "
      "a manual test scenario instead of an automated one."),
_trace_table("Table 5.3 – Traceability of the functional requirements FR-01 to FR-11", ['FR-%02d' % i for i in range(1, 12)]),
('p', "All the requirements of accounts, catalogue and listings are implemented. Google sign-in and password "
      "recovery depend on an external account or an e-mail inbox, while the listing details and the stock adjustment "
      "are checked through the interface, so these four are tested manually."),
('p', "Table 5.4 continues the matrix with the orders, communication, reviews and administration."),
_trace_table("Table 5.4 – Traceability of the functional requirements FR-12 to FR-22", ['FR-%02d' % i for i in range(12, 23)]),
('p', "Every Must requirement of the orders module is covered by at least one automated test, including the "
      "simultaneous acceptance of the same order (TC12)."),
('p', "The matrix will be completed during the next stages: the UML models of the design phase will be added as a "
      "new column, and the results of the load, usability and pilot tests will replace the planned verification "
      "methods."),

('h1', "6 CONCLUSIONS"),
('p', "The platform is described by %d functional requirements, organised in five modules and four roles, and by %d "
      "non-functional requirements with measurable metrics. The MoSCoW prioritisation separates %d Must requirements, "
      "which form the minimum viable product, from those that can wait, and five functions are consciously excluded "
      "from this version." % (len(FR), len(NFR), _count(MOSCOW_FR, 'Must') + _count(MOSCOW_NFR, 'Must'))),
('p', "The traceability matrix links the two SMART objectives and the four goals of the project to the requirements, "
      "the use cases, the API endpoints and the tests. Most functional requirements are already verified by automated "
      "tests, and the rest by manual scenarios, so every requirement can be followed from the purpose of the project "
      "to its verification."),
]
