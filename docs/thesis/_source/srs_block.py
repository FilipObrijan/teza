# -*- coding: utf-8 -*-
import os
_D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diagrams')

SRS = [
('h2', "1.6 Software requirements specification"),
('p', "The previous subchapters explain why the platform is needed and for whom it is built. This subchapter states "
      "what the system must do and how well it must do it, in a form that can later be modelled, implemented and "
      "tested. It follows the structure recommended by the ISO/IEC/IEEE 29148 standard for requirements "
      "engineering, which treats a software requirements specification (SRS) as the agreed description of the "
      "system that both the client and the developer rely on [@ieee29148]."),
('p', "The specification was produced in three steps. First, the initial requirements were written down in an "
      "informal way, as a future user or the owner of the platform would say them. Then each of them was clarified "
      "by questions about its meaning, limits and exceptions, which also brought out the goals, the constraints and "
      "the main user flows. Finally, the clarified requirements were written as functional requirements, which "
      "describe what the system does, and non-functional requirements, which describe the qualities and limits of "
      "the system as a whole [@sommerville]. The functional requirements are numbered FR-01 to FR-22, so that they "
      "can be traced to use cases, UML models and test cases in the following chapters."),

('h3', "1.6.1 Informal requirements and their clarification"),
('p', "The informal requirements come from the analysis in subchapters 1.1–1.5: the problems from Table 1.2, the "
      "needs of the personas and the value proposition. They were deliberately kept in everyday language, the way "
      "a farmer or a buyer would put them in a conversation, for example \u201cnobody should be able to sell the same "
      "tomatoes twice\u201d or \u201cit should cost nothing to start\u201d. Eight such statements were collected, and they "
      "are listed in the first column of Table 1.12."),
('p', "Before clarifying the individual statements, it is useful to fix the goals of the system, since every decision "
      "has to serve at least one of them. They follow directly from the three key problems in Table 1.10 and from "
      "the value proposition:"),
('list', ["G1 – shorten the time needed by producers and buyers to find each other and agree on a deal;",
          "G2 – keep a single, shared record of stock, orders and agreements;",
          "G3 – build trust between partners who do not know each other;",
          "G4 – keep the platform free and easy to use for small producers."]),
('p', "Just as important are the constraints, which limit the possible solutions regardless of what the users would "
      "like to have:"),
('list', ["the budget is zero, so the system must run on free plans of hosting, database and e-mail services;",
          "the system is built by a single developer within the academic year 2026–2027;",
          "the interface is in Romanian, the language of the target users;",
          "the system is a web application, available on phones and computers without installation;",
          "personal data are processed according to Law No. 195/2024 on personal data protection [@law195];",
          "payments, fiscal documents and transport remain outside the scope, as established in subchapter 1.2."]),
('p', "With the goals and constraints in place, the informal statements can be clarified. Each of them is useful as "
      "an intention, but none of them can be implemented or tested as it is. "
      "\u201cQuickly\u201d, \u201creally left\u201d or \u201cknow whom\u201d can be understood in several ways. For this reason every "
      "statement was clarified by asking what exactly it means, when it applies and what happens in the unusual "
      "cases. The questions and the decisions taken are shown in the same table."),
('table', "Table 1.12 – Clarification of the informal requirements",
    ["Informal requirement (as stated)", "Clarifying question", "Decision"],
    [["\u201cFarmers should put their produce online quickly, from the phone\u201d", "What must a listing contain, and on which device is it created?", "One form with product, variety, quantity in kilograms, price per kilogram, region and a mandatory photo; the interface works in the phone browser, nothing is installed"],
     ["\u201cBuyers must see how much is really left\u201d", "When exactly does the stock change?", "Stock decreases only when the seller accepts an order and returns if an accepted order is cancelled; at zero the listing is paused"],
     ["\u201cNobody should sell the same tomatoes twice\u201d", "What if two orders are accepted at the same moment?", "Acceptance runs in a database transaction that locks the listing; the second acceptance fails if the stock is no longer enough"],
     ["\u201cAgreements should be written somewhere, not only said on the phone\u201d", "What counts as an agreement?", "An order with quantity, the price fixed at the moment of ordering, the total amount, a status and its own conversation"],
     ["\u201cPeople need to know whom they are dealing with\u201d", "How is a participant verified?", "The e-mail is confirmed with a code, the account is approved automatically or by the administrator, and reviews can be left only after a real order"],
     ["\u201cThe platform should tell me when something happens with my order\u201d", "Which events and through which channel?", "New, changed, accepted, rejected, delivered and cancelled orders produce an in-app notification and an e-mail; new messages update the unread counter and produce an e-mail"],
     ["\u201cFake and spam listings must not reach the catalogue\u201d", "Who decides whether a listing is acceptable?", "Rule-based checks and an AI check run first; doubtful listings wait for the administrator together with the reasons"],
     ["\u201cIt should cost nothing to start\u201d", "Free for whom, and for how long?", "Users pay no fees; the platform runs on free hosting plans while the number of users is small"]],
    [4.4, 4.2, 9.4]),
('p', "The decisions in Table 1.12 are already concrete enough to be checked. Each of them names a value, an event "
      "or a rule that can be observed in the finished system, and together they became the basis of the functional "
      "requirements formulated in paragraph 1.6.3."),
('p', "The clarification also showed which sequences of actions matter most for the users. Four key user flows "
      "were identified, and the rest of the functionality exists mainly to support them. They are summarised in "
      "Table 1.13."),
('table', "Table 1.13 – Key user flows",
    ["Flow", "Actors", "Main steps", "Result"],
    [["F1. Publishing an offer", "Seller, AI service, administrator", "- the seller fills in the listing form and adds a photo;\n- the system checks the listing with rules and AI;\n- the listing is published or waits for the administrator", "The offer is visible in the catalogue"],
     ["F2. Ordering", "Distributor, seller", "- the distributor finds a listing and sees its stock and rating;\n- the distributor sends an order with the quantity;\n- the seller accepts or rejects it and the stock is updated", "A confirmed order and an updated stock"],
     ["F3. Delivery and feedback", "Seller, distributor", "- the details are discussed in the order conversation;\n- the seller delivers and marks the order as delivered;\n- both parties leave reviews", "A closed deal and updated ratings"],
     ["F4. Moderation", "Administrator", "- the administrator is notified about pending items;\n- reads the reasons and approves, rejects or rechecks;\n- adjusts the moderation settings when needed", "A catalogue without spam and fake offers"]],
    [3.0, 2.8, 9.2, 3.0]),
('p', "Flows F1 and F2 cover the core of the platform and correspond to the two primary segments from Table 1.7. "
      "Flow F3 closes the loop of trust described in subchapter 1.5, because reviews are only possible after a real "
      "order, while flow F4 belongs to the administrator and keeps the catalogue clean without making the users "
      "wait longer than necessary."),

('h3', "1.6.2 General description of the system, actors and roles"),
('p', "AgroHub is a B2B web platform through which agricultural producers in the Republic of Moldova sell their "
      "produce wholesale directly to distributors, shops and HoReCa businesses. The system covers the part of the "
      "trade that today happens by phone: publishing an offer, searching for products, ordering, confirming the "
      "order, communicating about it and evaluating the partner afterwards. The public version of the platform is "
      "available at https://agrohub-efh.pages.dev/."),
('p', "The system has a three-tier client-server architecture. The web client runs in the browser and adapts to "
      "phone, tablet and computer screens. It communicates with a REST API on the server, which applies all the "
      "business rules and stores the data in a PostgreSQL database. Three external services complete the system: "
      "an e-mail service for codes and notifications, Google Identity Services for signing in with a Google account, "
      "and an AI service that checks new listings. The boundary of the system and its exchanges with the "
      "environment are shown in the context diagram in Figure 1.2."),
('fig', os.path.join(_D, 'context.png'), "Figure 1.2 – Context diagram of the AgroHub platform", 15.5),
('p', "In Figure 1.2 the platform is represented as a single block, without its internal structure. On the left "
      "are the four human actors and the information they send to the system: the guest searches the catalogue and "
      "registers, the seller manages listings, stock and order decisions, the distributor sends orders and reviews, "
      "and the administrator takes decisions about accounts, listings and settings. On the right are the external "
      "systems: the platform sends codes, notifications and the daily summary to the e-mail service, asks Google to "
      "verify the sign-in token, and sends the text and photo of a listing to the AI service, which returns a "
      "verdict. The internal structure of the platform is modelled in Chapter 2."),
('p', "The actors are summarised in Table 1.14. Each human actor corresponds to a role in the system, and the "
      "rights of the role are checked by the server for every request, not only hidden in the interface."),
('table', "Table 1.14 – Actors and roles of the system",
    ["Actor", "Type", "Description", "Main rights"],
    [["Guest", "Human", "Any visitor who has not signed in", "Browse and search the catalogue, register, sign in"],
     ["Seller", "Human, role", "Producer or company that owns the goods (segment S1)", "Manage listings and stock, accept, reject and deliver orders, messages, reviews"],
     ["Distributor", "Human, role", "Wholesale buyer (segment S2)", "Place, edit and cancel orders, messages, reviews"],
     ["Administrator", "Human, role", "Platform staff (segment S3)", "Approve, reject and block accounts, moderate listings and reviews, change settings"],
     ["E-mail service", "External system", "Brevo, used for transactional e-mails", "Receives messages to be delivered to users"],
     ["Google Identity Services", "External system", "Google sign-in", "Confirms the identity behind a Google sign-in token"],
     ["AI moderation service", "External system", "Gemini, with Claude as an alternative", "Receives a listing and returns an approval verdict with a reason"]],
    [3.4, 2.4, 5.4, 6.8]),
('p', "A registered seller or distributor keeps all the rights of a guest, so the catalogue remains available to "
      "them after signing in. The administrator does not trade on the platform and therefore has no access to "
      "ordering, which keeps the moderation role independent from the commercial one."),

('h3', "1.6.3 Functional requirements"),
('p', "The functional requirements are written as verifiable actions of the system, one function per requirement. "
      "Each has a unique identifier, the role that uses it and a priority: mandatory requirements are needed for the "
      "first public version, desirable ones increase its value but the platform can work without them. To keep the "
      "tables readable, the requirements are grouped in two tables. Table 1.15 contains the requirements for "
      "accounts, the catalogue and the listings."),
('table', "Table 1.15 – Functional requirements: accounts, catalogue and listings",
    ["ID", "Name", "Description", "Role", "Priority"],
    [["FR-01", "Registration", "The system allows a guest to create a seller or distributor account with name, e-mail, password and, optionally, phone and region", "Guest", "Mandatory"],
     ["FR-02", "E-mail verification", "The system sends a six-digit code to the e-mail address and activates the account only after the correct code is entered", "Guest", "Mandatory"],
     ["FR-03", "Authentication", "The system allows signing in with e-mail and password", "All", "Mandatory"],
     ["FR-04", "Google sign-in", "The system allows signing in or registering with a Google account", "All", "Desirable"],
     ["FR-05", "Password recovery", "The system allows setting a new password with a code sent by e-mail", "All", "Mandatory"],
     ["FR-06", "Account approval", "The system approves verified accounts automatically or leaves them to the administrator, who can approve, reject or block any account", "Administrator", "Mandatory"],
     ["FR-07", "Catalogue search", "The system displays the active listings and allows searching by product or variety and filtering by region", "All", "Mandatory"],
     ["FR-08", "Listing details", "The system displays the quantity, price per kilogram, region, harvest date, delivery terms, contacts and rating of the seller", "All", "Mandatory"],
     ["FR-09", "Listing management", "The system allows a seller to create, edit, pause and delete listings; a new listing requires a photo", "Seller", "Mandatory"],
     ["FR-10", "Stock adjustment", "The system allows a seller to correct the stock of a listing with a stated reason and records every change", "Seller", "Desirable"],
     ["FR-11", "Automatic listing check", "The system checks every new or edited listing with rules and an AI service and leaves doubtful listings to the administrator, with the reasons", "System", "Mandatory"]],
    [1.4, 2.7, 9.0, 2.6, 2.3]),
('p', "Account approval (FR-06) is the first barrier against fake participants and applies before a user can publish "
      "or order anything. The second barrier, the automatic listing check (FR-11), is what makes publishing fast for "
      "honest sellers without opening the catalogue to spam. A trusted seller sees the listing published in seconds, "
      "while an unusual price, a link in the text or an unrelated photo sends it to the administrator."),
('p', "Table 1.16 covers the life cycle of an order, from the request of the distributor to the delivery confirmed by "
      "the seller, together with the communication between users, the reviews and the administration of the platform."),
('table', "Table 1.16 – Functional requirements: orders, communication and administration",
    ["ID", "Name", "Description", "Role", "Priority"],
    [["FR-12", "Placing an order", "The system allows a distributor to order a quantity no larger than the available stock, with an optional message; the price is fixed at the moment of ordering", "Distributor", "Mandatory"],
     ["FR-13", "Accepting or rejecting", "The system allows the seller to accept or reject a pending order; on acceptance the stock decreases and a listing with zero stock is paused", "Seller", "Mandatory"],
     ["FR-14", "Editing or cancelling", "The system allows the distributor to edit and resend an order that is pending, rejected or cancelled, and to cancel an order that is not yet delivered; the stock of an accepted order is restored", "Distributor", "Mandatory"],
     ["FR-15", "Delivery confirmation", "The system allows the seller to mark an accepted order as delivered, after which it can no longer be cancelled", "Seller", "Mandatory"],
     ["FR-16", "Personal dashboard", "The system shows each user the statistics and the history of their listings and orders, and lets them hide old orders from their own history", "Seller, distributor", "Mandatory"],
     ["FR-17", "Order conversation", "The system provides a conversation for every order and shows the number of unread messages", "Seller, distributor", "Mandatory"],
     ["FR-18", "Notifications", "The system creates an in-app notification and sends an e-mail for every change of an order; for a new message it sends an e-mail, unless the recipient has read the conversation in the last 30 seconds", "Seller, distributor, administrator", "Mandatory"],
     ["FR-19", "Reviews", "The system allows both parties of an accepted or delivered order to give a rating from 1 to 5 with a comment, and the reviewed user to reply; the average rating is public", "Seller, distributor", "Mandatory"],
     ["FR-20", "Moderation of listings and reviews", "The system allows the administrator to approve or reject listings, to request a new AI check and to delete reviews or replies", "Administrator", "Mandatory"],
     ["FR-21", "Moderation settings", "The system allows the administrator to change the automatic approval rules: thresholds for trusted sellers, price limits, banned words and the AI check", "Administrator", "Desirable"],
     ["FR-22", "Daily summary", "The system sends the administrators a daily e-mail summary of the moderation events at a configured hour, Moldova time", "Administrator", "Desirable"]],
    [1.4, 2.7, 9.0, 2.6, 2.3]),
('p', "Together, FR-12 to FR-15 define the order statuses: pending, confirmed, rejected, cancelled and completed "
      "(delivered). This life cycle is modelled as a state machine diagram in Chapter 2."),
('p', "Out of the 22 functional requirements, 18 are mandatory and 4 are desirable. All of them are already "
      "implemented in the current version of the platform, which makes it possible to verify each one through the "
      "test cases described in Chapter 3."),

('h3', "1.6.4 Use cases and user stories"),
('p', "The functional requirements describe the system from the inside. Use cases describe the same behaviour from "
      "the point of view of the actors: what each actor can achieve with the system. Following the recommendation to "
      "draw separate diagrams for different groups of actors, the use cases were split into two diagrams. "
      "Figure 1.3 shows the use cases related to access and administration."),
('fig', os.path.join(_D, 'usecases_access.png'), "Figure 1.3 – Use case diagram: access and administration", 14.0),
('p', "In Figure 1.3 the guest can browse the catalogue (UC01), register (UC02) and sign in (UC04). Registration "
      "always includes the verification of the e-mail with a code (UC03), which is why it is connected by an "
      "«include» relationship and linked to the e-mail service. Signing in with Google (UC04a) is an optional "
      "variant of signing in, shown as «extend», and depends on Google Identity Services. The administrator "
      "moderates accounts (UC14), moderates listings and reviews (UC15), where the AI service can be asked to check a "
      "listing again, and configures the automatic moderation (UC16)."),
('p', "The second diagram, in Figure 1.4, contains the use cases through which sellers and distributors trade with "
      "each other. Use cases common to both roles are placed in the middle of the system boundary."),
('fig', os.path.join(_D, 'usecases_trading.png'), "Figure 1.4 – Use case diagram: trading between sellers and distributors", 14.0),
('p', "The seller, on the left of Figure 1.4, manages listings and stock (UC05), accepts or rejects orders (UC09) "
      "and marks them as delivered (UC10). Every change of a listing includes its automatic check (UC06), performed "
      "with the AI moderation service. The distributor, on the right, places orders (UC07) and edits or cancels them "
      "(UC08). Both roles exchange messages on an order (UC11), leave reviews (UC12) and follow their orders and "
      "notifications (UC13), for which the e-mail service delivers the messages outside the platform."),
('p', "Table 1.17 links each use case to the functional requirements it covers. All 22 requirements appear in the "
      "table, which confirms that the use case model is complete with respect to the specification."),
('table', "Table 1.17 – Use cases and the functional requirements they cover",
    ["Use case", "Name", "Actors", "Requirements"],
    [["UC01", "Browse and search the catalogue", "Guest, seller, distributor", "FR-07, FR-08"],
     ["UC02", "Register an account", "Guest", "FR-01"],
     ["UC03", "Verify the e-mail with a code", "Guest, e-mail service", "FR-02"],
     ["UC04", "Sign in", "Guest", "FR-03, FR-05"],
     ["UC04a", "Sign in with Google", "Guest, Google Identity Services", "FR-04"],
     ["UC05", "Manage listings and stock", "Seller", "FR-09, FR-10"],
     ["UC06", "Check a listing automatically", "AI moderation service", "FR-11"],
     ["UC07", "Place an order", "Distributor", "FR-12"],
     ["UC08", "Edit or cancel an order", "Distributor", "FR-14"],
     ["UC09", "Accept or reject an order", "Seller", "FR-13"],
     ["UC10", "Mark an order as delivered", "Seller", "FR-15"],
     ["UC11", "Exchange messages on an order", "Seller, distributor", "FR-17"],
     ["UC12", "Leave a review", "Seller, distributor", "FR-19"],
     ["UC13", "Follow orders and notifications", "Seller, distributor, e-mail service", "FR-16, FR-18"],
     ["UC14", "Moderate accounts", "Administrator", "FR-06"],
     ["UC15", "Moderate listings and reviews", "Administrator, AI moderation service", "FR-11, FR-20"],
     ["UC16", "Configure automatic moderation", "Administrator", "FR-21, FR-22"]],
    [1.8, 6.0, 6.8, 3.4]),
('p', "The detailed specification of the main use cases, with preconditions, main and alternative flows, is "
      "presented in Chapter 2, where the use case model is refined together with the other UML diagrams."),
('p', "Use cases are complemented by user stories, which state the same needs in the words of the user and add "
      "acceptance criteria that tell when the story is done [@cohn]. Table 1.18 contains the main user stories. "
      "The last column refers to the automated test cases that check each story, described in Chapter 3."),
('table', "Table 1.18 – Main user stories with acceptance criteria",
    ["ID", "User story", "Acceptance criteria", "Tests"],
    [["US01", "As a seller, I want to publish a listing with a photo from my phone, so that buyers see my produce the same day", "The listing is saved; a trusted seller's listing is published at once, a new seller's listing waits for moderation with the reason shown", "TC05, TC06"],
     ["US02", "As a distributor, I want to see the real stock of a listing, so that I do not order goods that are already sold", "An order larger than the stock is refused with a message showing the available quantity", "TC07"],
     ["US03", "As a seller, I want to accept or reject an order with one click, so that the buyer quickly knows whether the deal happens", "Acceptance reduces the stock once, a second or simultaneous acceptance is refused, the buyer is notified", "TC10, TC11, TC12"],
     ["US04", "As a distributor, I want to cancel an order before delivery, so that I can react to changes in my plans", "The stock of a cancelled accepted order is restored; a delivered order cannot be cancelled", "TC15, TC16"],
     ["US05", "As a seller, I want to mark an order as delivered, so that the deal is closed", "Only an accepted order can be marked as delivered; the distributor is notified", "TC13, TC14"],
     ["US06", "As a distributor, I want to read the reviews of a seller, so that I can trust an unknown producer", "A review is possible only after an accepted order, with a rating from 1 to 5; the average is shown on the listing", "TC17"],
     ["US07", "As a user, I want to be notified about my orders, so that I do not have to check the site all the time", "Each change of an order creates a notification; notifications can be marked as read", "TC08, TC14, TC18"],
     ["US08", "As an administrator, I want to block a dishonest user, so that they can no longer trade", "A blocked user loses access immediately and cannot sign in again", "TC19"]],
    [1.3, 6.6, 7.6, 2.5]),
('p', "Each user story is short on purpose. The details that are not written in the story, such as the exact error "
      "messages or the layout of the screens, are settled during implementation, while the acceptance criteria fix "
      "what must not change."),

('h3', "1.6.5 Non-functional requirements and acceptance criteria"),
('p', "The non-functional requirements describe how well the system must perform its functions. They were "
      "formulated in a measurable way, so that each of them can be checked, and are grouped into two tables. "
      "Table 1.19 covers performance, reliability, usability, portability and maintainability."),
('table', "Table 1.19 – Non-functional requirements: quality of the system",
    ["ID", "Category", "Requirement"],
    [["NFR-01", "Performance", "The catalogue and the usual operations respond in at most 2 seconds with up to 1,000 active listings"],
     ["NFR-02", "Data integrity", "Simultaneous operations on the same listing never lead to selling more than the available stock"],
     ["NFR-03", "Availability", "The API exposes a health endpoint that is checked every 5 minutes by an external monitor, which also keeps the free server awake"],
     ["NFR-04", "Reliability", "The database schema is updated automatically and repeatably at every start of the server; a failed update stops the start"],
     ["NFR-05", "Usability", "The interface is in Romanian and adapts to screens from 360 pixels wide; irreversible actions require a confirmation"],
     ["NFR-06", "Portability", "The client works in the last two versions of Chrome, Firefox, Safari and Edge, with nothing to install"],
     ["NFR-07", "Maintainability", "Client and server are written in TypeScript; the automated API tests run on every change pushed to the repository"],
     ["NFR-08", "Storage", "Listing photos up to 10 MB are converted to WebP and stored in the database, so they survive restarts of the server"]],
    [1.8, 3.0, 13.2]),
('p', "Several of these values are imposed by the free hosting plan. Requirement NFR-03, for example, exists because a "
      "free server is put to sleep after a period of inactivity, and the first request after that would otherwise "
      "take too long."),
('p', "The second group, in Table 1.20, deals with security and the protection of personal data. It is based on the "
      "most common risks of web applications described by OWASP [@owasp] and on the national legislation."),
('table', "Table 1.20 – Non-functional requirements: security and data protection",
    ["ID", "Category", "Requirement"],
    [["NFR-09", "Authentication", "Passwords have at least 8 characters and are stored only as bcrypt hashes; a session token is valid for 7 days"],
     ["NFR-10", "Verification codes", "E-mail and password reset codes are stored as SHA-256 hashes, expire after 15 minutes and allow at most 5 attempts"],
     ["NFR-11", "Abuse protection", "At most 20 sign-in attempts and 5 e-mail sending requests are accepted from one address in 15 minutes"],
     ["NFR-12", "Access control", "Every protected request is checked on the server against the role and status of the user; a blocked account loses access immediately"],
     ["NFR-13", "Input validation", "All input data are validated on the server, SQL queries are parameterised, and security HTTP headers are set"],
     ["NFR-14", "Transport", "All communication between the browser, the server and the external services uses HTTPS"],
     ["NFR-15", "Personal data", "Only the data needed for trading are collected (name, e-mail, phone, region), in line with Law No. 195/2024 [@law195]"]],
    [1.8, 3.0, 13.2]),
('p', "The system is considered acceptable when all of the following criteria are met:"),
('list', ["all mandatory functional requirements are implemented and each is covered by at least one test case;",
          "the automated test cases TC01–TC19 pass on every change of the code;",
          "the key user flows F1–F4 can be completed in the public version of the platform;",
          "the measurable non-functional requirements are verified and their results reported in Chapter 3."]),
('p', "With these criteria the specification is complete. It translates the findings of the field analysis into 22 "
      "functional and 15 non-functional requirements, all traceable to use cases and tests, and it is the starting "
      "point for the UML modelling of the system in Chapter 2."),
]
