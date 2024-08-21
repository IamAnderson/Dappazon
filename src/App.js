import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Navigation from "./components/Navigation";
import Search from "./components/Search";
import Home from "./components/Home";

// ABIs
import RealEstateABI from "./abis/RealEstate.json";
import EscrowABI from "./abis/Escrow.json";

// Config
import config from "./config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);

  const [account, setAccount] = useState(null);

  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);

  async function loadBlockchainData() {
    const provider = new ethers.providers.Web3Provider(window?.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();
    
    const realEstateAddress = config[network?.chainId]?.realEstate?.address;
    const escrowAddress = config[network?.chainId]?.escrow?.address;

    const realEstate = new ethers.Contract(realEstateAddress, RealEstateABI, provider);
    const totalSupply = await realEstate.totalSupply();
    
    for(var i = 1; i < totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      const resp = await fetch(uri);
      const metaData = await resp.json();
      homes.push(metaData); 
    }
    
    setHomes(homes);

    const escrow = new ethers.Contract(escrowAddress, EscrowABI, provider);
    setEscrow(escrow);

  }

  window.ethereum.on("accountsChanged", async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);
  });

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const togglePop = (home) => {
    setHome(home)
    toggle ? setToggle(false) : setToggle(true);
  }


  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className="cards__section">
        <h3>Homes For You</h3>

        <hr />

        <div className="cards">
          {homes.map((home, index) => {

            const image = home.image;

            return(
              <div className="card"
               key={index} 
              onClick={() => togglePop(home)}
              >
                <div className="card__image">
                  <img src={image} alt="" />
                </div>
                <div className="card__info">
                  <h4>{home.attributes[0].value} ETH</h4>
                  <p>
                    <strong>{home.attributes[2].value}</strong> bds |
                    <strong>{home.attributes[3].value}</strong> ba |
                    <strong>{home.attributes[4].value}</strong> sqft
                  </p>
                  <p>{home.address}</p>
                </div>
              </div>
            )
          }
          )}
        </div>
      </div>
      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}
    </div>
  );
}

export default App;
