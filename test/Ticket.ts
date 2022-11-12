import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_GWEI = 1_000_000_000;

describe("Ticket", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTicket() {
    const ONE_HOUR_IN_SECS = 60 * 60;
    const eventTime = (await time.latest()) + ONE_HOUR_IN_SECS;
    const eventPrice = ONE_GWEI;
    const eventMaximumTickets = 10;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Ticket = await ethers.getContractFactory("Ticket");
    const ticket = await Ticket.deploy(
      eventMaximumTickets,
      eventPrice,
      eventTime
    );

    return {
      ticket,
      eventMaximumTickets,
      eventPrice,
      eventTime,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should set the right eventTime", async function () {
      const { ticket, eventTime } = await loadFixture(deployTicket);
      expect(await ticket.eventTime()).to.equal(eventTime);
    });

    it("Should set the right owner", async function () {
      const { ticket, owner } = await loadFixture(deployTicket);
      expect(await ticket.owner()).to.equal(owner.address);
    });

    it("Should set the right price", async function () {
      const { ticket, eventPrice } = await loadFixture(deployTicket);
      expect(await ticket.price()).to.equal(eventPrice);
    });
  });

  describe("Minting", function () {
    it("Should revert if buy a ticket after the event", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Ticket = await ethers.getContractFactory("Ticket");
      const ticket = await Ticket.deploy(10, ONE_GWEI, latestTime);
      await expect(ticket.buyTicket({ value: ONE_GWEI })).to.be.revertedWith(
        "Too late to buy tickets"
      );
    });

    it("Should revert if try to buy a ticket sending wrong amount.", async function () {
      // We don't use the fixture here because we want a different deployment
      const { ticket } = await loadFixture(deployTicket);
      await expect(
        ticket.buyTicket({ value: ONE_GWEI * 2 })
      ).to.be.revertedWith("Value sent doesnt match with price of ticket");
    });

    it("Should revert if try to buy more ticket's than maximum sending wrong amount.", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Ticket = await ethers.getContractFactory("Ticket");
      const ticket = await Ticket.deploy(0, 2 * ONE_GWEI, latestTime);
      await expect(
        ticket.buyTicket({ value: ONE_GWEI * 2 })
      ).to.be.revertedWith("No more tickets available");
    });

    it("Shouldn't revert if try to buy ticket with right config.", async function () {
      // We don't use the fixture here because we want a different deployment
      const { ticket } = await loadFixture(deployTicket);
      await expect(ticket.buyTicket({ value: ONE_GWEI })).to.not.be.reverted;
    });
  });

  describe("Assisting", function () {
    it("Should only allow owner.", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await expect(ticket.connect(otherAccount).assist(1)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should allow only created tokens.", async function () {
      const { ticket } = await loadFixture(deployTicket);
      await expect(ticket.assist(1)).to.be.revertedWith("Token doesnt exist");
    });

    it("Shouln't fail with created tokens.", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI });
      await expect(ticket.assist(0)).to.not.be.reverted;
    });
  });

  describe("Burning", function () {
    it("Should fail with a non assisted ticket", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI });
      await expect(ticket.connect(otherAccount).burn(0)).to.be.revertedWith(
        "Ticket didn't assist"
      );
    });

    it("Should fail with a non assisted ticket", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI });
      await ticket.assist(0);
      await expect(ticket.burn(0)).to.be.revertedWith(
        "Caller is not token owner or approved"
      );
    });

    it("Shouldn't fail with burning a assisted ticket", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI });
      await ticket.assist(0);
      await expect(ticket.connect(otherAccount).burn(0)).to.not.be.reverted;
    });
  });

  describe("Withdrawal", function () {
    it("Should only allow owner.", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await expect(ticket.connect(otherAccount).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should fail before event time", async function () {
      const { ticket } = await loadFixture(deployTicket);
      await expect(ticket.withdraw()).to.be.revertedWith(
        "Too soon to withdraw tickets"
      );
    });

    it("Should fail with a non assisted ticket", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI });
      await ticket.assist(0);
      await expect(ticket.burn(0)).to.be.revertedWith(
        "Caller is not token owner or approved"
      );
    });

    it("Shouldn't fail with burning a assisted ticket", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI });
      await ticket.assist(0);
      await expect(ticket.connect(otherAccount).burn(0)).to.not.be.reverted;
    });
  });

  describe("Events", function () {
    it("Should emit an event on withdrawals", async function () {
      const { ticket, eventTime } = await loadFixture(deployTicket);

      await time.increaseTo(eventTime);

      await expect(ticket.withdraw()).to.emit(ticket, "WithdrawNonAssistants");
    });

    it("Should emit an event on creation of tickets", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await expect(ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI }))
        .to.emit(ticket, "TicketBought")
        .withArgs(otherAccount, 0); // We accept any value as `when` arg
    });

    it("Should emit an event on burning of tickets", async function () {
      const { ticket, otherAccount } = await loadFixture(deployTicket);
      await ticket.connect(otherAccount).buyTicket({ value: ONE_GWEI });
      await ticket.assist(0);
      await expect(ticket.connect(otherAccount).burn(0))
        .to.emit(ticket, "TicketBurnt")
        .withArgs(otherAccount, 0); // We accept any value as `when` arg
    });
  });
});
