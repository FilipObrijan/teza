# -*- coding: utf-8 -*-
# Content of the report. Each block: ('h1',text) ('h2',text) ('p',text) ('list',[items])
# ('table',caption,header,rows,widths_cm) ('fig',path,caption,width_cm) ('ph',text) placeholder (highlighted)
# ('pc', text) paragraph with no first-line indent

TITLE = "B2B Web Platform for Wholesale Order Management and Optimisation of Agricultural Product Distribution Flows"

ABBREVIATIONS = [
    ("AS-IS", "Current state of a business process, before the introduction of the new system"),
    ("B2B", "Business-to-Business, trade relations between companies"),
    ("EU", "European Union"),
    ("FAO", "Food and Agriculture Organization of the United Nations"),
    ("GDP", "Gross Domestic Product"),
    ("HoReCa", "Hotels, Restaurants and Cafés, the food service sector"),
    ("MVP", "Minimum Viable Product"),
    ("NBS", "National Bureau of Statistics of the Republic of Moldova"),
    ("SaaS", "Software as a Service"),
    ("SWOT", "Strengths, Weaknesses, Opportunities, Threats"),
    ("UVP", "Unique Value Proposition"),
    ("TO-BE", "Target state of a business process, after the introduction of the new system"),
]

CH1 = [
('h1', "1 ANALYSIS OF THE FIELD OF STUDY"),
('p', "Wholesale trade in agricultural products is one of the areas in the Republic of Moldova where the "
      "importance of a sector and the tools used to run it are clearly out of balance. Every season farms harvest "
      "and sell large volumes of vegetables, fruit and grain, but many of the deals between producers and the "
      "companies that buy from them are still arranged by phone, in messenger groups or directly at wholesale "
      "markets. The present chapter examines how this trade works at the moment and why it is a suitable case for "
      "a dedicated web platform, which is the aim of the project."),
('p', "Several methods were combined for the analysis. Statistical publications and international reports were "
      "used to describe the weight of the sector and the structure of its participants. The current sales process "
      "was reconstructed from the way producers and buyers actually look for each other and close deals. Five "
      "existing systems, international and local, were compared against the same set of criteria, and the "
      "position of the proposed platform was summarised in a SWOT analysis. Finally, a short questionnaire and a "
      "few interviews with potential users were planned in order to check the assumptions against real opinions."),
('p', "The chapter is organised as follows. Subchapter 1.1 describes the field, the participants and the current "
      "(AS-IS) process. Subchapter 1.2 formulates the problems together with their causes and consequences. "
      "Subchapter 1.3 reviews similar systems available on the market and ends with the SWOT analysis of the "
      "proposed idea. Subchapter 1.4 presents the plan of the preliminary user research and the working hypotheses "
      "about the needs of the users. Subchapter 1.5 defines the target audience segments, the key problems solved by "
      "the platform and its unique value proposition. The technical specification and the functional and "
      "non-functional requirements that follow from these findings are formulated in subchapter 1.6."),

('h2', "1.1 Analysis of the field of study"),
('p', "Agriculture has always held a special place in the Moldovan economy, even though its direct share has "
      "been shrinking for years. Together with the food processing industry, the agri-food sector represents more "
      "than 18 percent of the gross domestic product and roughly 45 percent of the country's exports [@trade]. "
      "Agriculture taken alone accounted for about 7.1 percent of GDP in 2024 [@bne]. The same year showed how "
      "exposed the sector is to weather: the gross agricultural production reached only 85.4 percent of the "
      "2023 level in comparable prices, with crop production falling by 22.9 percent [@nbs2024]. In a weak year every "
      "tonne that can be sold quickly and at a fair price matters more, which already says something about the "
      "need for faster sales channels."),
('p', "The sector is dominated by small and medium producers. The last general agricultural census counted "
      "902,214 agricultural holdings in the country [@census], most of them very small, and according to FAO, "
      "smallholders and family farms generate more than 62 percent of the total agricultural output [@fao_small]. "
      "Such producers rarely have a sales department or a contract with a large retail chain. They sell what they "
      "grow through personal contacts, intermediaries and wholesale markets, and the quality of these contacts "
      "often decides how much of the harvest is sold and at what price."),
('p', "On the other side of the deal are the wholesale buyers. These include distribution companies that supply "
      "shops and restaurants, small store chains, HoReCa businesses, processing plants and exporters. Their needs "
      "are quite different from those of a retail customer: they buy hundreds of kilograms or several tonnes at "
      "once, they need a predictable supply over the whole season and they care about the reliability of the "
      "supplier as much as about the price. Between the two sides there is usually a layer of intermediaries, "
      "such as resellers at wholesale markets or local collectors, who buy from farmers and resell with a margin."),
('p', "The current sales process (AS-IS) can be described in a few steps. First, the producer estimates how "
      "much of a product is available, usually from memory or from notes kept in a notebook. Next, the producer "
      "looks for buyers: calls known contacts, posts an announcement on a classified ads website or in Viber and "
      "Facebook groups, or takes the produce to a wholesale market. Interested buyers call back, and the price, "
      "quantity and delivery date are negotiated by phone. The agreement is almost always oral. Delivery is "
      "arranged separately, often with the producer's own transport, and payment is made in cash or by bank "
      "transfer after delivery. As shown in Figure 1.1, the same producer may sell through several channels "
      "in parallel, and none of these channels keeps a common record of what was offered, ordered and delivered."),
('fig', __import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)), "fig1_1.png"), "Figure 1.1 – Current (AS-IS) process of selling agricultural products wholesale", 16.5),
('p', "Figure 1.1 shows three typical routes from the producer to the wholesale buyer. The upper route goes "
      "through an intermediary who buys part of the harvest on the spot and resells it with a markup. The lower "
      "route relies on search channels such as phone calls, messenger groups and classified ads, after which the "
      "deal is agreed by phone. The dashed arrow represents a direct agreement with a buyer the producer already "
      "knows. The frame at the bottom lists the information that, in all three cases, is not stored in any single "
      "place and therefore cannot be checked later."),
('p', "The participants of the process can be reduced to three roles, which will also become the roles of the "
      "proposed system. The seller is the producer or the company that owns the goods and publishes offers. "
      "The distributor is the wholesale buyer who searches for products, places orders and receives the goods. "
      "The administrator is a platform role that does not exist in the current process at all: someone who "
      "verifies new accounts and listings and intervenes when a conflict appears. In the AS-IS situation this "
      "\"trust\" function is replaced by personal acquaintance, which works well only within a small circle of "
      "known partners."),
('p', "The tools used today by both sides are simple and widely available, but none of them was built for "
      "wholesale trade. Table 1.1 summarises them, together with the purpose they serve and their main "
      "limitation in this context."),
('table', "Table 1.1 – Tools currently used in wholesale trade of agricultural products",
    ["Tool", "What it is used for", "Main limitation"],
    [["Phone calls", "Searching for buyers, negotiating price and quantity, confirming delivery", "No written record, agreements are easy to forget or dispute"],
     ["Viber, Telegram and Facebook groups", "Announcing available products and current prices", "Offers get lost in the message flow, no stock, no order status"],
     ["Classified ads websites (999.md)", "Publishing offers for a wide audience [@simpals]", "Built for one-off sales, not for repeated wholesale orders"],
     ["Notebook or Excel file", "Keeping track of stock, buyers and debts", "Not shared with the other party, updated manually and late"],
     ["Wholesale market", "Selling produce directly, mostly to resellers", "Requires transport and time, prices are pushed down by intermediaries"]],
    [4.0, 6.5, 6.5]),
('p', "A separate aspect specific to the field is perishability. FAO estimates that around 13 percent of the "
      "food produced worldwide is lost between harvest and retail, and fruit and vegetables have the highest "
      "loss rates among all commodity groups [@fao_loss]. For a producer of tomatoes or peppers, a delay of a few days "
      "in finding a buyer means real losses, not just a lower price. For this reason the speed of finding a "
      "buyer and confirming an order is a key factor in this field, more than in most other types of B2B trade."),

('h2', "1.2 Identification and formulation of the problem"),
('p', "Looking at the current process from Figure 1.1, the difficulties do not come from a lack of buyers or "
      "products. They come from the way information moves between the participants: it is scattered across "
      "phone calls, chats and paper notes, it is updated late and it is not visible to both sides at the same "
      "time. The problems identified below were grouped so that each of them can later be traced to a "
      "concrete function of the system."),
('p', "The first and most visible problem is the time spent on finding a partner. A producer who has two tonnes "
      "of cabbage ready for sale calls the usual buyers, then posts an announcement and waits. A buyer who needs "
      "a certain quantity of a product often has to call several farmers before completing one order. Both sides "
      "lose hours on work that does not add value, and during the harvest peak these hours are the most expensive "
      "ones."),
('p', "The second problem concerns stock. Because available quantities are not recorded in a shared place, it "
      "happens that the same lot is promised to two buyers, or that a buyer arrives for goods that were already "
      "sold. The third problem is the oral nature of the agreements. The price, the quantity and the delivery "
      "date exist only in the memory of the two parties, so disputes are hard to settle and there is no history "
      "that could be used for planning the next season."),
('p', "Trust is another important issue. A buyer has no easy way to check whether an unknown producer is reliable, "
      "and a producer cannot check whether a new buyer pays on time. As a result, both sides prefer to work with "
      "a small circle of known partners, and new producers have difficulty entering the market without "
      "intermediaries. Table 1.2 presents the problems in a structured form, indicating for each of them the "
      "cause, the consequence and the solution proposed in the system."),
('table', "Table 1.2 – Problems identified in the current process and solutions proposed in the system",
    ["Problem", "Cause", "Consequence", "Solution proposed in the system"],
    [["Long search for buyers and sellers", "No channel dedicated to wholesale agricultural trade", "Hours lost on calls, part of the harvest sold late or below price", "Catalogue of wholesale listings with search and filters by product, region and quantity"],
     ["Stock information is out of date", "Quantities are kept in memory or in a notebook", "The same lot is promised twice, orders are cancelled", "Stock is reduced automatically when an order is confirmed, every change is logged"],
     ["Orders are agreed orally", "Negotiation happens only by phone", "Disputes about price and quantity, no traceability", "Structured order with clear statuses: pending, confirmed, rejected, completed, cancelled"],
     ["Communication is scattered", "Calls, Viber and Facebook are used in parallel", "Details of an agreement are lost or hard to find", "Messages attached to each order, kept together with its history"],
     ["Lack of trust between unknown parties", "No verification, reputation known only by word of mouth", "Buyers stick to a few suppliers, new producers rely on intermediaries", "Verification of accounts and listings, reviews left after a completed order"],
     ["Slow reaction to new orders", "Each side has to check the phone or the market manually", "Perishable products lose quality while waiting", "Automatic e-mail and in-app notifications for orders and messages"],
     ["No data for planning", "Deals are not recorded anywhere", "Producers cannot see which products and buyers bring results", "Personal dashboard with order history and basic statistics"]],
    [3.4, 3.6, 4.2, 5.8]),
('p', "An information system is a natural answer to these problems, because all of them have the same root: "
      "the lack of a single, shared record of offers, orders and communication. Once a listing, its stock and the "
      "orders placed on it live in one database, many of the difficulties disappear by themselves, without "
      "changing the commercial logic of the trade. This is also in line with the general shift of B2B buyers "
      "towards digital channels. A McKinsey survey shows that about a third of B2B customers prefer digital "
      "self-service at each stage of the purchase, and that e-commerce has become the top revenue channel for "
      "companies that offer it [@mckinsey]."),
('p', "It is equally important to state what remains outside the scope of the system. The platform does not "
      "process payments, does not issue fiscal documents and does not manage a fleet of vehicles. Physical "
      "transport is still organised by the parties. The optimisation of distribution flows addressed in this "
      "project concerns the information flow: shortening the chain between producer and buyer, keeping stock "
      "synchronised with orders and making the status of each order visible to both sides. Online payments, "
      "integration with electronic invoicing and route planning are considered possible directions for future "
      "development."),

('h2', "1.3 Analysis of existing solutions"),
('p', "To position the proposed platform, five existing systems were selected. Three of them are international "
      "platforms that digitalise the trade in food or agricultural products, and two are local Moldovan "
      "platforms that potential users already know. The selection deliberately includes both direct competitors, "
      "which handle B2B trade in food, and indirect ones, which users currently turn to for lack of a better "
      "option. Messenger groups and phone calls also compete with any new platform, but they were already "
      "described in subchapter 1.1."),
('p', "Tridge is a B2B platform for international sourcing of agricultural and food products, founded in 2015 in "
      "Seoul, South Korea. It connects importers and exporters, offers market data such as prices and trade "
      "volumes, and provides support for quality checks and logistics. In 2022 the company was valued at about "
      "2.7 billion US dollars [@tridge]. Its strength is the global reach and the market intelligence it offers. For "
      "the problem studied here, however, Tridge is too large in scale: it targets container-sized export deals, "
      "while a Moldovan farmer usually needs to sell a few tonnes to a buyer in the same region."),
('p', "Choco is an ordering platform founded in 2018 in Berlin that connects restaurants with their food "
      "suppliers [@choco]. Restaurants use it for free to send orders to all their suppliers from one application, "
      "and suppliers receive the orders in a structured form instead of calls and voice messages. The idea of "
      "replacing phone orders with a single order flow is very close to the one of this project. The main "
      "difference is that Choco digitalises relationships that already exist; it is not a place where a "
      "restaurant discovers new producers. It is also not available in Moldova."),
('p', "GrubMarket, founded in 2014 in San Francisco, combines a B2B e-commerce marketplace for food with "
      "WholesaleWare, a software suite for wholesalers and distributors that covers inventory, online ordering "
      "and logistics [@grubmarket]. It shows how valuable real-time stock and order management are in food distribution. "
      "At the same time, GrubMarket acts largely as a distributor itself, buying and reselling produce, and its "
      "software is designed for medium and large companies in the United States, at a price and complexity level "
      "that does not suit small producers."),
('p', "Agromag.md is the closest local example. It was launched in 2022 by Agrobiznes as a B2B marketplace for "
      "the agricultural sector of the Republic of Moldova and gathers more than a hundred agro-industrial "
      "companies that sell seeds, fertilisers, plant protection products and equipment [@agromag]. The platform has "
      "a Romanian interface and verified suppliers, which builds trust. However, the flow of goods goes in the "
      "opposite direction to the one studied here: Agromag sells inputs to farmers and does not help farmers "
      "sell their harvest."),
('p', "999.md, owned by the Simpals group, is the largest classified ads website in Moldova and has a separate "
      "section for agricultural products [@simpals]. Its advantages are an enormous audience, free basic ads and the fact "
      "that practically every farmer already knows how to use it. Its limits are also clear: an announcement has "
      "no stock, there is no order, the communication continues by phone and there is no verification of sellers "
      "for this kind of trade. 999.md is therefore an indirect competitor and, at the same time, the main habit "
      "that the new platform has to overcome. Table 1.3 summarises the general information on the five systems."),
('table', "Table 1.3 – General information on the analysed systems",
    ["System", "Producer, country, year", "Business model", "Main functions"],
    [["Tridge", "Tridge Co., South Korea, 2015", "Service fees for sourcing and fulfilment, paid data subscriptions", "International sourcing of agri-food products, market prices and trade data"],
     ["Choco", "Choco, Germany, 2018", "Free for restaurants, paid tools for suppliers", "Ordering from suppliers, order history, order processing for distributors"],
     ["GrubMarket", "GrubMarket Inc., USA, 2014", "Margin on distributed products, SaaS licences (WholesaleWare)", "B2B food marketplace, inventory and order management, logistics"],
     ["Agromag.md", "Agrobiznes, Moldova, 2022", "Commission or fees paid by supplier companies", "Marketplace of agricultural inputs and equipment from verified suppliers"],
     ["999.md", "Simpals, Moldova, 1999", "Free basic ads, paid promotion of ads", "General classified ads, including agricultural products"]],
    [2.6, 3.8, 4.8, 5.8]),
('p', "Table 1.3 shows that the five systems earn money in very different ways. The international platforms rely "
      "on service fees, software licences or a margin on the goods, which makes sense for large companies but is a "
      "barrier for a farmer who sells a few lots per season. Only 999.md can be used free of charge, and it is also "
      "the least specialised of the five."),
('p', "To compare the systems in a way that is relevant for the problem from subchapter 1.2, a set of criteria was "
      "derived from the problems listed in Table 1.2. The evaluation is qualitative and is based on the publicly "
      "available description of each product. As can be seen in Table 1.4, each system covers part of the needs, "
      "but none of them covers the combination required by small and medium producers in Moldova. The mark "
      "\"N/A\" means that the criterion does not apply to the business model of the system."),
('table', "Table 1.4 – Comparative analysis of existing systems and the proposed platform",
    ["Criterion", "Tridge", "Choco", "GrubMarket", "Agromag.md", "999.md", "Proposed platform"],
    [["Sells farm produce", "Yes", "Partial", "Yes", "No", "Partial", "Yes"],
     ["Local wholesale volumes", "No", "Yes", "Yes", "Partial", "Partial", "Yes"],
     ["Available in Moldova", "No", "No", "No", "Yes", "Yes", "Yes"],
     ["Orders with statuses", "Yes", "Yes", "Yes", "Yes", "No", "Yes"],
     ["Stock linked to orders", "No", "Partial", "Yes", "Partial", "No", "Yes"],
     ["Chat attached to order", "Yes", "Partial", "Partial", "No", "No", "Yes"],
     ["Verified participants", "Yes", "N/A", "Yes", "Yes", "No", "Yes"],
     ["Free for small producers", "No", "No", "No", "No", "Yes", "Yes"]],
    [3.8, 1.7, 1.7, 2.6, 2.6, 1.7, 2.6]),
('p', "The comparison outlines the niche of the project quite clearly. The international platforms solve the "
      "problem of structured B2B ordering, but they are built for other markets and for larger companies. "
      "The local platforms are familiar and accessible, but one of them sells inputs to farmers and the other "
      "was never designed for repeated wholesale orders. The proposed platform aims to combine the strong sides "
      "of both groups: a local, free and simple catalogue of farm produce, where each listing has a real stock, "
      "each deal becomes an order with a status and each order keeps its own conversation."),
('p', "The SWOT analysis in Table 1.5 sums up the position of the proposed platform relative to these "
      "competitors. Strengths and weaknesses refer to the platform itself, while opportunities and threats "
      "describe the external environment. Some strengths, such as the automatic check of listings, are already "
      "present in the prototype developed in parallel with this analysis."),
('table', "Table 1.5 – SWOT analysis of the proposed platform relative to the competition",
    ["Strengths", "Weaknesses"],
    [["- focus on wholesale trade in farm produce for the local market;\n- interface in Romanian, works in the browser of any phone;\n- stock is linked to orders and updated automatically;\n- each order has its own status and conversation;\n- verification of accounts and an automatic check of new listings;\n- no fees for producers at the launch stage.",
      "- no users at launch, so the platform is not useful until both sides join;\n- limited development resources, a single developer;\n- no integrated payments, invoicing or transport;\n- web application only, no native mobile application;\n- depends on the digital skills of older farmers."]],
    [8.5, 8.5]),
('table', None,
    ["Opportunities", "Threats"],
    [["- the EU integration process, which raises the requirements for traceability [@seerural];\n- the growing acceptance of digital channels in B2B trade [@mckinsey];\n- partnerships with farmer associations and cooperatives;\n- future modules for payments, electronic invoices and route planning;\n- extension towards exports and regional markets.",
      "- strong habit of solving everything by phone;\n- 999.md or Agromag.md may add similar B2B functions;\n- strong seasonal and weather-related fluctuations of supply [@nbs2024];\n- risk of fraud or unfair reviews, which can damage trust;\n- unwillingness of some intermediaries to lose their role."]],
    [8.5, 8.5]),
('p', "The analysis shows that the main risk of the project is not technical. The hardest part is the so-called "
      "\"cold start\": a marketplace is useful to buyers only if it already has sellers, and the other way around. "
      "This means that the platform must be useful to a single producer from the first day, for example as a tool "
      "for keeping track of stock and orders, even before the network of buyers grows. This conclusion is taken "
      "into account when formulating the requirements in the following subchapters."),

('h2', "1.4 Preliminary user research and needs analysis"),
('p', "The previous subchapters were based mostly on documents and on the analysis of other products. Before the "
      "requirements are fixed, these conclusions have to be checked against the experience of the people who would "
      "actually use the platform. For this purpose, preliminary feedback is collected from potential users through "
      "two instruments: a short online questionnaire and semi-structured interviews of 15–20 minutes. The questions, "
      "given in Appendix B, focus on how the respondents sell or buy today, what takes them the most time and what "
      "they would expect from an online platform."),
('p', "Three respondent profiles were selected, matching the types of users identified in subchapter 1.1: a vegetable "
      "producer, a distributor and a buyer from the HoReCa or retail segment. At the time of writing, the interviews "
      "with these respondents are scheduled but have not yet taken place. For this reason, the expected answers of "
      "each profile were formulated in advance as working hypotheses, derived from the field analysis and from the "
      "problems listed in Table 1.2. Table 1.6 presents these hypotheses. They are not interview results and will be "
      "confirmed, corrected or replaced by the real answers."),
('table', "Table 1.6 – Working hypotheses about the needs of each respondent profile",
    ["Respondent profile", "Expected current practice", "Expected main difficulties", "Expected needs from the platform"],
    [["R1, vegetable producer (10–30 ha)", "Sells most of the harvest by phone to a few regular buyers, the rest through resellers or ads on 999.md", "Too much time spent on calls in the harvest peak, last-minute cancellations, pressure on price from resellers", "Publishing an offer from the phone in a few minutes, seeing all orders in one place, notifications"],
     ["R2, distributor", "Orders weekly from 10–15 producers by phone and Viber, keeps the orders in an Excel file", "Does not know the real availability before calling, has to call several producers to complete one order", "Search by product and region, real stock on each listing, order history, reviews of suppliers"],
     ["R3, HoReCa or retail buyer", "Buys from one or two distributors and sometimes directly from farmers at the market", "Unstable quality and availability of fresh produce, few alternatives when a supplier fails", "Quick access to alternative suppliers, simple ordering, information about the producer"]],
    [3.4, 4.6, 4.5, 4.5]),
('p', "To make the validation concrete, the hypotheses were reduced to five statements that can be checked during "
      "the interviews. A statement is considered confirmed if at least two of the three respondents support it:"),
('list', ["H1 – most wholesale deals of the respondents are arranged by phone or in messengers;",
          "H2 – the respondents have faced at least once per season a cancelled order or a lot promised to two buyers;",
          "H3 – the lack of trust is the main reason for not working with new partners;",
          "H4 – the respondents would publish offers or order online if the operation takes only a few minutes from a phone;",
          "H5 – buyers value up-to-date stock information at least as much as a lower price."]),
('p', "The hypotheses that are not confirmed will lead to changes in the requirements formulated in subchapter 1.6, "
      "and any new need mentioned by the respondents will be added to the list of problems from Table 1.2. "
      "The same respondents are also planned to take part later in the testing of the prototype, so that the "
      "platform is evaluated by the people whose needs it is meant to solve."),

('h2', "1.5 Target audience and unique value proposition"),
('p', "The previous subchapters described the field, its problems and the solutions already on the market. This "
      "subchapter answers two practical questions: for whom exactly the platform is built, and why these people would "
      "choose it instead of the phone, a classified ads website or another platform. The audience is first divided into "
      "segments, then the problems from subchapter 1.2 are narrowed down to three key problems, and finally the unique "
      "value proposition (UVP) of the platform is formulated together with its main competitive advantages."),
('p', "Market segmentation means dividing a market into groups of customers with similar needs and behaviour, using "
      "geographic, demographic, psychographic and behavioural criteria [@kotler]. In B2B trade the customer is a "
      "company, but the decisions are still taken by concrete people, such as the owner of a farm or the person "
      "responsible for procurement, so their age, habits and attitudes matter as well. Four segments were identified: "
      "two primary ones, which generate the transactions, and two secondary ones, which support the functioning of "
      "the platform. They are described in Table 1.7."),
('table', "Table 1.7 – Target audience segments of the platform",
    ["Segment", "Type", "Who they are", "Demographic characteristics", "Psychographic characteristics"],
    [["S1. Agricultural producers (sellers)", "Primary", "Small and medium farms, peasant farms and agricultural enterprises that sell vegetables, fruit or grain wholesale", "Mostly 35–60 years old, rural areas, owners or family members who run the farm; lots from a few hundred kilograms to tens of tonnes", "Pragmatic, short of time in the harvest season, rely on personal relationships, cautious about fees and new tools, prefer the phone to the computer"],
     ["S2. Wholesale buyers (distributors)", "Primary", "Distribution companies, small retail chains, HoReCa businesses and processors that buy regularly", "Mostly 25–45 years old, procurement managers or owners in Chișinău, Bălți and district centres; buy weekly or more often", "Oriented to efficiency, used to online services, value reliability and predictability more than the lowest price, need a documented history"],
     ["S3. Platform administrators", "Secondary", "Platform staff who verify accounts and listings and handle disputes", "One to three people at launch, good digital skills", "Responsible for the trust in the platform, need fast moderation tools and clear rules"],
     ["S4. Partners", "Secondary", "Farmer associations and cooperatives, transport companies, agricultural consultants", "Organisations that already have networks of producers or clients", "Interested in the digitalisation of their members, can bring the first users and future integrations"]],
    [2.9, 2.2, 4.0, 3.9, 4.0]),
('p', "The two primary segments are the ones the platform is designed around, since without them no order is ever "
      "placed. They are also very different from each other: the producers are less digital and more sensitive to "
      "costs, while the buyers are used to online tools but have little time for anything that does not bring "
      "results quickly. The interface and the onboarding have to work for the first group without slowing down "
      "the second."),
('p', "To make the primary segments more concrete, each of them is represented by a persona. A persona is a "
      "fictional but realistic profile that brings together the typical goals, habits and frustrations of a group of "
      "users [@cooper]. Personas help to keep the design focused on concrete people instead of an abstract "
      "\"user\". They were built from the field analysis and from the working hypotheses in subchapter 1.4, and will "
      "be adjusted after the interviews. The first persona, Ion, represents segment S1 and is shown in Table 1.8."),
('table', "Table 1.8 – Persona 1: the seller (agricultural producer)",
    ["Attribute", "Description"],
    [["Name, age", "Ion Rusu, 48 years old"],
     ["Occupation", "Owner of a 25 ha vegetable farm in Criuleni district (tomatoes, peppers, cabbage, onions)"],
     ["Sales today", "About 70% of the harvest is sold wholesale: to two regular buyers, to resellers at the wholesale market and through ads on 999.md"],
     ["Digital skills", "Uses a smartphone every day (Viber, Facebook, 999.md), uses a computer rarely"],
     ["Goals", "Sell the harvest quickly during the peak season, get a fair price, keep regular buyers from year to year"],
     ["Frustrations", "Spends hours on calls, buyers cancel at the last moment, intermediaries push prices down, has to remember who promised what"],
     ["What would help", "Publishing an offer from the phone in a few minutes, seeing all orders in one place, being notified when someone orders"]],
    [3.5, 13.5]),
('p', "Ion is not against technology, but he will not spend an evening learning a new system during the harvest. "
      "For him a platform is useful only if it saves time from the very first offer he publishes."),
('p', "The second persona, presented in Table 1.9, represents segment S2 and describes the other side of the "
      "transaction: a buyer who needs regular deliveries and spends a large part of the working day coordinating "
      "suppliers."),
('table', "Table 1.9 – Persona 2: the distributor (wholesale buyer)",
    ["Attribute", "Description"],
    [["Name, age", "Natalia Ceban, 35 years old"],
     ["Occupation", "Procurement manager at a regional distribution company that supplies about 40 shops and restaurants in Chișinău"],
     ["Purchases today", "Buys fresh vegetables and fruit weekly from 10–15 producers, mostly by phone, and keeps orders in an Excel file"],
     ["Digital skills", "Works on a laptop and a smartphone all day, is used to online services and e-mail"],
     ["Goals", "Stable supply of the needed quantity and quality, predictable prices, fewer phone calls"],
     ["Frustrations", "Does not know what is actually available until calling, has to call several farmers to complete one order, has no history to compare suppliers"],
     ["What would help", "Search by product and region, real stock on every listing, order history and reviews of suppliers"]],
    [3.5, 13.5]),
('p', "Comparing the two personas, their needs turn out to be complementary. Ion wants to spend less time looking "
      "for buyers, and Natalia wants to spend less time looking for producers. Both suffer from the lack of a shared "
      "record of stock and agreements, and both would accept a new tool only if it is faster than a phone call. "
      "This last point is probably the most important design constraint: every frequent operation, such as "
      "publishing a listing or confirming an order, has to take only a few steps and has to work comfortably on "
      "a phone screen."),
('p', "The secondary segments do not trade on the platform, but the platform cannot work without them. The "
      "administrators are the ones who turn verification from a promise into a routine: they approve new accounts, "
      "check listings and step in when an order turns into a dispute. The partners matter mostly at the start. A farmer "
      "association or a cooperative can bring dozens of producers at once, which solves part of the \"cold start\" "
      "problem described in subchapter 1.3, while transport companies and consultants are natural candidates for "
      "future integrations."),
('p', "The problems listed in Table 1.2 are numerous, but they do not have the same weight for the target audience. "
      "When they are grouped by their effect on the two primary segments, three key problems remain, and these define "
      "the core of the platform. They are presented in Table 1.10."),
('table', "Table 1.10 – Key problems solved by the platform for the target audience",
    ["Key problem", "Affected segments", "How it shows today", "How the platform solves it"],
    [["KP1. Finding a reliable partner takes too long", "S1, S2", "Hours of calls and waiting for answers to ads; deals limited to a small circle of known partners", "Catalogue of listings with search by product and region, verified accounts and public reviews after completed orders"],
     ["KP2. Stock and agreements are not recorded in one place", "S1, S2", "Lots promised twice, oral agreements, disputes about quantity and price", "Each listing shows the real stock, which decreases when an order is confirmed; each order keeps its price, quantity and status"],
     ["KP3. Communication around an order is slow and scattered", "S1, S2, S3", "Details lost between calls, Viber and Facebook; perishable produce waits for an answer", "Messages attached to each order, e-mail and in-app notifications, a personal dashboard with all orders"]],
    [3.8, 2.0, 5.2, 6.0]),
('p', "The three key problems are connected to each other. Without trust (KP1) a buyer does not risk ordering from an "
      "unknown producer; without a shared record (KP2) even a trusted partner can disappoint; and without fast "
      "communication (KP3) perishable goods lose value while the two parties wait for each other. Most of the "
      "alternatives from subchapter 1.3 solve one or two of these problems, which is why users keep returning to the "
      "phone for the rest of the deal."),
('p', "A value proposition describes how a product relieves the pains of its customers and creates the gains they "
      "expect [@osterwalder]. A unique value proposition goes one step further and states, in one or two sentences, "
      "why the product is a better choice than the alternatives the customer already has. For the proposed platform "
      "these alternatives are the phone and the messengers, the classified ads on 999.md and the specialised "
      "platforms analysed in subchapter 1.3. Taking them into account, the UVP of the platform is formulated as "
      "follows:"),
('quote', "\u201cA free, Romanian-language B2B marketplace where Moldovan farmers and wholesale buyers trade agricultural "
          "produce directly: every listing shows the stock that is really available, every deal becomes an order with "
          "a clear status and its own conversation, and every participant is verified, so a harvest can be sold with a "
          "few taps on a phone instead of a day of phone calls.\u201d"),
('p', "Each part of the statement answers one of the key problems. Verified participants and public reviews answer "
      "KP1, the real stock and the order with a status answer KP2, and the conversation attached to each order, "
      "together with notifications, answers KP3. The words \"free\" and \"Romanian-language\" are addressed mainly "
      "to segment S1, for whom cost and language are the first barriers. For the landing page and for promotion, "
      "the UVP was also reduced to two short messages, one for each primary segment: \"Sell your harvest, not your "
      "time on the phone\" for producers and \"Order from verified farmers, with real stock and no calls\" for buyers."),
('p', "Formulating a UVP is useful only if it holds up against the alternatives. Table 1.11 compares the main "
      "advantages of the platform with the three groups of alternatives that the target audience uses today."),
('table', "Table 1.11 – Main competitive advantages of the platform compared to the alternatives",
    ["Advantage", "Compared to the phone and messengers", "Compared to 999.md", "Compared to specialised platforms"],
    [["Built for wholesale trade in farm produce", "Reach beyond personal contacts", "Each listing has quantity, price per kilogram, region, harvest date and delivery terms instead of free text", "Local scale and lots of a few tonnes, not export containers or farm inputs"],
     ["Real stock linked to orders", "Nothing has to be remembered, the stock updates itself", "An ad does not show what is left", "Found elsewhere mostly in paid enterprise software"],
     ["Order with a status and its own conversation", "Agreements are written, not oral", "The deal continues on the platform, not by phone", "Similar functions, but free and in Romanian"],
     ["Verification and reviews", "Trust beyond the circle of acquaintances", "Accounts and listings are checked, including an automatic check of every new listing", "Similar level of trust, adapted to small producers"],
     ["No fees, works in the browser of any phone", "No extra costs, nothing to install", "The same accessibility, with more structure", "Not available in Moldova or paid"]],
    [3.6, 4.1, 4.7, 4.6]),
('p', "None of these advantages is impossible to copy on its own. What makes the platform different is their "
      "combination and its focus on one specific job: wholesale trade in fresh produce between Moldovan farmers and "
      "the companies that buy from them. 999.md is too general to do this job well, Agromag.md sells in the opposite "
      "direction, and the international platforms are built for other markets and much larger companies. This focus "
      "is the main competitive advantage, and it also sets the priority for the launch: the UVP addresses producers "
      "first, because they bring the supply, while buyers are attracted by the number of real offers."),
('p', "With the target audience, the key problems and the value proposition defined, the next step is to translate "
      "them into the technical specification and the requirements of the system, which are presented in "
      "subchapter 1.6."),
]

REFS = {
 'trade': 'International Trade Administration, "Moldova – Agriculture," Country Commercial Guide. [Online]. Available: https://www.trade.gov/country-commercial-guides/moldova-agriculture (accessed Oct. 2, 2026).',
 'bne': 'bne IntelliNews, "Moldova\'s GDP close to a standstill in 2024 due to weak agriculture," 2025. [Online]. Available: https://www.intellinews.com/moldova-s-gdp-close-to-a-standstill-in-2024-due-to-weak-agriculture-372139/ (accessed Oct. 2, 2026).',
 'nbs2024': 'National Bureau of Statistics of the Republic of Moldova, "Gross agricultural production in 2024," 2025. [Online]. Available: https://statistica.gov.md/en/gross-agricultural-production-in-2024-9515_61675.html (accessed Oct. 2, 2026).',
 'census': 'National Bureau of Statistics of the Republic of Moldova, 2011 General Agricultural Census in the Republic of Moldova: Main results. Chișinău, Moldova. [Online]. Available: https://statistica.gov.md/public/files/publicatii_electronice/Recensamint_agricol/RGA_principalele_rezultate_eng.pdf (accessed Oct. 2, 2026).',
 'fao_small': 'FAO, Smallholders and family farms in the Republic of Moldova. Country study report 2019. Budapest, Hungary: FAO, 2020, doi: 10.4060/ca9836en.',
 'simpals': 'Simpals, "999.md – classified ads in Moldova." [Online]. Available: https://999.md (accessed Oct. 2, 2026).',
 'fao_loss': 'FAO, "SDG Indicator 12.3.1 – Global food losses," FAO SDG Data Portal. [Online]. Available: https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/1231-global-food-losses/en (accessed Oct. 2, 2026).',
 'mckinsey': 'McKinsey & Company, "Five fundamental truths: How B2B winners keep growing," 2024. [Online]. Available: https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/five-fundamental-truths-how-b2b-winners-keep-growing (accessed Oct. 2, 2026).',
 'tridge': 'TechCrunch, "SoftBank-backed Tridge, a Korean platform that matches food agriculture buyers and sellers, bags $37.2M Series D at a $2.7B valuation," Aug. 24, 2022. [Online]. Available: https://techcrunch.com/2022/08/24/tridge-a-korean-platform-that-matches-food-agriculture-buyers-and-sellers-bags-37-2m-series-d-at-a-2-7b-valuation (accessed Oct. 2, 2026).',
 'choco': 'Choco, "Choco – the ordering platform for restaurants and food suppliers." [Online]. Available: https://choco.com (accessed Oct. 2, 2026).',
 'grubmarket': 'Sacra, "GrubMarket revenue, valuation & funding." [Online]. Available: https://sacra.com/c/grubmarket/ (accessed Oct. 2, 2026).',
 'agromag': 'Agrobiznes, "Agromag la 2 ani de activitate: Peste 100 de companii agroindustriale prezente pe platformă." [Online]. Available: https://agrobiznes.md/agromag-la-2-ani-de-activitate-peste-100-de-companii-agroindustriale-prezente-pe-platforma.html (accessed Oct. 2, 2026).',
 'seerural': 'SEERural, "State of Art of Agriculture in Moldova in the process of EU integration," 2025. [Online]. Available: https://seerural.org/wp-content/uploads/2025/01/State-of-Art-of-Agriculture-in-Moldova-in-the-process-of-EU-integration.pdf (accessed Oct. 2, 2026).',
 'cooper': 'A. Cooper, The Inmates Are Running the Asylum. Indianapolis, IN, USA: Sams Publishing, 1999.',
 'kotler': 'P. Kotler and K. L. Keller, Marketing Management, 15th ed. Harlow, England: Pearson Education, 2016.',
 'osterwalder': 'A. Osterwalder, Y. Pigneur, G. Bernarda, and A. Smith, Value Proposition Design: How to Create Products and Services Customers Want. Hoboken, NJ, USA: Wiley, 2014.',
}

PROPOSAL = [
 ("Topic:", ["B2B web platform for wholesale order management and optimisation of agricultural product distribution flows."]),
 ("Aim:", ["Digitalisation and streamlining of wholesale trade between agricultural producers and distributors through a dedicated web platform for managing offers, real-time stock and direct orders."]),
 ("Objectives:", [
   "to analyse the field of application and identify the current problems in the wholesale distribution chain of agricultural products;",
   "to research and evaluate the existing information systems and similar solutions on the market;",
   "to establish the functional and non-functional requirements of the system (including role management: Seller, Distributor, Administrator);",
   "to design the application architecture (React, Node.js/TypeScript, PostgreSQL technology stack), the database and the user interface;",
   "to develop the web platform, integrating the order placement flow, dynamic stock updates, the messaging module and automatic notifications;",
   "to test the components, validate the functionalities and estimate the implementation costs;",
   "to write the explanatory report of the bachelor's project.",
 ]),
]

QUESTIONNAIRE_INTRO = ("The questionnaire was distributed online to producers and wholesale buyers. The interviews followed "
                       "the same questions, with additional clarifications where the answers were interesting.")
Q_PRODUCERS = [
 "What do you produce, and approximately what quantities do you sell per season?",
 "What share of your production do you sell wholesale, and to whom (regular buyers, resellers, wholesale market, processors)?",
 "How do you usually find buyers (phone, Viber or Facebook groups, 999.md, wholesale market, other)?",
 "How much time per week do you spend looking for buyers and negotiating during the harvest season?",
 "Has it happened that a buyer cancelled an order or that the same lot was promised to two buyers? How often?",
 "How do you keep track of the available stock and of the orders (memory, notebook, Excel, software)?",
 "Would you publish your offers on a dedicated online platform? What would convince you, and what would stop you?",
]
Q_BUYERS = [
 "What products do you buy, how often and in what quantities?",
 "How many producers do you work with regularly, and how do you find new ones?",
 "How do you place and confirm orders today, and where do you keep their history?",
 "What is the most frequent problem with suppliers (availability, quality, delays, prices, communication)?",
 "How do you check whether a new producer is reliable?",
 "Which information would you like to see on a product listing before ordering?",
 "Would you use an online platform to order from producers? Which functions are a must for you?",
]
