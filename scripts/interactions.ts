import * as dotenv from 'dotenv';
dotenv.config()

import Web3 from 'web3';

import { readJSONFile } from './helper';

// Call the function with a valid file name 
const data = readJSONFile('../artifacts/contracts/Token.sol/Token.json');

// Access an element in the json object by its key name  
const tokenAbi = data['abi'];

const tokenAddress = "0x15E90cB880aE357EcD229FC7834573c2e6719ce5";

const myPrivateKey = `${process.env.PRIVATE_KEY}`;
const myAddress = `${process.env.PUBLIC_KEY}`;

const receiverAddress = "0x6eAADf156DDF029D43281CdbC30002C97276a557";

async function interact() {
    let web3 = await new Web3("https://eth-goerli.alchemyapi.io/v2/GMGOq5IweL2FmHvrCa2v_H8ISKknDtUu");

    let tokenContract = await new web3.eth.Contract(tokenAbi, tokenAddress);

    // Call
    // let myBalance = await tokenContract.methods.balanceOf(myAddress).call();
    // console.log(myBalance);

    // Send
    await web3.eth.accounts.wallet.add(myPrivateKey);

    let receiverBalanceBefore = await tokenContract.methods.balanceOf(receiverAddress).call();

    let result = await tokenContract.methods.transfer(receiverAddress, web3.utils.toWei('10', 'ether')).send({
        from: myAddress,
        gas: 3000000
    });

    let receiverBalanceAfter = await tokenContract.methods.balanceOf(receiverAddress).call();

    console.log(result, receiverBalanceBefore, receiverBalanceAfter);
}

interact();