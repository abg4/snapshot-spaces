import axios from "axios";
import fs from "fs";

async function getSnapshotData() {
  let skip = 0;
  let spaces;
  const allSpaces = [];

  const getContractUrl = (chain, address) =>
    Number(chain) === 1
      ? "https://etherscan.io/address/" + address
      : Number(chain) === 137
      ? "https://polygonscan.com/address/" + address
      : Number(chain) === 100
      ? "https://gnosisscan.io/address/" + address
      : Number(chain) === 56
      ? "https://bscscan.com/address/" + address
      : Number(chain) === 42161
      ? "https://arbiscan.io/address/" + address
      : Number(chain) === 43114
      ? "https://snowtrace.io/address/" + address
      : address;

  do {
    spaces = await axios({
      url: "https://hub.snapshot.org/graphql",
      method: "post",
      data: {
        query: `
            query Spaces {
              spaces(first: 1000, skip: ${skip}, orderBy: "proposalsCount", orderDirection: asc) {
                id
                name
                symbol
                treasuries {
                  name
                  address
                  network
                }
                website
                twitter
                github
                plugins
                proposalsCount
              }
            }
              `,
      },
    }).then((result) =>
      result.data.data.spaces.map((space) => {
        space?.treasuries?.map((dao) => {
          space.treasuryNetwork = dao.network;
          space.treasuryContract = getContractUrl(dao.network, dao.address);
        });
        space?.plugins?.safeSnap?.safes?.map((dao) => {
          if (
            dao.network === "CHAIN_ID" ||
            Number(dao.network) === 4 ||
            Number(dao.network) === 5
          ) {
            return;
          }
          space.realityNetwork = dao.network || "";
          space.realityAddress =
          getContractUrl(dao.network, dao.realityAddress) || "";
        });
        return allSpaces.push({
          name: space.name,
          spaceUrl: "https://snapshot.org/#/" + space.id,
          website: space.website !== null ? space.website : "",
          twitter: space.twitter !== null ? space.twitter : "",
          github:
            space.github !== null ? "https://github.com/" + space.github : "",
          treasuryNetwork: space.treasuryNetwork || "",
          treasuryContract: space.treasuryContract || "",
          realityNetwork: space.realityNetwork || "",
          realityAddress: space.realityAddress || "",
          proposalCount: space.proposalsCount,
        });
      })
    );
    skip += 1000;
  } while (spaces.length > 0);

  fs.mkdirSync("outputs", { recursive: true });
  fs.writeFileSync(`outputs/spaces.json`, JSON.stringify(allSpaces, null, 2));
}

getSnapshotData().catch((err) => console.log(err));
