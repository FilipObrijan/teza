# -*- coding: utf-8 -*-
# Use case analysis "Place a wholesale order" (user story, use case, tests, reflection). Separate 2-4 page deliverable.

REFS = {
    'cockburn': 'A. Cockburn, Writing Effective Use Cases. Boston, MA, USA: Addison-Wesley, 2001.',
}

W2 = [4.2, 13.8]

BLOCKS = [
('h1', "USE CASE ANALYSIS: PLACE A WHOLESALE ORDER"),
('p', "The analysed functionality belongs to AgroHub, a B2B web platform through which agricultural producers in "
      "Moldova sell their produce wholesale to distributors, shops and HoReCa businesses. Problem situation: a "
      "distributor has to deliver 500 kg of tomatoes to its clients the next morning. Today the procurement manager "
      "calls several farmers, does not know which of them still has goods, and agrees the quantity and price orally. "
      "On the platform, the manager should be able to find an offer with enough stock and send a binding order to the "
      "producer, who then accepts or rejects it."),

('h2', "1 Basic elements"),
('p', "Table 1 identifies the actors, the objective and the value of the functionality. The actor is a role in "
      "relation to the system: the procurement manager of a distribution company and the owner of a small shop who "
      "buys for their own store play the same role, Distributor."),
('table', "Table 1 – Basic elements of the functionality",
    ["Element", "Description"],
    [["Primary actor", "Distributor: an approved account with the distributor role, which initiates the order and obtains its value"],
     ["Secondary actors", "Seller (receives the order and decides on it); e-mail service (delivers the notification to the seller)"],
     ["User objective", "To obtain a firm commitment from a producer for a given quantity of a product, at a known price"],
     ["Value obtained", "The goods are reserved by a written order with a fixed price and a clear status, instead of an oral agreement by phone"],
     ["Business rule", "BR-01: the ordered quantity must be greater than zero and not larger than the stock of an active listing; BR-02: only an approved distributor account may order; BR-03: the price is fixed at the moment of ordering"]],
    W2),
('p', "The database is not an actor: it is part of the system. Its failure is therefore treated as an exception of "
      "the use case, not as the behaviour of an external participant."),

('h2', "2 User story"),
('p', "As a distributor, I want to order a quantity of a product directly from a producer whose offer shows enough "
      "stock, so that I can secure the goods for my clients without calling several farmers. The acceptance criteria "
      "of the story are formulated as observable outcomes:"),
('list', ["AC1 – a visitor who is not signed in, or an account that is not an approved distributor, cannot place an order and receives a clear message;",
          "AC2 – an accepted request is confirmed to the distributor and appears in the order history with the status “pending” and the total amount;",
          "AC3 – an order larger than the available stock is refused, and the message states the quantity that is still available;",
          "AC4 – when no seller offers the product, the catalogue shows no result and no order can be created;",
          "AC5 – the seller receives an in-app notification and an e-mail about the new order."]),

('h2', "3 Use case UC07 – Place a wholesale order"),
('p', "The use case follows the structure recommended by Cockburn: a goal stated from the point of view of the "
      "primary actor, clear boundaries and an explicit treatment of failures [@cockburn]. Table 2 gives its general "
      "description."),
('table', "Table 2 – Specification of the use case UC07",
    ["Field", "Content"],
    [["ID and name", "UC07 – Place a wholesale order"],
     ["Purpose", "The distributor sends a producer a binding order for part or all of the stock of an active listing"],
     ["Primary actor", "Distributor"],
     ["Secondary actors", "Seller, e-mail service"],
     ["Trigger", "The distributor decides to buy a product offered in the catalogue"],
     ["Preconditions", "The distributor is signed in with an approved account; at least one listing of the product is active, with a stock greater than zero"],
     ["Success postconditions", "An order exists with the status “pending”, the ordered quantity, the unit price of the listing and the total; the distributor sees it in the history; the seller has an in-app notification and an e-mail; the stock is not reduced yet (it decreases only when the seller accepts)"],
     ["Business rules", "BR-01, BR-02, BR-03 (Table 1)"],
     ["Non-functional requirements", "NFR-01: 95% of the order requests are answered in under 2 s; NFR-08: the role and status of the account are checked on the server for every request; NFR-03: monthly availability of at least 99%"]],
    W2),
('p', "The normal flow in Table 3 describes the dialogue between the distributor and the system, without referring to "
      "specific screens or controls."),
('table', "Table 3 – Normal flow of UC07",
    ["Step", "Actor", "Action"],
    [["1", "Distributor", "Searches the catalogue by product name and, optionally, by region"],
     ["2", "System", "Shows the active listings that match, with stock, price per kilogram, region and seller rating"],
     ["3", "Distributor", "Selects a listing and asks for its details"],
     ["4", "System", "Shows the details of the listing and the seller, and the maximum quantity that can be ordered"],
     ["5", "Distributor", "Enters the quantity and, optionally, a message for the seller, and submits the order"],
     ["6", "System", "Checks the account (BR-02), locks the listing, checks that it is still active and that the quantity respects BR-01"],
     ["7", "System", "Saves the order with the price of the listing (BR-03) and the status “pending”, and confirms it to the distributor"],
     ["8", "System", "Notifies the seller in the application and by e-mail; the use case ends"]],
    [1.4, 2.8, 13.8]),
('p', "Steps 6 and 7 are executed in one database transaction. Either the order is saved completely, or nothing is "
      "saved, so the distributor never sees a half-created order."),
('p', "Table 4 describes the alternative flow and the exceptions, each with the step at which it starts."),
('table', "Table 4 – Alternative flow and exceptions of UC07",
    ["ID", "Condition (step)", "Handling"],
    [["A1", "The listing has less stock than needed (step 4)", "The distributor orders the available quantity from this listing and repeats the use case for another listing of the same product, from another seller; both orders are saved (successful end)"],
     ["E1", "Not signed in, account pending or blocked, or a seller account (step 6)", "The system refuses the request (401 or 403), saves nothing and explains that an approved distributor account is required"],
     ["E2", "The stock fell or the listing was withdrawn meanwhile (step 6)", "The transaction is cancelled; the system states the quantity still available, or that the offer is no longer available"],
     ["E3", "No seller offers the product (step 2)", "The catalogue shows no result; no order can be created and the use case ends without changes"],
     ["E4", "Database unavailable or connection lost (steps 6–7)", "The transaction is rolled back, nothing is saved, the error is logged; the distributor is told to try again later"],
     ["E5", "E-mail service unavailable (step 8)", "The order stays saved and the in-app notification is created; the failed e-mail is logged and does not affect the distributor"]],
    [1.2, 5.4, 11.4]),
('p', "Exception E5 is deliberately not treated as a failure of the use case: the order is already saved, and the "
      "seller still sees it in the application."),

('h2', "4 Acceptance tests"),
('p', "Table 5 derives conceptual tests from the scenarios above. Tests T1, T2 and T3 are also covered by the "
      "automated API tests of the platform (TC08, TC04 and TC07)."),
('table', "Table 5 – Conceptual acceptance tests for UC07",
    ["Test", "Initial condition", "Action", "Expected result"],
    [["T1. Normal flow", "Approved distributor; active listing with 1,000 kg", "Orders 300 kg", "Order saved as “pending” with total = 300 × price; stock still 1,000 kg; seller notified"],
     ["T2. Unauthorized requester", "Signed in as a seller, or with a blocked account", "Tries to order from a listing", "Request refused (403); no order is created"],
     ["T3. Product unavailable in stock", "Active listing with 1,000 kg", "Orders 1,500 kg", "Request refused (400) with “maximum available is 1,000 kg”; no order"],
     ["T4. Product unavailable commercially", "No active listing for “quince”", "Searches for “quince”", "No result is shown; no order can be submitted"],
     ["T5. Database unavailable", "Database stopped or connection cut during submission", "Submits a valid order", "Error message, request can be repeated; after recovery, no partial order exists"],
     ["T6. E-mail service down", "E-mail service unreachable", "Submits a valid order", "Order saved and in-app notification created; e-mail failure only logged"]],
    [3.4, 4.6, 3.4, 6.6]),
('p', "Each test checks one acceptance criterion: T1 checks AC2 and AC5, T2 checks AC1, T3 checks AC3, T4 checks AC4, "
      "and T5 and T6 check that failures are handled explicitly."),

('h2', "5 Reflection"),
('p', "A user is a concrete person who works with the system, while an actor is a role that a person or another "
      "system plays in relation to it. The same person can play several roles: a farmer who also buys seedlings "
      "would act once as Seller and once as Distributor. Conversely, many different users, from a procurement "
      "manager to a shop owner, play the same Distributor role, so the use case is written once for all of them."),
('p', "A use case is the complete set of ways in which an actor tries to reach one goal, including the paths that "
      "succeed and those that fail. A scenario is one concrete path through it, with specific data: “Natalia "
      "orders 300 kg of tomatoes and the order is saved” is one scenario of UC07, and “she orders 1,500 kg and is "
      "refused” is another. This is why each acceptance test in Table 5 corresponds to one scenario, while the "
      "use case as a whole is covered only by all of them together."),
]
