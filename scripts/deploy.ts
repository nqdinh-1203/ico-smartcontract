import { ethers, hardhatArguments } from "hardhat";
import * as Config from "./config";

async function main() {
  await Config.initConfig();
  const network = hardhatArguments.network ? hardhatArguments.network : "dev";
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from address: ", deployer.address);

  // const Token = await ethers.getContractFactory("Token");
  // const token = await Token.deploy();
  // console.log("Token address: ", token.address);
  // Config.setConfig(network + '.Token', token.address);

  // const Vault = await ethers.getContractFactory("Vault");
  // const vault = await Vault.deploy();
  // console.log("Vault address: ", vault.address);
  // Config.setConfig(network + ".Vault", vault.address);

  // const USDT = await ethers.getContractFactory("USDT");
  // const usdt = await USDT.deploy();
  // console.log("USDT address: ", await usdt.address);
  // Config.setConfig(network + '.USDT', await usdt.address);

  const ICO = await ethers.getContractFactory("PPCrowndSale");
  const ico = await ICO.deploy(100000, 100, "0x24A8427EFb2D4bB03A44286feDb8D8fE662916d8", "0x15E90cB880aE357EcD229FC7834573c2e6719ce5");
  console.log("ICO address: ", await ico.address);
  Config.setConfig(network + '.ICO2', await ico.address);

  await Config.updateConfig();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });