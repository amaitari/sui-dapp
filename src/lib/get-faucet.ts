import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";

async function main() {
  // get tokens from the testnet faucet server
  await requestSuiFromFaucetV0({
    // connect to testnet
    host: getFaucetHost("testnet"),
    recipient: "0x5eb329e645318d4b1b2c18c8aba65dc4c97b8349653561f67d6f68c359f58816", // YOUR SUI ADDRESS
  });
}

main()
  .then(() => console.log("Faucet Request Complete"))
  .catch((error) => console.log(error));
