// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ArtisanRights1155 is ERC1155Supply, IERC2981, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Constants for token kinds
    uint256 public constant COA_KIND = 0;        // Certificate of Authenticity
    uint256 public constant RIGHTS_KIND = 1;     // Rights tokens
    
    // Royalty info
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyBps; // Basis points (10000 = 100%)
    }
    
    // Storage
    mapping(uint256 => RoyaltyInfo) private _tokenRoyalties;
    RoyaltyInfo private _defaultRoyalty;
    mapping(uint256 => string) private _tokenURIs;
    
    // Events
    event MintedCoA(uint256 indexed sku, uint256 indexed tokenId, address indexed to);
    event MintedRights(uint256 indexed sku, uint256 indexed tokenId, uint256 amount, address indexed to);
    event LicenseBound(uint256 indexed tokenId, string cid);
    event ProvenanceNote(uint256 indexed tokenId, string ref);
    
    constructor(
        string memory initialUri,
        address admin,
        address minter
    ) ERC1155(initialUri) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
        
        // Set default royalty to 5%
        _setDefaultRoyalty(admin, 500); // 500 basis points = 5%
    }
    
    // Token ID calculation: sku << 16 | kind
    function calculateTokenId(uint256 sku, uint256 kind) public pure returns (uint256) {
        return (sku << 16) | kind;
    }
    
    // Mint Certificate of Authenticity (supply = 1)
    function mintCoA(
        address to,
        uint256 productSku,
        string memory tokenURI,
        uint96 royaltyBps
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        uint256 tokenId = calculateTokenId(productSku, COA_KIND);
        
        require(totalSupply(tokenId) == 0, "CoA already exists");
        
        _mint(to, tokenId, 1, "");
        _setTokenURI(tokenId, tokenURI);
        
        if (royaltyBps > 0) {
            _setTokenRoyalty(tokenId, to, royaltyBps);
        }
        
        emit MintedCoA(productSku, tokenId, to);
    }
    
    // Mint Rights tokens (can have multiple editions)
    function mintRights(
        address to,
        uint256 productSku,
        string memory tokenURI,
        uint256 amount,
        uint96 royaltyBps
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        uint256 tokenId = calculateTokenId(productSku, RIGHTS_KIND);
        
        _mint(to, tokenId, amount, "");
        _setTokenURI(tokenId, tokenURI);
        
        if (royaltyBps > 0) {
            _setTokenRoyalty(tokenId, to, royaltyBps);
        }
        
        emit MintedRights(productSku, tokenId, amount, to);
    }
    
    // Bind license to token
    function bindLicense(uint256 tokenId, string memory licenseCid) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(exists(tokenId), "Token does not exist");
        emit LicenseBound(tokenId, licenseCid);
    }
    
    // Record provenance - Keeps the history of the token
    function recordProvenanceNote(uint256 tokenId, string memory ref) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(exists(tokenId), "Token does not exist");
        emit ProvenanceNote(tokenId, ref);
    }
    
    // Set token URI
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        _tokenURIs[tokenId] = tokenURI;
        emit URI(tokenURI, tokenId);
    }
    
    // Get token URI
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
    
    // Royalty functions (EIP-2981)
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        public
        view
        override
        returns (address, uint256)
    {
        RoyaltyInfo memory royalty = _tokenRoyalties[tokenId];
        
        if (royalty.receiver == address(0)) {
            royalty = _defaultRoyalty;
        }
        
        uint256 royaltyAmount = (salePrice * royalty.royaltyBps) / 10000;
        return (royalty.receiver, royaltyAmount);
    }
    
    function _setDefaultRoyalty(address receiver, uint96 bps) internal {
        _defaultRoyalty = RoyaltyInfo(receiver, bps);
    }
    
    function _setTokenRoyalty(uint256 tokenId, address receiver, uint96 bps) internal {
        _tokenRoyalties[tokenId] = RoyaltyInfo(receiver, bps);
    }
    
    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, IERC165, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
