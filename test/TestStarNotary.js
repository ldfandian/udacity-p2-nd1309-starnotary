// prepare the test env
var chai = require('../app/node_modules/chai');
chai.use(require('../app/node_modules/chai-as-promised'))
chai.should();

var expect = chai.expect;
var assert = chai.assert;

const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!');
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let tokenId = 6;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star - New', tokenId, {from: accounts[1]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star - New');

    assert.equal(await instance.name.call(), "Cosmic Stars Exchange Test");
    assert.equal(await instance.symbol.call(), 'CSET');
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed

    // prepare two new stars
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];
    let starId1 = 7;
    let starId2 = 8;
    await instance.createStar('awesome star 1', starId1, {from: user1});
    assert.equal(await instance.ownerOf.call(starId1), user1);
    await instance.createStar('awesome star 2', starId2, {from: user2});
    assert.equal(await instance.ownerOf.call(starId2), user2);

    // positive case: exchange between user1 to user2 (by user1)
    await instance.exchangeStars(starId1, starId2, {from: user1});
    assert.equal(await instance.ownerOf.call(starId1), user2);
    assert.equal(await instance.ownerOf.call(starId2), user1);

    // positive case: exchange between user1 to user2, again (by user2)
    await instance.exchangeStars(starId1, starId2, {from: user2});
    assert.equal(await instance.ownerOf.call(starId1), user1);
    assert.equal(await instance.ownerOf.call(starId2), user2);

    // negative case: check ownership
    assert.isRejected(instance.exchangeStars(starId1, starId2, {from: user3}));

    // negative case: same token
    assert.isRejected(instance.exchangeStars(starId1, starId1, {from: user1}));

    // negative case: wrong token
    assert.isRejected(instance.exchangeStars(starId1, starId1+1000000, {from: user1}));
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    // 2. use the transferStar function implemented in the Smart Contract
    // 3. Verify the star owner changed.

    // prepare a new star
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];
    let starId = 9;
    await instance.createStar('awesome star', starId, {from: user1});
    assert.equal(await instance.ownerOf.call(starId), user1);

    // positive case: transfer from user1 to user2
    await instance.transferStar(user2, starId, {from: user1});
    assert.equal(await instance.ownerOf.call(starId), user2);

    // negative case: check ownership
    assert.isRejected(instance.transferStar(user2, starId, {from: user1}));
    assert.isRejected(instance.transferStar(user3, starId, {from: user1}));

    // positive case: transfer back to user1
    await instance.transferStar(user1, starId, {from: user2});
    assert.equal(await instance.ownerOf.call(starId), user1);

    // negative case: don't transfer to yourself
    assert.isRejected(instance.transferStar(user1, starId, {from: user1}));

    // negative case: bad token
    assert.isRejected(instance.transferStar(user1, starId+1000000, {from: user1}));
});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    // 2. Call your method lookUptokenIdToStarInfo
    // 3. Verify if you Star name is the same
    let tokenId = 10;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star - New 2', tokenId, {from: accounts[1]})
    assert.equal(await instance.lookUptokenIdToStarInfo.call(tokenId), 'Awesome Star - New 2');
});