import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      // handle account change
      const refreshAccountFunc = async function (accounts) {
        let newAccounts = await App.web3.eth.getAccounts();
        if (newAccounts[0] !== App.account) {
          App.account = newAccounts[0];
          if (window.ethereum) {
            App.web3 = new Web3(window.ethereum);
            window.ethereum.enable(); // get permission to access accounts
          }
          console.log('account changed to: ' + App.account);
        }
      };
      window.ethereum.on('accountsChanged', refreshAccountFunc);
      window.ethereum.on('networkChanged', refreshAccountFunc);
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  setCreateStarStatus: function(message) {
    const status = document.getElementById("createStarStatus");
    status.innerHTML = message;
  },

  setLookupStarStatus: function(message) {
    const status = document.getElementById("lookupStarStatus");
    status.innerHTML = message;
  },

  createStar: async function() {
    const { createStar } = this.meta.methods;
    const name = document.getElementById("starName").value;
    const id = document.getElementById("starId").value;

    try {
      await createStar(name, id).send({from: this.account});
      App.setCreateStarStatus("New Star Owner is " + this.account + ".");
    } catch (error) {
      console.error(error);
      App.setCreateStarStatus("found error...");
    }
  },

  // Implement Task 4 Modify the front end of the DAPP
  lookUp: async function (){
    const { tokenIdToStarInfo, ownerOf } = this.meta.methods;
    const id = document.getElementById("lookid").value;

    try {
      let starName = await tokenIdToStarInfo(id).call();
      let starOwner= await ownerOf(id).call();
      App.setLookupStarStatus("Star Name is " + starName + ", Star Owner is " + starOwner + ".");
    } catch (error) {
      console.error(error);
      App.setLookupStarStatus("found error...");
    }
  }

};

window.App = App;

window.addEventListener("load", async function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    await window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",);
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"),);
  }

  App.start();
});