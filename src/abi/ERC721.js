export const ERC721 = [
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function balanceOf(address owner) view returns (uint256)",
  "function burn(uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function creatorTokens(address creator) view returns (uint256[])",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function mint(string newTokenURI)",
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function symbol() view returns (string)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function creator(uint256) view returns (address)", // OpenSea
  "function tokenCreator(uint256 tokenId) view returns (address)",
  "function tokenCreators(uint256) view returns (address)", // Zora
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function uri(uint256) view returns (string)", // OpenSea
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tokenMetadataURI(uint256 tokenId) view returns (string)", // Zora
  "function totalSupply() view returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId)"
]
