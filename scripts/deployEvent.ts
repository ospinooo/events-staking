import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const SECS = 60;
  const eventTime = currentTimestampInSeconds + SECS;

  const Event = await ethers.getContractFactory("Event");
  const event = await Event.deploy(eventTime, 0.01);

  await event.deployed();

  console.log('Event deployed to:', event.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
    