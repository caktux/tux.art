export const MakersPlace = [
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function balanceOf(address owner) view returns (uint256)",
  "function burn(uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function mint(string newTokenURI)",
  "function name() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)",
  "function setApprovalForAll(address operator, bool approved)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function symbol() view returns (string)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tokenIdToDigitalMediaRelease(uint256) view returns (uint32, uint256)", // MP
  "function getDigitalMediaRelease(uint256) view returns (uint256, uint32, uint256)", // MP
  "function getDigitalMedia(uint256) view returns (uint256, uint32, uint32, uint256, address, string)", // MP
  "function getCollection(uint256) view returns (uint256, address, string)", // MP
  "function totalSupply() view returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId)"
]
