import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as chai from "chai";
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
import { keccak256 } from "ethers/lib/utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

function parseEther(amount: Number) {
    return ethers.utils.parseUnits(amount.toString(), 18);
}

describe("Token contract", function () {
    // We define a fixture to reuse the same setup in every test. We use
    // loadFixture to run this setup once, snapshot that state, and reset Hardhat
    // Network to that snapshot in every test.
    async function deployTokenFixture() {
        // Get the ContractFactory and Signers here.
        const Token = await ethers.getContractFactory("Token");
        const [owner, addr1, addr2] = await ethers.getSigners();

        // To deploy our contract, we just have to call Token.deploy() and await
        // its deployed() method, which happens onces its transaction has been
        // mined.
        const hardhatToken = await Token.deploy();

        await hardhatToken.deployed();

        // Fixtures can return anything you consider useful for your tests
        return { Token, hardhatToken, owner, addr1, addr2 };
    }

    // You can nest describe calls to create subsections.
    describe("Deployment", function () {
        // `it` is another Mocha function. This is the one you use to define each
        // of your tests. It receives the test name, and a callback function.
        //
        // If the callback function is async, Mocha will `await` it.
        it("Should set the right owner", async function () {
            // We use loadFixture to setup our environment, and then assert that
            // things went well
            const { hardhatToken, owner } = await loadFixture(deployTokenFixture);

            // `expect` receives a value and wraps it in an assertion object. These
            // objects have a lot of utility methods to assert values.

            // This test expects the owner variable stored in the contract to be
            // equal to our Signer's owner.
            expect(await hardhatToken.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
            const ownerBalance = await hardhatToken.balanceOf(owner.address);
            expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
        });
    });

    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
                deployTokenFixture
            );
            // Transfer 50 tokens from owner to addr1
            await expect(
                hardhatToken.transfer(addr1.address, 50)
            ).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50, 50]);

            // Transfer 50 tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await expect(
                hardhatToken.connect(addr1).transfer(addr2.address, 50)
            ).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50, 50]);
        });

        it("Should emit Transfer events", async function () {
            const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
                deployTokenFixture
            );

            // Transfer 50 tokens from owner to addr1
            await expect(hardhatToken.transfer(addr1.address, 50))
                .to.emit(hardhatToken, "Transfer")
                .withArgs(owner.address, addr1.address, 50);

            // Transfer 50 tokens from addr1 to addr2
            // We use .connect(signer) to send a transaction from another account
            await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
                .to.emit(hardhatToken, "Transfer")
                .withArgs(addr1.address, addr2.address, 50);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const { hardhatToken, owner, addr1 } = await loadFixture(
                deployTokenFixture
            );
            const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

            // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
            // `require` will evaluate false and revert the transaction.
            await expect(
                hardhatToken.connect(addr1).transfer(owner.address, 1)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            // Owner balance shouldn't have changed.
            expect(await hardhatToken.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            );
        });
    });
});

describe("Vault contract", () => {
    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;

    let vault: Contract;
    let token: Contract;

    async function deployVaultFixture() {
        await ethers.provider.send("hardhat_reset", []);
        [owner, alice, bob, carol] = await ethers.getSigners();

        const Vault = await ethers.getContractFactory("Vault", owner);
        vault = await Vault.deploy();
        const Token = await ethers.getContractFactory("Token", owner);
        token = await Token.deploy();
        await token.deployed();

        await vault.setToken(token.address);
        await vault.deployed();

        return { vault, token, owner, alice, bob, carol };
    }

    // Happy Path
    describe('Happy Path', () => {
        it('Should set right Token', async () => {
            const { vault, token } = await loadFixture(deployVaultFixture);

            await vault.setToken(token.address);

            expect(await vault.getTokenAddress()).equal(token.address)
        });

        it("Should deposit into Vault", async () => {
            const { vault, token, alice } = await loadFixture(deployVaultFixture);

            await token.transfer(alice.address, parseEther(1 * 10 ** 6));
            await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
            await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));
            expect(await token.balanceOf(vault.address)).equal(parseEther(500 * 10 ** 3));
            //expect(await token.balanceOf(alice.address)).equal(parseEther(50 * 10**9) - parseEther(500 * 10**3));

            // console.log(await token.balanceOf(vault.address));
            // console.log(bob.address);
        });

        it("Should withdraw", async () => {
            const { vault, token, alice, bob } = await loadFixture(deployVaultFixture);

            // Gán quyền rút tiền cho Bob
            let WITHDRAW_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
            await vault.grantRole(WITHDRAW_ROLE, bob.address);

            // Mở chức năng rút tiền của quỹ
            await vault.setWithdrawEnable(true);
            await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

            // // Alice nạp tiền vào quỹ để chuyển cho Bob
            await token.transfer(alice.address, parseEther(1 * 10 ** 6));
            await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
            await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

            // Bob rút tiền vào ví
            await vault.connect(bob).withdraw(bob.address, parseEther(300 * 10 ** 3));
            expect(await token.balanceOf(vault.address)).equal(parseEther(200 * 10 ** 3));
            expect(await token.balanceOf(bob.address)).equal(parseEther(300 * 10 ** 3));
        });
    });

    // Unhappy path
    describe('Unhappy Path', () => {
        it("Should not deposit, Insufficient account balance", async () => {
            const { vault, token, alice } = await loadFixture(deployVaultFixture);
            await token.transfer(alice.address, parseEther(1 * 10 ** 6));
            await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
            await expect(vault.connect(alice).deposit(parseEther(2 * 10 ** 6))).revertedWith('Insufficient account balance');
        });

        it("Should not withdraw, Withdraw is not available", async () => {
            const { vault, token, alice, bob } = await loadFixture(deployVaultFixture);

            // Cấp quyền rút tiền cho Bob
            let WITHDRAW_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
            await vault.grantRole(WITHDRAW_ROLE, bob.address);

            // Tắt chức năng rút tiền của quỹ
            await vault.setWithdrawEnable(false);
            await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

            // Alice nạp tiền vào quỹ để chuyển cho Bob
            await token.transfer(alice.address, parseEther(1 * 10 ** 6));
            await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
            await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

            // Bob rút tiền vào ví
            await expect(vault.connect(bob).withdraw(bob.address, parseEther(300 * 10 ** 3))).revertedWith("Withdraw is not available");
        });

        it("Should not withdraw, Exceed maximum amount", async () => {
            const { vault, token, alice, bob } = await loadFixture(deployVaultFixture);

            // Cấp quyền rút tiền cho Bob
            let WITHDRAW_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
            await vault.grantRole(WITHDRAW_ROLE, bob.address);

            // Tắt chức năng rút tiền của quỹ
            await vault.setWithdrawEnable(true);
            await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 3));

            // Alice nạp tiền vào quỹ để chuyển cho Bob
            await token.transfer(alice.address, parseEther(1 * 10 ** 6));
            await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
            await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

            // Bob rút tiền vào ví
            await expect(vault.connect(bob).withdraw(bob.address, parseEther(300 * 10 ** 3))).revertedWith("Exceed maximum amount");
        });

        it("Should not withdraw, Caller is not a withdrawer", async () => {
            const { vault, token, alice, bob, carol } = await loadFixture(deployVaultFixture);

            // Cấp quyền rút tiền cho Bob
            let WITHDRAW_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
            await vault.grantRole(WITHDRAW_ROLE, bob.address);

            // Tắt chức năng rút tiền của quỹ
            await vault.setWithdrawEnable(true);
            await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 3));

            // Alice nạp tiền vào quỹ để chuyển cho Bob
            await token.transfer(alice.address, parseEther(1 * 10 ** 6));
            await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
            await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

            // Bob rút tiền vào ví
            await expect(vault.connect(carol).withdraw(bob.address, parseEther(300 * 10 ** 3))).revertedWith("Caller is not a withdrawer");
        });

        it("Should not withdraw, ERC20: transfer amount exceeds balance", async () => {
            const { vault, token, alice, bob } = await loadFixture(deployVaultFixture);

            // Cấp quyền rút tiền cho Bob
            let WITHDRAW_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
            await vault.grantRole(WITHDRAW_ROLE, bob.address);

            // Tắt chức năng rút tiền của quỹ
            await vault.setWithdrawEnable(true);
            await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

            // Alice nạp tiền vào quỹ để chuyển cho Bob
            await token.transfer(alice.address, parseEther(1 * 10 ** 6));
            await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
            await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

            // Bob rút tiền vào ví
            await expect(vault.connect(bob).withdraw(bob.address, parseEther(700 * 10 ** 3))).revertedWith("ERC20: transfer amount exceeds balance");
        });
    });
})