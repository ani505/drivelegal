import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // ── ViolationRegistry ──────────────────────────────────────────────────
  console.log("\n📋 Deploying ViolationRegistry…");
  const ViolationRegistry = await ethers.getContractFactory("ViolationRegistry");
  const registry = await ViolationRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("✅ ViolationRegistry deployed to:", registryAddr);

  // ── PaymentEscrow ──────────────────────────────────────────────────────
  console.log("\n💰 Deploying PaymentEscrow…");
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const escrow = await PaymentEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("✅ PaymentEscrow deployed to:", escrowAddr);

  // ── Write addresses to .env ────────────────────────────────────────────
  const envPath = path.join(__dirname, "../.env");
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

  const updated = envContent
    .replace(/CONTRACT_ADDRESS=.*/,         `CONTRACT_ADDRESS=${registryAddr}`)
    .replace(/PAYMENT_ESCROW_ADDRESS=.*/,   `PAYMENT_ESCROW_ADDRESS=${escrowAddr}`);

  if (!updated.includes("CONTRACT_ADDRESS=")) {
    fs.appendFileSync(envPath, `\nCONTRACT_ADDRESS=${registryAddr}\nPAYMENT_ESCROW_ADDRESS=${escrowAddr}\n`);
  } else {
    fs.writeFileSync(envPath, updated);
  }

  console.log("\n📝 .env updated with contract addresses.");
  console.log("\nDeployment summary:");
  console.log("  ViolationRegistry:", registryAddr);
  console.log("  PaymentEscrow:    ", escrowAddr);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
