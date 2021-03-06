export const Auctions = [
  "event AccountUpdated(address indexed owner)",
  "event AuctionApprovalUpdated(uint256 indexed auctionId, bool approved)",
  "event AuctionBid(uint256 indexed auctionId, address indexed bidder, uint256 value, bool firstBid, bool extended)",
  "event AuctionCanceled(uint256 indexed auctionId)",
  "event AuctionCreated(uint256 indexed auctionId)",
  "event AuctionDurationExtended(uint256 indexed auctionId, uint256 duration)",
  "event AuctionEnded(uint256 indexed auctionId)",
  "event AuctionReservePriceUpdated(uint256 indexed auctionId, uint256 reservePrice)",
  "event CreatorAdded(uint256 indexed houseId, address indexed creator)",
  "event CreatorRemoved(uint256 indexed houseId, address indexed creator)",
  "event FeeUpdated(uint256 indexed houseId, uint16 fee)",
  "event HouseCreated(uint256 indexed houseId)",
  "event MetadataUpdated(uint256 indexed houseId, string metadata)",
  "function acceptOffer(uint256 offerId)",
  "function accounts(address) view returns (string name, string bioHash, string pictureHash)",
  "function addCreator(uint256 houseId, address creator)",
  "function auctions(uint256) view returns (address tokenContract, uint256 tokenId, address tokenOwner, uint256 duration, uint256 reservePrice, uint256 houseId, uint16 fee, bool approved, uint256 firstBidTime, uint256 amount, address bidder, uint256 created)",
  "function bids(uint256) view returns (uint256 timestamp, address bidder, uint256 value)",
  "function buyAuction(uint256 auctionId) payable",
  "function cancelAuction(uint256 auctionId)",
  "function cancelFeature(uint256 auctionId)",
  "function cancelOffer(uint256 offerId)",
  "function collectorStats(address) view returns (uint256 bids, uint256 sales, uint256 bought, uint256 totalSold, uint256 totalSpent)",
  "function contracts(address) view returns (string name, address tokenContract, uint256 bids, uint256 sales, uint256 total)",
  "function createAuction(address tokenContract, uint256 tokenId, uint256 duration, uint256 reservePrice, uint256 houseId)",
  "function createBid(uint256 auctionId) payable",
  "function createHouse(string name, address curator, uint16 fee, bool preApproved, string metadata)",
  "function creatorStats(address) view returns (uint256 bids, uint256 sales, uint256 total)",
  "function endAuction(uint256 auctionId)",
  "function feature(uint256 auctionId, uint256 amount)",
  "function getActiveHouses(uint256 from, uint256 n) view returns (uint256[])",
  "function getAuctionBids(uint256 auctionId) view returns (uint256[])",
  "function getAuctions(uint256 from, uint256 n) view returns (uint256[])",
  "function getBidderAuctions(address bidder) view returns (uint256[])",
  "function getCollections(address creator) view returns (address[])",
  "function getCreatorHouses(address creator) view returns (uint256[])",
  "function getCuratorHouses(address curator) view returns (uint256[])",
  "function getHouseAuctions(uint256 houseId, uint256 from, uint256 n) view returns (uint256[])",
  "function getHouseCreators(uint256 houseId) view returns (address[])",
  "function getHouseQueue(uint256 houseId) view returns (uint256[])",
  "function getPreviousAuctions(bytes32 tokenHash) view returns (uint256[])",
  "function getRankedCollectors(address from, uint256 n) view returns (address[])",
  "function getRankedContracts(address from, uint256 n) view returns (address[])",
  "function getRankedCreators(address from, uint256 n) view returns (address[])",
  "function getRankedHouses(uint256 from, uint256 n) view returns (uint256[])",
  "function getSellerAuctions(address seller) view returns (uint256[])",
  "function getTokenOffers(bytes32 tokenHash) view returns (uint256[])",
  "function houseIDs(string) view returns (uint256)",
  "function houses(uint256) view returns (string name, address curator, uint16 fee, bool preApproved, string metadata, uint256 bids, uint256 sales, uint256 total, uint256 feesTotal, uint256 activeAuctions)",
  "function makeOffer(address tokenContract, uint256 tokenId) payable",
  "function minimumIncrementPercentage() view returns (uint16)",
  "function offers(uint256) view returns (address tokenContract, uint256 tokenId, address from, uint256 amount, uint256 timestamp)",
  "function registerTokenContract(address tokenContract)",
  "function removeCreator(uint256 houseId, address creator)",
  "function setAuctionApproval(uint256 auctionId, bool approved)",
  "function setAuctionReservePrice(uint256 auctionId, uint256 reservePrice)",
  "function timeBuffer() view returns (uint256)",
  "function tokenAuction(bytes32) view returns (uint256)",
  "function totalActiveAuctions() view returns (uint256)",
  "function totalActiveHouseAuctions(uint256 houseId) view returns (uint256)",
  "function totalActiveHouses() view returns (uint256)",
  "function totalAuctions() view returns (uint256)",
  "function totalCollectors() view returns (uint256)",
  "function totalContracts() view returns (uint256)",
  "function totalCreators() view returns (uint256)",
  "function totalHouses() view returns (uint256)",
  "function tuxERC20() view returns (address)",
  "function updateBio(string bioHash)",
  "function updateCollectorRank(address collector)",
  "function updateContractRank(address tokenContract)",
  "function updateCreatorRank(address creator)",
  "function updateFee(uint256 houseId, uint16 fee)",
  "function updateHouseRank(uint256 houseId)",
  "function updateMetadata(uint256 houseId, string metadata)",
  "function updateName(string name)",
  "function updatePicture(string pictureHash)"
]
