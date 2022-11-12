# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
```

Local development

```
npx hardhat node
npx hardhat run scripts/deploy.ts
npx hardhat console --network localhost
```

Goerli

# Use cases

Free events with assistance

- Anyone can create an event and specific number of tickets available, price, time and location.
- Anyone can buy a ticket of a specific event _BEFORE_ the time of the event.
- Owner of event is able to approve withdrawal of people that assist to the Event.
- Owner of ticket that is approved is able to withdraw money after the time of the event.

- Owner of ticket can sell it to somebody else. v2.

Read:

- All events happening

UI:

- Create an event site, specific users, users that pay.
- Buy a ticket in a event (See tickets left, See time until the event, See Price of the ticket).
