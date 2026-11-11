# -*- coding: utf-8 -*-
# "Project Proposal" document: market research, purpose with two SMART objectives,
# target audience and unique value proposition. Separate deliverable (exported as PDF).
# The research tables are taken from content.py, so the proposal and the report never disagree.
import content as C

TITLE = "PROJECT PROPOSAL"
SUBTITLE = C.TITLE

ABBREVIATIONS = [
    ("AI", "Artificial Intelligence"),
    ("B2B", "Business-to-Business, trade relations between companies"),
    ("HoReCa", "Hotels, Restaurants and Cafés, the food service sector"),
    ("MVP", "Minimum Viable Product"),
    ("SMART", "Specific, Measurable, Achievable, Relevant, Time-bound"),
    ("SUS", "System Usability Scale"),
    ("SWOT", "Strengths, Weaknesses, Opportunities, Threats"),
    ("UVP", "Unique Value Proposition"),
]

REFS = {
    'doran': 'G. T. Doran, "There\'s a S.M.A.R.T. way to write management\'s goals and objectives," Management Review, vol. 70, no. 11, pp. 35–36, 1981.',
    'brooke': 'J. Brooke, "SUS: A ‘quick and dirty’ usability scale," in Usability Evaluation in Industry, P. W. Jordan, B. Thomas, B. A. Weerdmeester, and I. L. McClelland, Eds. London, UK: Taylor & Francis, 1996, pp. 189–194.',
    'sauro': 'J. Sauro, A Practical Guide to the System Usability Scale: Background, Benchmarks & Best Practices. Denver, CO, USA: Measuring Usability LLC, 2011.',
}


def _table(prefix, caption):
    """Takes a table of the report by the start of its caption and gives it a new caption."""
    for i, b in enumerate(C.CH1):
        if b[0] == 'table' and b[1] and b[1].startswith(prefix):
            out = [('table', caption) + tuple(b[2:])]
            nxt = C.CH1[i + 1]
            if nxt[0] == 'table' and nxt[1] is None:   # second half of a split table (SWOT)
                out.append(nxt)
            return out
    raise KeyError(prefix)


UVP = next(b for b in C.CH1 if b[0] == 'quote')
HYPOTHESES = next(b for b in C.CH1 if b[0] == 'list' and b[1][0].startswith('H1'))

BLOCKS = [
('h1', "1 INTRODUCTION"),
('p', "AgroHub is a B2B web platform through which agricultural producers in the Republic of Moldova sell their "
      "produce wholesale directly to distributors, shops and HoReCa businesses. Today most of these deals are "
      "arranged by phone, in messenger groups or at wholesale markets, without a shared record of the available "
      "stock, the orders and the agreements. The platform brings these steps into one place: offers with a real "
      "stock, orders with a clear status, a conversation for every order and verified participants."),
('p', "This proposal turns the general idea of the application into a justified project. Chapter 2 presents the "
      "market research: similar solutions, the needs of the users, the target user profiles and a simplified SWOT "
      "analysis. Chapter 3 refines the purpose of the project and sets two SMART objectives. Chapter 4 describes "
      "the target audience, the key problems addressed by the application and its unique value proposition. "
      "Chapter 5 summarises why the project answers a real need. A working version of the platform is publicly "
      "available at https://agrohub-efh.pages.dev/."),

('h1', "2 MARKET RESEARCH AND NEEDS ANALYSIS"),
('p', "The purpose of the research was to check whether the idea responds to a real need and to understand the "
      "users before fixing the objectives. Agriculture and food processing account for more than 18 percent of the "
      "GDP of Moldova and for about 45 percent of its exports [@trade], and small farms produce more than 62 percent "
      "of the agricultural output [@fao_small]. These producers rarely have a sales department: they sell through "
      "personal contacts and intermediaries, which is exactly the part of the trade the platform digitalises."),
('p', "Three activities were carried out: an analysis of similar systems, the preparation of a short survey and "
      "interviews with potential users, and the definition of the target user profiles. Their results are "
      "summarised in a simplified SWOT analysis at the end of the chapter."),

('h2', "2.1 Similar solutions on the market"),
('p', "Five existing systems were analysed. Three are international platforms that digitalise trade in food or "
      "agricultural products, and two are Moldovan platforms that the target users already know. Table 2.1 gives the "
      "general information about them [@tridge], [@choco], [@grubmarket], [@agromag], [@simpals]."),
] + _table("Table 1.3", "Table 2.1 – General information on the analysed systems") + [
('p', "The systems differ mostly in their target market and in who pays for the service. The international "
      "platforms are financed by fees, licences or a margin on the goods, while the local ones are free or paid by "
      "supplier companies."),
('p', "Table 2.2 sums up the strengths and weaknesses of each system from the point of view of a Moldovan producer "
      "who wants to sell a few tonnes of produce to a buyer in the same region."),
('table', "Table 2.2 – Strengths and weaknesses of the analysed systems",
    ["System", "Strengths", "Weaknesses"],
    [["Tridge", "Global reach, market prices and trade data, support for quality checks and logistics", "Built for international deals of container size; not suited to local lots of a few tonnes"],
     ["Choco", "Simple, structured ordering that replaces calls and voice messages; free for restaurants", "Digitalises existing relationships, does not help to find new producers; not available in Moldova"],
     ["GrubMarket", "Real-time stock and order management for food distribution", "Acts largely as a distributor itself; software made for medium and large companies in the United States"],
     ["Agromag.md", "Local, Romanian interface, verified suppliers", "Sells seeds, fertilisers and equipment to farmers; does not help farmers sell their harvest"],
     ["999.md", "Very large audience, free basic ads, already used by most farmers", "No stock, no orders and no verification; the deal continues by phone"]],
    [2.8, 7.4, 7.8]),
('p', "None of the systems combines all the elements needed by small and medium producers in Moldova: a local and "
      "free catalogue of farm produce, a real stock on every listing, orders with a status and a conversation "
      "attached to them, and verified participants. This combination is the niche of the proposed platform."),

('h2', "2.2 Preliminary feedback from potential users"),
('p', "To compare the conclusions of the analysis with the experience of real people, a short questionnaire and "
      "semi-structured interviews of 15–20 minutes were prepared for three types of potential users: a vegetable "
      "producer, a distributor and a buyer from the HoReCa or retail segment. The questions cover how the "
      "respondents sell or buy today, what takes them the most time and what they would expect from an online "
      "platform."),
('p', "At the time of writing, the interviews are scheduled but have not yet taken place. The expected answers of "
      "each respondent profile were therefore formulated as working hypotheses, derived from the analysis of the "
      "field. Table 2.3 presents them; they are not interview results and will be confirmed or corrected by the "
      "real answers."),
] + _table("Table 1.6", "Table 2.3 – Working hypotheses about the needs of each respondent profile") + [
('p', "The hypotheses were reduced to five statements that can be checked in the interviews. A statement is "
      "considered confirmed if at least two of the three respondents support it:"),
HYPOTHESES,
('p', "The hypotheses that are not confirmed will change the requirements of the system, and the same respondents "
      "are planned to test the platform during the pilot operation described in Chapter 3."),

('h2', "2.3 Target user profiles"),
('p', "The two sides of a deal were described with the help of personas: fictional but realistic profiles that "
      "bring together the typical goals, habits and frustrations of a group of users [@cooper]. The first persona, "
      "the producer, is shown in Table 2.4."),
] + _table("Table 1.8", "Table 2.4 – Persona 1: the seller (agricultural producer)") + [
('p', "Ion is not against technology, but he will not spend an evening learning a new system during the harvest. "
      "For him a platform is useful only if it saves time from the very first offer he publishes."),
('p', "The second persona, in Table 2.5, is a buyer who needs regular deliveries and spends a large part of the "
      "working day coordinating suppliers."),
] + _table("Table 1.9", "Table 2.5 – Persona 2: the distributor (wholesale buyer)") + [
('p', "The needs of the two personas are complementary: Ion wants to spend less time looking for buyers, and "
      "Natalia less time looking for producers. Both would accept a new tool only if it is faster than a phone call, "
      "which is the main design constraint of the platform."),

('h2', "2.4 Simplified SWOT analysis"),
('p', "The SWOT analysis in Table 2.6 sums up the position of the proposed platform relative to the competitors. "
      "Strengths and weaknesses refer to the platform itself; opportunities and threats describe the environment."),
] + _table("Table 1.5", "Table 2.6 – Simplified SWOT analysis of the proposed platform") + [
('p', "The main risk is not technical but the so-called “cold start”: a marketplace is useful to buyers only "
      "if it already has sellers, and the other way around. For this reason the platform must be useful to a single "
      "producer from the first day, and the objectives in Chapter 3 are set for a pilot group of real users."),

('h1', "3 PURPOSE AND SMART OBJECTIVES"),
('p', "The initial purpose of the project, formulated in the first project proposal, was the digitalisation and "
      "streamlining of wholesale trade between agricultural producers and distributors through a dedicated web "
      "platform for managing offers, real-time stock and direct orders. The research in Chapter 2 confirmed this "
      "direction, but it also showed what matters most to the users: the time lost on calls, the trust between "
      "unknown partners and the risk of selling the same lot twice."),

('h2', "3.1 Refined purpose of the project"),
('p', "Taking these conclusions into account, the purpose was refined so that it answers directly the question "
      "“why is this application useful?”:"),
('quote', "“To let Moldovan farmers and wholesale buyers agree and follow wholesale deals in minutes instead of hours "
          "of phone calls, by keeping offers, real stock, orders and the conversation about them in one place, "
          "between verified participants.”"),
('p', "Compared to the initial version, the refined purpose names the users, states the benefit in terms of time "
      "and adds trust, which the research identified as a condition for working with new partners. It also stays "
      "within the scope of the project: payments, invoicing and transport remain outside it."),

('h2', "3.2 SMART objectives"),
('p', "Following the SMART criteria, each objective is specific, measurable, achievable, relevant and time-bound "
      "[@doran]. Both are measured during a pilot operation of the platform between 1 February and 31 May 2027, "
      "with at least 10 producers and 5 distributors from Moldova. The first objective concerns the saving of time, "
      "the second one the experience of the users."),
('p', "Objective 1 (efficiency): during the pilot operation, the median time between a distributor placing an "
      "order and the seller's decision to accept or reject it is under 4 hours, measured on at least 30 orders. "
      "Table 3.1 shows how the objective meets each SMART criterion."),
('table', "Table 3.1 – SMART analysis of Objective 1",
    ["Criterion", "How the objective meets it"],
    [["Specific", "It concerns one step of the deal, the answer of the seller to an order, which today depends on phone calls"],
     ["Measurable", "The time is calculated from the moments of placing the order and of the decision, which the platform already stores for every order and notification"],
     ["Achievable", "The seller is notified at once in the application and by e-mail, and can accept or reject the order with one action from the phone"],
     ["Relevant", "It answers the key problem of the slow search for a partner and protects perishable produce from waiting"],
     ["Time-bound", "Measured between 1 February and 31 May 2027, on at least 30 orders"]],
    [3.0, 15.0]),
('p', "The value of 4 hours was chosen because a decision taken within the same half of the working day allows the "
      "goods to be delivered the same or the next day, which is essential for fresh vegetables and fruit. The "
      "result will also be compared with the time that the respondents report for arranging a deal by phone."),
('p', "Objective 2 (user experience): during the pilot operation, the platform reaches an average System Usability "
      "Scale (SUS) score of at least 70 among at least 15 pilot users, and at least 80% of the new sellers publish "
      "their first listing in under 3 minutes without help. Table 3.2 shows the SMART analysis."),
('table', "Table 3.2 – SMART analysis of Objective 2",
    ["Criterion", "How the objective meets it"],
    [["Specific", "It concerns the ease of use of the platform for its two primary user groups"],
     ["Measurable", "SUS is a standard ten-question questionnaire with a score from 0 to 100 [@brooke]; the time to publish a listing is measured during the first use"],
     ["Achievable", "Publishing a listing requires one form, the interface is in Romanian and works in the phone browser, without installation"],
     ["Relevant", "Producers will leave the phone for a platform only if it is faster and simpler, as shown by the personas"],
     ["Time-bound", "Measured at the end of the pilot operation, by 31 May 2027"]],
    [3.0, 15.0]),
('p', "A SUS score of 70 is above the average of about 68 reported for a large number of studied systems "
      "[@sauro], so the objective asks for a platform that is better than average, not perfect. Together, the two "
      "objectives check both sides of the value of the platform: that it saves time and that people are willing to "
      "use it."),

('h1', "4 TARGET AUDIENCE AND UNIQUE VALUE PROPOSITION"),
('p', "This chapter defines for whom the application is built and why these people would choose it instead of the "
      "phone, a classified ads website or another platform. Market segmentation divides a market into groups of "
      "customers with similar needs and behaviour, using geographic, demographic, psychographic and behavioural "
      "criteria [@kotler]."),

('h2', "4.1 Target audience segments"),
('p', "Four segments were identified: two primary ones, which generate the transactions, and two secondary ones, "
      "which support the functioning of the platform. They are described in Table 4.1."),
] + _table("Table 1.7", "Table 4.1 – Target audience segments") + [
('p', "The primary segments are very different from each other. Producers are less digital and more sensitive to "
      "costs, while buyers are used to online tools but have little time for anything that does not bring results "
      "quickly. The secondary segments do not trade, but administrators keep the catalogue trustworthy and "
      "partners such as farmer associations can bring many producers at once."),

('h2', "4.2 Key problems addressed by the application"),
('p', "The problems of the current trade process were grouped by their effect on the two primary segments. Three "
      "key problems remain, and they define the core of the platform. They are presented in Table 4.2."),
] + _table("Table 1.10", "Table 4.2 – Key problems solved by the platform") + [
('p', "The three problems are connected. Without trust a buyer does not risk ordering from an unknown producer; "
      "without a shared record even a trusted partner can disappoint; and without fast communication perishable "
      "goods lose value while the parties wait for each other."),

('h2', "4.3 Unique value proposition"),
('p', "A value proposition describes how a product relieves the pains of its customers and creates the gains they "
      "expect [@osterwalder]. The unique value proposition of AgroHub is:"),
UVP,
('p', "Verified participants and public reviews answer the first key problem, the real stock and the order with a "
      "status answer the second, and the conversation attached to each order, with notifications, answers the third. "
      "In a short form, the UVP becomes “Sell your harvest, not your time on the phone” for producers and "
      "“Order from verified farmers, with real stock and no calls” for buyers."),
('p', "Table 4.3 compares the main advantages of the platform with the three groups of alternatives that the target "
      "audience uses today."),
] + _table("Table 1.11", "Table 4.3 – Main competitive advantages compared to the alternatives") + [
('p', "What makes the platform different is the combination of these advantages and its focus on one job: "
      "wholesale trade in fresh produce between Moldovan farmers and the companies that buy from them. This focus "
      "is its main competitive advantage."),

('h1', "5 CONCLUSIONS"),
('p', "The research shows that the proposed application addresses a real need. Wholesale trade in agricultural "
      "products is important for the economy of Moldova, yet it is still organised by phone and in messenger groups, "
      "with time lost, lots promised twice and little trust between unknown partners. The five analysed systems "
      "each cover part of the problem, but none combines a local, free catalogue with real stock, structured orders "
      "and verified participants."),
('p', "The target audience is clearly defined: small and medium producers who sell wholesale and the distributors, "
      "shops and HoReCa businesses that buy from them, supported by administrators and partner organisations. The "
      "refined purpose and the two SMART objectives turn the idea into measurable results, a median answer time under "
      "4 hours and a SUS score of at least 70, both to be verified in the pilot operation by 31 May 2027. The unique "
      "value proposition explains why users would choose the platform: it lets them sell and buy produce faster than "
      "by phone, with a real stock and partners they can trust."),
]
