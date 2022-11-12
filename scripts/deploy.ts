import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

const ONE_GWEI = 1_000_000_000;

async function main() {
  const ONE_HOUR_IN_SECS = 60 * 60;
  const eventTime = (await time.latest()) + ONE_HOUR_IN_SECS;
  const eventPrice = ONE_GWEI;
  const eventMaximumTickets = 10;

  const Ticket = await ethers.getContractFactory("Ticket");
  const ticket = await Ticket.deploy(
    eventMaximumTickets,
    eventPrice,
    eventTime
  );

  await ticket.deployed();

  console.log(`Ticket deployed to ${ticket.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
