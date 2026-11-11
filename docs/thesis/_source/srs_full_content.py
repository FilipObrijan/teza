# -*- coding: utf-8 -*-
# Complete Software Requirements Specification of AgroHub, following the IEEE 830 based SRS template
# provided for the course (sections 1-6 with their original numbering). The requirements themselves
# (FR-01..FR-22, NFR-01..NFR-11, use cases, flows) are taken from srs_block.py and requirements_content.py,
# so every document of the project states the same requirements.
import os
import srs_block
import requirements_content as R

_D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diagrams')

TITLE = "SOFTWARE REQUIREMENTS SPECIFICATION"
SUBTITLE = ("AgroHub – B2B Web Platform for Wholesale Order Management and Optimisation of "
            "Agricultural Product Distribution Flows")

ABBREVIATIONS = [
    ("AI", "Artificial Intelligence"),
    ("API", "Application Programming Interface"),
    ("CI", "Continuous Integration"),
    ("FR", "Functional Requirement"),
    ("HTTPS", "Hypertext Transfer Protocol Secure"),
    ("JSON", "JavaScript Object Notation"),
    ("JWT", "JSON Web Token"),
    ("MoSCoW", "Must have, Should have, Could have, Won't have"),
    ("NFR", "Non-Functional Requirement"),
    ("REST", "Representational State Transfer"),
    ("SMTP", "Simple Mail Transfer Protocol"),
    ("SRS", "Software Requirements Specification"),
    ("TC", "Test Case (automated API test)"),
    ("TLS", "Transport Layer Security"),
    ("UC", "Use Case"),
    ("UTC", "Coordinated Universal Time"),
]

REFS = dict(R.REFS)
REFS.update({
    'ieee830': 'IEEE Recommended Practice for Software Requirements Specifications, IEEE Std 830-1998. New York, NY, USA: IEEE, 1998.',
    'rfc9110': 'R. Fielding, M. Nottingham and J. Reschke, “HTTP Semantics,” RFC 9110, IETF, June 2022. [Online]. Available: https://www.rfc-editor.org/rfc/rfc9110',
    'rfc8446': 'E. Rescorla, “The Transport Layer Security (TLS) Protocol Version 1.3,” RFC 8446, IETF, Aug. 2018. [Online]. Available: https://www.rfc-editor.org/rfc/rfc8446',
    'rfc7519': 'M. Jones, J. Bradley and N. Sakimura, “JSON Web Token (JWT),” RFC 7519, IETF, May 2015. [Online]. Available: https://www.rfc-editor.org/rfc/rfc7519',
    'wcag21': 'W3C, “Web Content Accessibility Guidelines (WCAG) 2.1,” W3C Recommendation, 2018. [Online]. Available: https://www.w3.org/TR/WCAG21/',
})

MODAL = {'Must': 'shall', 'Should': 'should', 'Could': 'may'}

# the functional requirements written as "shall / should / may" statements, as the template asks
SHALL = {
    'FR-01': "The system {m} let a guest create a seller or distributor account with full name, e-mail and password, and optionally phone and region.",
    'FR-02': "The system {m} send a six-digit code to the e-mail address of a new account and {m} activate the account only after the correct code is entered.",
    'FR-03': "The system {m} let a registered user sign in with e-mail and password.",
    'FR-04': "The system {m} let a user sign in, or register, with a Google account.",
    'FR-05': "The system {m} let a user set a new password with a six-digit code sent by e-mail.",
    'FR-06': "The system {m} approve verified accounts automatically or leave them to the administrator, who {m} be able to approve, reject or block any account.",
    'FR-07': "The system {m} display the active listings and allow searching by product or variety and filtering by region.",
    'FR-08': "The system {m} display for a listing the quantity, the price per kilogram, the region, the harvest date, the delivery terms, the contacts and the rating of the seller.",
    'FR-09': "The system {m} let a seller create, edit, pause and delete own listings; a new listing {m} require a photo.",
    'FR-10': "The system {m} let a seller correct the stock of a listing with a stated reason and record every change.",
    'FR-11': "The system {m} check every new or edited listing with rules and an AI service and leave doubtful listings to the administrator, together with the reasons.",
    'FR-12': "The system {m} let a distributor order a quantity no larger than the available stock, with an optional message, and fix the price at the moment of ordering.",
    'FR-13': "The system {m} let the seller accept or reject a pending order; on acceptance the stock {m} decrease, and a listing left with zero stock {m} be paused.",
    'FR-14': "The system {m} let the distributor edit and resend an order that is pending, rejected or cancelled, and cancel an order that is not yet delivered, restoring the stock of an accepted order.",
    'FR-15': "The system {m} let the seller mark an accepted order as delivered, after which the order can no longer be cancelled.",
    'FR-16': "The system {m} show each user the statistics and history of their listings and orders and let them hide old orders from their own history.",
    'FR-17': "The system {m} provide a conversation for every order and show the number of unread messages.",
    'FR-18': "The system {m} create an in-app notification and send an e-mail for every change of an order, and send an e-mail for a new message unless the recipient has read the conversation in the last 30 seconds.",
    'FR-19': "The system {m} let both parties of an accepted or delivered order give a rating from 1 to 5 with a comment, let the reviewed user reply, and publish the average rating.",
    'FR-20': "The system {m} let the administrator approve or reject listings, request a new AI check and delete reviews or replies.",
    'FR-21': "The system {m} let the administrator change the automatic approval rules: the thresholds for trusted sellers, the price limits, the banned words and the AI check.",
    'FR-22': "The system {m} send the administrators a daily e-mail summary of the moderation events at a configured hour, Moldova time.",
}


def _shall(i):
    return SHALL[i].format(m=MODAL[R.MOSCOW_FR[i]])


def _rows(prefix):
    return R._rows(prefix)


def _fr_table(caption, ids):
    return ('table', caption, ["ID", "Requirement", "Role", "Priority"],
            [[i, "%s. %s" % (R.FR[i]['name'], _shall(i)), R.FR[i]['role'], R.MOSCOW_FR[i]] for i in ids],
            [1.5, 11.6, 3.0, 1.9])


def _nfr_table(caption, ids):
    return ('table', caption, ["ID", "Requirement", "Measurable acceptance criterion", "Priority"],
            [[i, "%s (%s)" % (R.NFR[i]['req'], R.NFR[i]['iso']), R.NFR[i]['metric'], R.MOSCOW_NFR[i]] for i in ids],
            [1.7, 5.0, 9.4, 1.9])


ACTORS = _rows("Table 1.14")
FLOWS = _rows("Table 1.13")
CLARIF = _rows("Table 1.12")

FEATURES = [
    ("3.2.1 Feature 1: accounts and access",
     "This feature controls who enters the platform and with which role. It serves the guest, who becomes a seller or "
     "a distributor, every registered user who signs in, and the administrator, who decides on the accounts that "
     "the automatic rules do not approve.",
     ["the guest submits the registration form – the system validates the data, saves the account as unverified "
      "and sends a six-digit code; an e-mail that already exists is refused with a message;",
      "the guest enters the code – the system activates the account if the code is correct and not expired; "
      "after the 5th wrong attempt or after 15 minutes a new code is required;",
      "the user signs in – the system returns a session token valid for 7 days, or refuses wrong credentials, "
      "a blocked account and the 21st attempt within 15 minutes;",
      "the administrator approves, rejects or blocks an account – the change applies to the next request of that "
      "user, and a blocked user loses access at once."],
     "Table 3.3 – Functional requirements of feature 1: accounts and access", R.MODULES[0][2]),
    ("3.2.2 Feature 2: catalogue and listings",
     "This feature lets sellers publish offers and buyers find them. The catalogue is public, so a guest can see "
     "what is offered before creating an account; only sellers can publish, and every listing passes the automatic "
     "check before it reaches the catalogue.",
     ["a user searches or filters the catalogue – the system shows the active listings that match, with stock, "
      "price, region and seller rating; an empty result is shown as such;",
      "the seller submits a listing with a photo – the system validates the fields, converts the photo, runs the "
      "rule-based and AI checks and publishes the listing or keeps it pending with the reasons;",
      "the AI service does not answer within 45 seconds – the listing waits for manual moderation and is "
      "rechecked automatically every 15 minutes, up to 12 times;",
      "the seller corrects the stock with a reason – the system applies the change, refuses a result below zero "
      "and records the change with its author."],
     "Table 3.4 – Functional requirements of feature 2: catalogue and listings", R.MODULES[1][2]),
    ("3.2.3 Feature 3: orders",
     "This feature replaces the oral agreement by phone with a written order that has a fixed price and a clear "
     "status. An order passes through the statuses pending, confirmed, rejected, cancelled and delivered, and the "
     "stock of the listing changes only on acceptance and on the cancellation of an accepted order.",
     ["the distributor submits an order – the system locks the listing, checks that it is active and that the "
      "quantity does not exceed the stock, saves the order as pending and notifies the seller; otherwise it states "
      "the quantity still available;",
      "the seller accepts the order – in one transaction the system checks the stock again, decreases it, pauses "
      "a listing left with zero stock and notifies the distributor; a second, simultaneous acceptance is refused;",
      "the seller rejects the order, or the distributor cancels it – the status changes and, for an accepted "
      "order, the stock is restored;",
      "the seller marks an accepted order as delivered – the order is closed and cannot be cancelled any more."],
     "Table 3.5 – Functional requirements of feature 3: orders", R.MODULES[2][2]),
    ("3.2.4 Feature 4: communication and reviews",
     "This feature keeps the conversation about a deal next to the deal itself and builds trust after it. Messages "
     "belong to an order, and reviews are possible only between parties who have actually traded.",
     ["a party sends a message on an order – the system saves it, increases the unread counter of the other "
      "party and e-mails them, unless they have read the conversation in the last 30 seconds;",
      "the status of an order changes – the system creates an in-app notification and sends an e-mail to the "
      "other party; a failed e-mail is logged and does not cancel the change;",
      "a party leaves a review – the system accepts it only for an accepted or delivered order and only once per "
      "party, then recalculates the public average rating."],
     "Table 3.6 – Functional requirements of feature 4: communication and reviews", R.MODULES[3][2]),
    ("3.2.5 Feature 5: administration",
     "This feature gives the platform staff the means to keep the catalogue and the reviews trustworthy without "
     "slowing down honest users. The administrator does not trade and has no access to ordering.",
     ["a listing is left pending – the administrator sees it with the reasons and approves it, rejects it or asks "
      "for a new AI check;",
      "the administrator changes the moderation settings – the new rules apply to the next listing checked;",
      "the configured hour of the day arrives – the system e-mails the administrators a summary of the moderation "
      "events of the last 24 hours, once per day."],
     "Table 3.7 – Functional requirements of feature 5: administration", R.MODULES[4][2]),
]


def _feature_blocks():
    out = []
    for k, (head, purpose, stimuli, cap, ids) in enumerate(FEATURES, 1):
        out += [
            ('h3', head),
            ('h4', "3.2.%d.1 Introduction/Purpose of feature" % k),
            ('p', purpose),
            ('h4', "3.2.%d.2 Stimulus/Response sequence" % k),
            ('list', stimuli),
            ('h4', "3.2.%d.3 Associated functional requirements" % k),
            ('p', "The requirements of this feature are listed in %s." % cap.split(' –')[0]),
            _fr_table(cap, ids),
            ('p', FEATURE_AFTER[k - 1]),
        ]
    return out


FEATURE_AFTER = [
    "Signing in with Google (FR-04) is the only requirement of this feature that the platform can work without, "
    "which is why it is formulated with “should”.",
    "The automatic check (FR-11) lets trusted sellers publish within seconds while spam and unrealistic offers stay "
    "out of the catalogue.",
    "All the requirements of this feature are mandatory, because together they form the core of the value of the "
    "platform.",
    "The 30-second rule of FR-18 prevents a user who is already reading the conversation from receiving an e-mail "
    "for every message.",
    "The daily summary (FR-22) is optional: the administrator also sees the pending items in the interface.",
]

INPUTS = [
    ["Full name", "Identifies the user to partners", "Text, 2–150 characters"],
    ["E-mail", "Sign-in name and notification address", "Valid address, at most 255 characters, unique"],
    ["Password", "Proves the identity of the user", "8–128 characters; stored only as a bcrypt hash"],
    ["Role", "Selects the rights of the account", "Seller or distributor (the administrator is created at installation)"],
    ["Phone, region", "Contacts shown to partners (optional)", "Phone at most 30 characters; region at most 100 characters"],
    ["Verification or reset code", "Confirms the e-mail address or a password reset", "Exactly 6 digits; valid 15 minutes, at most 5 attempts"],
    ["Product, variety", "Describe the offered goods", "Text, 2–150 characters each"],
    ["Quantity of a listing", "Stock offered for sale", "Kilograms, greater than 0, two decimals"],
    ["Price", "Wholesale price", "Lei per kilogram, 0 or more, two decimals"],
    ["Harvest date, delivery terms", "Optional details of an offer", "Calendar date; text of at most 255 characters"],
    ["Photo", "Shows the goods", "Image file of at most 10 MB, converted to WebP; mandatory for a new listing"],
    ["Stock correction", "Corrects the stock of a listing", "Non-zero change in kilograms and a reason of 2–100 characters; the stock never falls below 0"],
    ["Ordered quantity, note", "Content of an order", "Kilograms, greater than 0 and at most the available stock; note of at most 500 characters"],
    ["Message", "Conversation on an order", "Text, 1–2,000 characters"],
    ["Rating, comment, reply", "Review after a deal", "Integer from 1 to 5; comment and reply of at most 1,000 characters"],
]

ENTITIES = [
    ["User", "Account of a seller, distributor or administrator; role and status (pending, approved, rejected, blocked)", "Unique e-mail; a password hash or a Google identifier"],
    ["Listing", "Offer of a seller; status pending, active, paused or archived", "Quantity and price 0 or more; belongs to one seller"],
    ["Order", "Request of a distributor for one listing; status pending, confirmed, rejected, cancelled or completed", "Quantity greater than 0; total = quantity × unit price; a listing with orders cannot be deleted"],
    ["Stock event", "Every change of the stock of a listing, with reason and author", "Never modified after it is written"],
    ["Message, read mark", "Conversation of an order and the moment each party last read it", "Belongs to one order and to its two parties"],
    ["Review", "Rating and comment of one party of an order, with the reply of the other", "Rating 1–5; one review per party and order"],
    ["Notification", "Event shown in the application, read or unread", "Belongs to one user"],
    ["Code", "Hash of an e-mail verification or password reset code", "Expires after 15 minutes; at most 5 attempts"],
    ["Setting, moderation event", "Moderation rules and the history of automatic decisions", "One value per setting key"],
]

QUALITY = [
    ["1", "Correctness", "H", "FR-01–FR-22, NFR-04"],
    ["2", "Efficiency", "M", "NFR-01, NFR-02"],
    ["3", "Flexibility", "L", "–"],
    ["4", "Integrity/Security", "H", "NFR-06, NFR-07, NFR-08"],
    ["5", "Interoperability", "M", "Interfaces in 2.1.4"],
    ["6", "Maintainability", "M", "NFR-11"],
    ["7", "Portability", "M", "NFR-10"],
    ["8", "Reliability", "H", "NFR-04, NFR-05"],
    ["9", "Reusability", "L", "–"],
    ["10", "Testability", "M", "NFR-11"],
    ["11", "Usability", "H", "NFR-09"],
    ["12", "Availability", "M", "NFR-03"],
]

TRACE = [[i, R.MOSCOW_FR[i], R.GOALS[i], ", ".join(R.UC[i]), R.TESTS[i]] for i in sorted(R.FR)]


BLOCKS = [
# ===================================================================== 1
('h1', "1 INTRODUCTION"),
('p', "This chapter gives an overview of the whole specification: why it was written, what product it describes, "
      "the terms it uses, the documents it relies on and how the rest of it is organised."),
('h2', "1.1 Purpose"),
('p', "This document specifies the software requirements of AgroHub, a B2B web platform for wholesale order "
      "management and optimisation of agricultural product distribution flows, developed as a bachelor's project at "
      "the Technical University of Moldova. It states what the system must do and under which conditions it must "
      "operate, in enough detail for the system to be designed, implemented and tested, without prescribing how it "
      "is built. The document follows the SRS template of the course, based on IEEE Std 830 [@ieee830], and the "
      "recommendations of ISO/IEC/IEEE 29148 [@ieee29148]. This is version 1.0, dated 11/11/2026."),
('p', "The intended readers are the scientific coordinator of the project, who reviews and approves the "
      "requirements; the developer, who designs, implements and tests the system on their basis; and the future "
      "users or their representatives, producers and wholesale buyers, for whom Chapter 2 describes the system in "
      "everyday language."),
('h2', "1.2 Scope"),
('p', "The product is AgroHub, available at https://agrohub-efh.pages.dev/. It lets farmers in the Republic of "
      "Moldova publish wholesale offers with their real stock, lets distributors, shops and HoReCa businesses find "
      "these offers and order from them, and keeps the order, its status, the conversation about it and the "
      "reviews of the partners in one place. An administrator, helped by automatic checks and an AI service, keeps "
      "the catalogue free of spam and fake offers."),
('p', "The purpose of the product is to let producers and wholesale buyers agree and follow deals in minutes "
      "instead of hours of phone calls. Its goals are:"),
('list', ["G1 – shorten the time needed by producers and buyers to find each other and agree on a deal;",
          "G2 – keep a single, shared record of stock, orders and agreements;",
          "G3 – build trust between partners who do not know each other;",
          "G4 – keep the platform free and easy to use for small producers."]),
('p', "Two measurable objectives follow from them. During the pilot (1 February – 31 May 2027) the median time "
      "between placing an order and the seller's decision must be under 4 hours, on at least 30 orders (O1), and "
      "the platform must obtain an average System Usability Scale score of at least 70 from at least 15 users, "
      "with 80% of new sellers publishing a first listing in under 3 minutes (O2)."),
('p', "The product does not handle payments between buyers and sellers, does not issue invoices or other fiscal "
      "documents, does not plan transport or delivery routes, and has no native mobile application or interface "
      "languages other than Romanian. These functions are deferred, as shown in subsection 2.6."),
('h2', "1.3 Definitions, Acronyms, and Abbreviations"),
('p', "The acronyms and abbreviations are explained in the list of abbreviations at the beginning of the document. "
      "Table 1.1 defines the terms of the domain that have a precise meaning in this specification."),
('table', "Table 1.1 – Definitions of the terms used in the specification",
    ["Term", "Definition"],
    [["Seller", "A producer or company that owns agricultural goods and offers them on the platform"],
     ["Distributor", "A wholesale buyer: a distribution company, a shop or a HoReCa business"],
     ["Guest", "A visitor of the platform who has not signed in"],
     ["Listing", "An offer of one product by one seller, with stock, price per kilogram, region and photo"],
     ["Stock", "The quantity of a listing, in kilograms, that can still be ordered"],
     ["Order", "A binding request of a distributor for a quantity of one listing, at the price of the listing at the moment of ordering"],
     ["Accepted (confirmed) order", "An order the seller has agreed to; its quantity has been subtracted from the stock"],
     ["Delivered (completed) order", "An accepted order the seller has marked as delivered; it can no longer be cancelled"],
     ["Trusted seller", "A seller whose listings are published without waiting for the administrator, according to the moderation settings"],
     ["Moderation", "The decision whether an account or a listing may be used on the platform, taken by rules, by the AI service or by the administrator"]],
    [4.4, 13.6]),
('p', "Quantities are always expressed in kilograms and prices in Moldovan lei (MDL) per kilogram. Times shown to "
      "the users are in Moldova time; times stored by the system are in UTC."),
('h2', "1.4 References"),
('p', "All documents referenced in this specification are listed, in IEEE format and in the order of their first "
      "citation, in the chapter “References” at the end of the document. They include the standards that "
      "define the structure and quality of the specification [@ieee830], [@ieee29148], [@iso25010], the "
      "protocols used by the interfaces of the system, HTTP [@rfc9110], TLS 1.3 [@rfc8446] and JSON Web Token "
      "[@rfc7519], and the regulations and guidelines the system must respect: the Moldovan law on personal data "
      "protection [@law195], the OWASP Top 10 [@owasp] and WCAG 2.1 [@wcag21]. The standards are available from "
      "their publishers, and the RFC documents and guidelines at the addresses given in the list."),
('h2', "1.5 Overview"),
('p', "Chapter 2 describes the product in the language of its users: its place among other systems, its main "
      "functions, its users, its constraints and the requirements deferred to later versions. Future users and the "
      "coordinator will find there everything needed to judge whether the product is the right one."),
('p', "Chapter 3 is written for the developer and the tester. It specifies the inputs and outputs of the system, "
      "its functional requirements grouped by feature, the performance, data, design and quality requirements, and "
      "explains how the requirements are organised. Chapter 4 describes how changes to the requirements are "
      "handled, Chapter 5 lists the approvers of the document, and Chapter 6 contains the supporting information, "
      "including the traceability of the requirements to use cases and tests."),

# ===================================================================== 2
('h1', "2 THE OVERALL DESCRIPTION"),
('p', "This chapter gives the background of the requirements without stating them formally. The requirements "
      "themselves are specified in Chapter 3."),
('h2', "2.1 Product Perspective"),
('p', "AgroHub is a new, self-contained product. It does not replace an existing system and is not a component of "
      "a larger one: today the wholesale trade it covers is done by phone, in messengers and in general classified "
      "ads sites, which publish offers but do not handle the order, the stock or the trust between partners. "
      "International B2B marketplaces for agricultural products do exist, but they target large exporters and "
      "importers and are not adapted to small Moldovan producers, to the Romanian language or to free use."),
('p', "The system interacts with four kinds of human users and with three external systems. Figure 2.1 shows the "
      "platform as a black box together with the information it exchanges with them."),
('fig', os.path.join(_D, 'context.png'), "Figure 2.1 – Context diagram of the AgroHub platform", 15.5),
('p', "The human actors are on the left of Figure 2.1 and the external systems on the right. The platform sends "
      "codes and notifications to the e-mail service, asks Google to confirm a sign-in, and sends the text and "
      "photo of a listing to the AI service, which returns a verdict. The following subsections describe how the "
      "software operates within these interfaces."),
('h3', "2.1.1 System Interfaces"),
('p', "The system has three external system interfaces. Each of them supports one function of the platform and is "
      "optional for its operation, so that a failure of the external system never stops the trade:"),
('list', ["e-mail service – delivers the verification and reset codes, the order notifications and the daily "
          "summary; if it is unavailable, the event is still saved and shown in the application;",
          "Google Identity Services – confirms the identity of a user who signs in with a Google account; if it "
          "is unavailable, the user can still sign in with e-mail and password;",
          "AI moderation service – evaluates a new or edited listing; if it is unavailable, the listing waits for "
          "the administrator and is rechecked automatically later."]),
('h3', "2.1.2 Interfaces"),
('p', "The users work with the system through a graphical web interface in Romanian, opened in a browser on a "
      "phone, tablet or computer, with no installation. The most frequent tasks, publishing an offer and placing an "
      "order, are reachable from the main screen and are done in a single form each. Many producers use mainly a "
      "phone, so every screen must be usable on a screen 360 pixels wide, and the forms must show the errors next "
      "to the field concerned, in plain words."),
('p', "To keep the interface usable by people with visual or motor impairments, it should follow the WCAG 2.1 "
      "guidelines [@wcag21] for text contrast, labels of form fields and operation with the keyboard. There is no "
      "command-line interface for users; the administrator works through the same web interface."),
('h3', "2.1.3 Hardware Interfaces"),
('p', "The system has no hardware interface requirements. It does not control or read any device: photos are "
      "uploaded as files chosen by the user, and when the browser of a phone offers to take a picture, this is done "
      "by the browser and the operating system, not by the platform."),
('h3', "2.1.4 Software Interfaces"),
('p', "The software products with which the system must exchange data are listed in Table 2.1. The database "
      "management system is not included, since it is a design choice and not an external requirement."),
('table', "Table 2.1 – Software interfaces of the system",
    ["Name (mnemonic)", "Version and source", "Purpose", "Messages and format"],
    [["Brevo Transactional Email (EMAIL)", "API v3, brevo.com; any SMTP server as an alternative", "Delivers codes, notifications and summaries", "HTTPS POST with a JSON body: sender, recipient, subject, text and HTML content"],
     ["Google Identity Services (GIS)", "OAuth 2.0 / OpenID Connect, developers.google.com", "Confirms the identity behind a Google sign-in", "Signed ID token (JWT) received from the browser and verified by the server"],
     ["Gemini API (AI)", "v1beta generateContent, ai.google.dev; Claude Messages API v1 as an alternative", "Evaluates the text and photo of a listing", "HTTPS POST with JSON: listing fields and image; answer: verdict and reason in JSON"]],
    [3.8, 4.4, 4.0, 5.8]),
('p', "All three interfaces are configured with keys and addresses kept outside the source code, so that a provider "
      "can be replaced without changing the requirements of the rest of the system."),
('h3', "2.1.5 Communications Interfaces"),
('p', "The browser and the server communicate over HTTPS, using TLS 1.3 or 1.2 [@rfc8446], through a REST interface "
      "with JSON messages that follows the semantics of HTTP [@rfc9110]: methods for reading and changing data and "
      "status codes for the result. A signed-in user is identified by a JSON Web Token [@rfc7519] sent in the "
      "Authorization header. The communication with the external systems also uses HTTPS. No custom protocol is "
      "used."),
('h3', "2.1.6 Memory Constraints"),
('p', "There are no memory constraints on the side of the users: the interface runs in any current browser. On the "
      "server side, the first version must run on free hosting plans, which limit the memory of the server and the "
      "storage of the database to a few hundred megabytes each. For this reason every uploaded "
      "photo is limited to 10 MB and stored in a compressed format, and the specification avoids functions that "
      "would keep large amounts of data in memory."),
('h3', "2.1.7 Operations"),
('p', "The platform works in a single, interactive mode, 24 hours a day; there are no periods in which users are "
      "excluded. Two tasks run unattended: the recheck of the listings that the AI service could not evaluate, "
      "every 15 minutes, and the daily summary for the administrators. On the free hosting plan the server and the "
      "database are suspended when nobody uses them, so the first request after a pause may take longer."),
('p', "Backup and recovery of the data are provided by the history and restore functions of the database "
      "provider; in addition, the administrator should export the database at least once a week during the pilot. "
      "A failed request never leaves partial data, because every operation that changes several records runs in a "
      "single database transaction."),
('h3', "2.1.8 Site Adaptation Requirements"),
('p', "No physical site has to be prepared and no equipment has to be bought by the users. To install the system "
      "for a new operator, the following must be set in the configuration of the server: the address of the "
      "database, the secret used to sign the tokens, the e-mail of the first administrator, the address of the "
      "website and, optionally, the keys of the e-mail, Google and AI services. The database tables are created "
      "automatically at the first start, and the first administrator account is created from the configuration."),
('h2', "2.2 Product Functions"),
('p', "From the point of view of its users, the platform performs four main functions, each corresponding to a key "
      "user flow. They are summarised in Table 2.2; the rest of the functionality exists to support them."),
('table', "Table 2.2 – Main functions of the product as key user flows",
    ["Flow", "Actors", "Main steps", "Result"], FLOWS, [3.0, 2.8, 9.2, 3.0]),
('p', "The same functions are shown as use cases in Figures 2.2 and 2.3. The first diagram groups the functions "
      "related to access and administration."),
('fig', os.path.join(_D, 'usecases_access.png'), "Figure 2.2 – Use cases: access and administration", 14.0),
('p', "A guest can browse the catalogue, register and sign in; registration always includes the verification of "
      "the e-mail, and signing in with Google is an optional variant. The administrator moderates accounts, "
      "listings and reviews and configures the automatic moderation."),
('p', "The second diagram groups the functions through which sellers and distributors trade with each other."),
('fig', os.path.join(_D, 'usecases_trading.png'), "Figure 2.3 – Use cases: trading between sellers and distributors", 14.0),
('p', "The seller manages listings and decides on orders, the distributor places, edits and cancels orders, and "
      "both exchange messages, leave reviews and follow their notifications. The diagrams show logical "
      "relationships between functions, not the design of the system."),
('h2', "2.3 User Characteristics"),
('p', "The users of the platform and their rights are summarised in Table 2.3."),
('table', "Table 2.3 – Users and external actors of the system",
    ["Actor", "Type", "Description", "Main rights"],
    [[a.replace(' (segment S1)', '').replace(' (segment S2)', '').replace(' (segment S3)', '') for a in r] for r in ACTORS],
    [3.4, 2.4, 5.4, 6.8]),
('p', "The sellers are mostly owners of small and medium farms, often over 40, who use a smartphone every day for "
      "calls and messengers but rarely work with computers or complex forms. This is why the specification asks "
      "for short forms, a mobile-first interface, plain language and a first listing in under three minutes."),
('p', "The distributors are procurement managers or owners of shops and restaurants, used to office software and "
      "online shopping, who value speed, reliable stock and the possibility to compare offers. The administrators "
      "are platform staff with good digital skills, who need the reasons of every automatic decision in order to "
      "decide quickly. None of the user groups is expected to have technical training."),
('h2', "2.4 Constraints"),
('p', "The following factors limit the options of the developer:"),
('list', ["regulatory policies – personal data are processed according to Law No. 195/2024 on personal data "
          "protection [@law195]; only the data needed for trading are collected;",
          "interface to other applications – the e-mail, Google and AI services are used through their public "
          "interfaces, on free or low-cost plans;",
          "budget and team – the budget is zero and the system is built by a single developer within the "
          "academic year 2026–2027, so it must run on free hosting plans;",
          "audit and control functions – every change of stock and every automatic moderation decision must be "
          "recorded, so that disputes between partners can be clarified;",
          "reliability and criticality – the application is business-critical for its users only in the harvest "
          "season; a short outage is acceptable, a wrong stock or a lost order is not;",
          "security – the platform is public, so it must resist the common web attacks described by OWASP "
          "[@owasp] and the guessing of passwords and codes;",
          "language – the interface is in Romanian, the language of the target users."]),
('p', "Hardware limitations, parallel operation with another system, signal handshake protocols and requirements "
      "for a specific programming language do not apply: the system controls no hardware, replaces no running "
      "system and exchanges data only through standard web protocols. Safety does not apply either, since the "
      "system cannot cause physical harm."),
('h2', "2.5 Assumptions and Dependencies"),
('p', "The requirements are based on the following assumptions; if one of them changes, the specification must be "
      "reviewed:"),
('list', ["the users have a phone or computer with a current browser and an internet connection, even a slow one;",
          "every user has an e-mail address that they can read, since the account is confirmed by e-mail;",
          "the free plans of the hosting, database and e-mail providers remain available with similar limits; a "
          "change would affect NFR-03 and the memory constraints in 2.1.6;",
          "the AI service remains available at low or no cost; otherwise all listings of new sellers are moderated "
          "manually, which affects objective O2;",
          "in the first year the platform has at most a few hundred active producers and buyers, which is the basis of "
          "the performance requirements in 3.3;",
          "the delivery and the payment are arranged by the partners outside the platform."]),
('h2', "2.6 Apportioning of Requirements"),
('p', "The requirements were prioritised with the MoSCoW method [@clegg]. The mandatory requirements (Must, written "
      "with “shall”) form version 1.0 and are already implemented; the desirable ones (Should, written with "
      "“should”) and the optional one (Could, written with “may”) are also implemented but can be "
      "removed or simplified without harming the product. The functions in Table 2.4 are deferred to future "
      "versions."),
('table', "Table 2.4 – Requirements deferred to future versions",
    ["ID", "Function", "Reason for deferral"],
    [list(w) for w in R.WONT],
    [1.5, 6.5, 10.0]),
('p', "The deferred functions will be reconsidered after the pilot, in the order in which the users ask for them. "
      "Online payments and electronic invoices are the most likely candidates for version 2.0."),

# ===================================================================== 3
('h1', "3 SPECIFIC REQUIREMENTS"),
('p', "This chapter contains the requirements at the level of detail needed to design the system and to test it. "
      "Each requirement has a unique identifier and is written with “shall” if it is mandatory, "
      "“should” if it is desirable and “may” if it is optional. Every requirement is perceivable "
      "from outside the system and is verified by at least one test, as shown in Chapter 6."),
('h2', "3.1 External interfaces"),
('p', "The inputs of the system come from the users through the web interface. Table 3.1 lists every data item "
      "that a user can enter, with its purpose and its valid range. An input outside its range is refused with "
      "HTTP status 400 and a message in Romanian that names the field."),
('table', "Table 3.1 – Inputs of the system",
    ["Item", "Purpose", "Valid range, units and format"], INPUTS, [4.2, 5.2, 8.6]),
('p', "The outputs of the system are its screens, its e-mails and the answers to the requests of the interface. "
      "They are summarised in Table 3.2."),
('p', "The interface is organised in a few screens: the public catalogue with the details of a listing, the forms "
      "for registration and sign-in, the personal dashboard of the seller or distributor, the order conversations "
      "and the administration panel. Forms open as dialogs above the current screen, so the user does not lose the "
      "context."),
('table', "Table 3.2 – Outputs of the system",
    ["Output", "Destination", "Content and timing"],
    [["Catalogue and listing details", "Any user", "Active listings with stock, price, region, photo and seller rating; updated at each request"],
     ["Dashboard", "Seller, distributor", "Statistics, listings and orders of the user with their statuses"],
     ["In-app notification", "Party of an order, administrator", "Short text and link, created at the moment of the event"],
     ["Notification e-mail", "Party of an order", "Change of an order or new message; sent right after the event"],
     ["Code e-mail", "User who registers or resets a password", "Six-digit code valid 15 minutes"],
     ["Daily summary", "Administrators", "Moderation events of the last 24 hours, once per day at the configured hour"],
     ["Answer to a request", "Web interface", "JSON; success with the data, or an HTTP error status (400, 401, 403, 404, 409, 429) with a message for the user"]],
    [4.2, 4.4, 9.4]),
('p', "Every action of the user ends with a visible message: a confirmation when the action succeeds, or an "
      "explanation of what must be corrected when it fails."),
('h2', "3.2 Functions"),
('p', "The functional requirements are organised by feature. For each feature the purpose, the sequence of stimuli "
      "and responses, including the abnormal situations, and the associated requirements are given. The roles "
      "that use each requirement are shown in the tables, so the organisation also reflects the user classes."),
] + [None] + [
('h2', "3.3 Performance Requirements"),
('p', "The static numerical requirements are based on the expected scale of the first year. The system shall "
      "support at least 1,000 registered users, 1,000 active listings and 50 users working at the same time, and "
      "shall store photos of at most 10 MB each in a compressed form. The dynamic requirements are given in "
      "Table 3.8."),
_nfr_table("Table 3.8 – Performance requirements", ['NFR-01', 'NFR-02']),
('p', "Both requirements are verified with a load test on a copy of the platform filled with 1,000 listings, "
      "before the pilot and again in its middle."),
('h2', "3.4 Logical Database Requirements"),
('p', "The system stores the information listed in Table 3.9. Users, listings and orders are read at almost every "
      "request, messages and notifications several times per minute while a user is active, and the other data "
      "rarely."),
('table', "Table 3.9 – Data entities and integrity constraints",
    ["Entity", "Content", "Integrity constraints"], ENTITIES, [3.6, 8.0, 6.4]),
('p', "The constraints in Table 3.9 shall be enforced by the database itself and not only by the interface, so "
      "that no request, however malformed, can create a negative stock, an order without a listing or a second "
      "review of the same party."),
('p', "The relationships between the main entities are shown in Figure 3.1. A user can sell many listings and place "
      "many orders, each order belongs to one listing, and each order has its conversation and at most two "
      "reviews."),
('fig', os.path.join(_D, 'er.png'), "Figure 3.1 – Logical data model of the system", 11.0),
('p', "Access to the data is restricted by role: a user reads and changes only their own listings, orders, "
      "messages and notifications, while the administrator reads all accounts, listings and reviews. Orders, "
      "reviews and stock events are kept as long as the accounts involved exist, since they are the record of the "
      "deals; the codes become unusable once used or expired. A request of a user to delete their personal data is "
      "handled by the administrator, according to Law No. 195/2024 [@law195]."),
('h2', "3.5 Design Constraints"),
('p', "The design is constrained by the factors described in 2.4: the system shall be a web application usable "
      "without installation, it shall run on free hosting plans, its interface shall be in Romanian, and it shall "
      "use the external interfaces in 2.1.4 only through their public APIs. No other hardware or software "
      "constraint is imposed."),
('h3', "3.5.1 Standards Compliance"),
('p', "The system shall comply with Law No. 195/2024 on personal data protection [@law195]: it shall collect only "
      "the name, e-mail, phone and region of a user, publish the contacts of a seller only together with their "
      "listings, so that buyers can reach them, and never send the passwords or codes in clear text. It shall keep an audit trail of every change of stock, "
      "with the quantity added or removed, the reason, the author and the moment, and of every automatic "
      "moderation decision, with its reasons."),
('p', "Data shall be named and presented consistently: quantities in kilograms with two decimals, prices in lei "
      "per kilogram, dates in the format day.month.year and amounts with the Romanian number format. No accounting "
      "or report format is imposed, since the platform does not issue fiscal documents."),
('h2', "3.6 Software System Attributes"),
('p', "The quality attributes are specified as measurable non-functional requirements, classified according to "
      "ISO/IEC 25010:2023 [@iso25010]. Table 3.10 rates the importance of the quality characteristics proposed by "
      "the template and shows which requirements cover them."),
('table', "Table 3.10 – Importance of the quality characteristics",
    ["ID", "Characteristic", "H/M/L", "Covered by"], QUALITY, [1.2, 5.0, 2.2, 9.6]),
('p', "When two attributes conflict, correctness, security and reliability are preferred to efficiency and "
      "flexibility: a slower answer is acceptable, a wrong stock or a data leak is not. Reusability and "
      "flexibility have low importance because the system is not meant to be reused or reconfigured by others."),
('p', "Usability, rated high, is specified by NFR-09 (Should): in a test with 3 new users, each shall publish a "
      "first listing in at most 3 minutes and place an order in at most 5 actions from the catalogue, without "
      "help. It is measured again during the pilot with the System Usability Scale, as stated by objective O2."),
('h3', "3.6.1 Reliability"),
('p', "The system shall never lose an order or leave the stock in an inconsistent state, even when two users act "
      "at the same moment or an external service fails. The reliability requirements are given in Table 3.11."),
_nfr_table("Table 3.11 – Reliability requirements", ['NFR-04', 'NFR-05']),
('p', "NFR-04 is verified by the automated tests TC11 and TC12 on every change of the code, and NFR-05 by "
      "simulating an outage of the AI service."),
('h3', "3.6.2 Availability"),
('p', "The platform is used at any hour, but mostly during the working day in the harvest season. Its "
      "availability requirement is given in Table 3.12."),
_nfr_table("Table 3.12 – Availability requirement", ['NFR-03']),
('p', "After a failure the server shall restart automatically and resume work without manual intervention. Since "
      "every change is saved in a transaction, a user loses at most the form being filled in at the moment of the "
      "failure, which can be submitted again."),
('h3', "3.6.3 Security"),
('p', "The system must be protected against accidental or malicious access, modification or disclosure of the "
      "data. Table 3.13 contains the security requirements."),
_nfr_table("Table 3.13 – Security requirements", ['NFR-06', 'NFR-07', 'NFR-08']),
('p', "In addition, the server shall validate every input against the ranges in Table 3.1, regardless of the checks "
      "made by the interface, and shall record the stock and moderation events listed in 3.5.1."),
('h3', "3.6.4 Maintainability"),
('p', "The system is developed and maintained by one person, so errors must be found as soon as they are "
      "introduced. The maintainability requirement is given in Table 3.14."),
_nfr_table("Table 3.14 – Maintainability requirement", ['NFR-11']),
('p', "The settings of the external services shall be kept outside the source code, so that a provider can be "
      "changed without modifying it."),
('h3', "3.6.5 Portability"),
('p', "The users must be able to work from the devices they already have. The portability requirement is given in "
      "Table 3.15."),
_nfr_table("Table 3.15 – Portability requirement", ['NFR-10']),
('p', "On the server side, the system shall not depend on a particular operating system and shall run in any "
      "environment that provides the language runtime and a PostgreSQL-compatible database."),
('h2', "3.7 Organizing the Specific Requirements"),
('p', "The functional requirements in 3.2 are organised by feature, and inside each feature the role that uses each "
      "requirement is shown. The subsections below explain, for each organisation proposed by the template, "
      "whether and why it was used."),
('h3', "3.7.1 System Mode"),
('p', "Not applicable. The system has a single operating mode: it behaves in the same way at any hour and has no "
      "training, maintenance or degraded mode with different functions. The unattended tasks described in 2.1.7 "
      "run in the background and do not change the behaviour seen by the users."),
('h3', "3.7.2 User Class"),
('p', "Used as a secondary organisation. The four user classes, guest, seller, distributor and administrator, "
      "receive different sets of functions, so each requirement in Tables 3.3–3.7 states its role. A purely "
      "user-class organisation was not chosen because several features, such as orders and reviews, are shared by "
      "two classes and would have to be repeated."),
('h3', "3.7.3 Objects"),
('p', "Not used as the organisation of the requirements. The real-world objects of the domain, users, listings, "
      "orders and reviews, are described as data entities in 3.4; their classes, attributes and operations are "
      "modelled in the design, with UML class diagrams, and not in this specification."),
('h3', "3.7.4 Feature"),
('p', "Used as the main organisation. The platform has five clearly delimited sets of functions, each with its "
      "own purpose and its own sequence of stimuli and responses, so organising by feature keeps related "
      "requirements together and is easy to follow for both the users and the developer."),
('h3', "3.7.5 Stimulus"),
('p', "Not used as a separate organisation. The system is not event-driven in the sense of reacting to signals "
      "from devices; the stimuli are actions of the users, and they are already described in the stimulus and "
      "response sequence of each feature."),
('h3', "3.7.6 Response"),
('p', "Not used as a separate organisation. The responses of the system that are common to several features, the "
      "notifications and e-mails, are specified once, in requirement FR-18, and listed among the outputs in "
      "Table 3.2."),
('h3', "3.7.7 Functional Hierarchy"),
('p', "Not used. The organisations above proved sufficient, and the project uses object-oriented analysis with "
      "UML rather than structured analysis, so data flow diagrams and a data dictionary would repeat information "
      "already given in 3.1 and 3.4."),
('h2', "3.8 Additional Comments"),
('p', "Two organisations were combined, feature and user class, as the template allows for systems in which one "
      "organisation alone is not enough. Three notations support the requirements: the use case diagrams in 2.2, "
      "the stimulus and response sequences in 3.2, and the user stories with acceptance criteria in Table 3.16, "
      "which state the main needs in the words of the users [@cohn]."),
('table', "Table 3.16 – Main user stories with acceptance criteria",
    ["ID", "User story", "Acceptance criteria", "Tests"], _rows("Table 1.18"), [1.3, 6.6, 7.6, 2.5]),
('p', "Each user story is short on purpose: details such as the exact wording of the messages or the layout of "
      "the screens are settled in the design, while the acceptance criteria fix what must not change."),

# ===================================================================== 4
('h1', "4 CHANGE MANAGEMENT PROCESS"),
('p', "After its approval, this specification is the reference for the design, the implementation and the tests. "
      "It can be changed only through the following process:"),
('list', ["a change is proposed in writing, by the coordinator, by a user of the pilot or by the developer, as an "
          "issue in the repository of the project, stating the requirement concerned, the reason and the expected "
          "effect;",
          "the developer analyses the impact of the change on the other requirements, the use cases, the code and "
          "the tests, using the traceability matrix in Chapter 6, and proposes a MoSCoW priority;",
          "changes that affect a mandatory requirement, an objective or the scope are approved by the coordinator; "
          "smaller changes, such as a new desirable requirement or a clarification, are decided by the developer "
          "and reported at the next meeting;",
          "the approved change is made in the document, the version number is increased (1.1, 1.2 for "
          "clarifications and new desirable requirements, 2.0 for a change of scope), and the change is recorded "
          "in the history of the repository together with the code and the tests that implement it."]),
('p', "A requirement is never deleted silently: if it is dropped, its identifier remains, with the mention that it "
      "was withdrawn and why, so that the numbering and the traceability stay valid."),

# ===================================================================== 5
('h1', "5 DOCUMENT APPROVALS"),
('p', "The specification is approved by the persons listed in Table 5.1. By signing, the coordinator confirms that "
      "the requirements correspond to the topic and the objectives of the bachelor's project, and the author "
      "confirms that the system will be developed and tested according to them."),
('table', "Table 5.1 – Approvers of the specification",
    ["Role", "Name", "Signature", "Date"],
    [["Scientific coordinator", "Ciutac Ștefănița", "", ""],
     ["Author, developer", "Obrijan Filip, FAF-232", "", ""]],
    [4.6, 5.4, 4.4, 3.6]),
('p', "Version 1.0 of the document becomes the reference for the following stages of the project once both "
      "signatures are present."),

# ===================================================================== 6
('h1', "6 SUPPORTING INFORMATION"),
('p', "The supporting information makes the specification easier to use. The table of contents and the list of "
      "abbreviations are at the beginning of the document, and the references at its end. An index is not "
      "provided: the document is short, it is distributed in electronic form, where any term can be searched, and "
      "each requirement can be found by its identifier."),
('p', "The two tables below are informative and are not part of the requirements. Table 6.1 shows how the informal "
      "requirements formulated at the beginning of the project were clarified; it explains the origin of several "
      "requirements of Chapter 3."),
('table', "Table 6.1 – Clarification of the informal requirements",
    ["Informal requirement (as stated)", "Clarifying question", "Decision"], CLARIF, [4.4, 4.2, 9.4]),
('p', "Each decision in Table 6.1 names a value, an event or a rule that can be observed in the finished system, "
      "and each was turned into one or more of the functional requirements in 3.2."),
('p', "Table 6.2 traces every functional requirement to the goals and objectives of the project, to the use cases "
      "in Figures 2.2 and 2.3 and to the tests that verify it. “Manual” marks the requirements verified by a "
      "manual test scenario instead of an automated test."),
('table', "Table 6.2 – Traceability of the functional requirements",
    ["Requirement", "Priority", "Goals and objectives", "Use cases", "Tests"], TRACE, [2.6, 2.2, 4.4, 3.2, 5.6]),
('p', "Every requirement serves at least one goal, belongs to at least one use case and is verified by at least one "
      "test, which makes the specification complete and traceable in the sense of IEEE Std 830."),
]

_i = BLOCKS.index(None)
BLOCKS = BLOCKS[:_i] + _feature_blocks() + BLOCKS[_i + 1:]
