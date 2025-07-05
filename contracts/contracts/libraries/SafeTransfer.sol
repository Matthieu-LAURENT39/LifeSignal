// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Types.sol";
import "./LifeSignalErrors.sol";

/**
 * @title SafeTransfer Library for LifeSignal
 * @dev Provides safe transfer functions for different asset types
 */
library SafeTransfer {
    using SafeERC20 for IERC20;

    /**
     * @dev Safely transfers ETH to a recipient
     * @param recipient Address to receive ETH
     * @param amount Amount of ETH to transfer
     */
    function safeTransferETH(address payable recipient, uint256 amount) internal {
        if (recipient == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (amount == 0) revert LifeSignalErrors.InvalidAmount();
        if (address(this).balance < amount) revert LifeSignalErrors.InsufficientBalance();

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert LifeSignalErrors.TransferFailed();
    }

    /**
     * @dev Safely transfers ERC20 tokens to a recipient
     * @param token Address of the ERC20 token
     * @param recipient Address to receive tokens
     * @param amount Amount of tokens to transfer
     */
    function safeTransferERC20(
        address token,
        address recipient,
        uint256 amount
    ) internal {
        if (token == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (recipient == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (amount == 0) revert LifeSignalErrors.InvalidAmount();

        IERC20(token).safeTransfer(recipient, amount);
    }

    /**
     * @dev Safely transfers ERC721 NFT to a recipient
     * @param token Address of the ERC721 token
     * @param from Address to transfer from
     * @param recipient Address to receive the NFT
     * @param tokenId Token ID to transfer
     */
    function safeTransferERC721(
        address token,
        address from,
        address recipient,
        uint256 tokenId
    ) internal {
        if (token == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (from == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (recipient == address(0)) revert LifeSignalErrors.ZeroAddress();

        try IERC721(token).safeTransferFrom(from, recipient, tokenId) {
            // Transfer successful
        } catch {
            revert LifeSignalErrors.AssetTransferFailed();
        }
    }

    /**
     * @dev Safely transfers ERC1155 tokens to a recipient
     * @param token Address of the ERC1155 token
     * @param from Address to transfer from
     * @param recipient Address to receive tokens
     * @param tokenId Token ID to transfer
     * @param amount Amount of tokens to transfer
     */
    function safeTransferERC1155(
        address token,
        address from,
        address recipient,
        uint256 tokenId,
        uint256 amount
    ) internal {
        if (token == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (from == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (recipient == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (amount == 0) revert LifeSignalErrors.InvalidAmount();

        try IERC1155(token).safeTransferFrom(from, recipient, tokenId, amount, "") {
            // Transfer successful
        } catch {
            revert LifeSignalErrors.AssetTransferFailed();
        }
    }

    /**
     * @dev Safely transfers an asset based on its type
     * @param asset Asset to transfer
     * @param from Address to transfer from
     * @param recipient Address to receive the asset
     */
    function safeTransferAsset(
        Types.Asset memory asset,
        address from,
        address recipient
    ) internal {
        if (asset.assetType == Types.AssetType.ETH) {
            safeTransferETH(payable(recipient), asset.amount);
        } else if (asset.assetType == Types.AssetType.ERC20) {
            safeTransferERC20(asset.tokenAddress, recipient, asset.amount);
        } else if (asset.assetType == Types.AssetType.ERC721) {
            safeTransferERC721(asset.tokenAddress, from, recipient, asset.tokenId);
        } else if (asset.assetType == Types.AssetType.ERC1155) {
            safeTransferERC1155(asset.tokenAddress, from, recipient, asset.tokenId, asset.amount);
        } else {
            revert LifeSignalErrors.AssetNotSupported();
        }
    }

    /**
     * @dev Safely transfers multiple assets to a recipient
     * @param assets Array of assets to transfer
     * @param from Address to transfer from
     * @param recipient Address to receive the assets
     */
    function safeTransferAssets(
        Types.Asset[] memory assets,
        address from,
        address recipient
    ) internal {
        for (uint256 i = 0; i < assets.length; i++) {
            safeTransferAsset(assets[i], from, recipient);
        }
    }

    /**
     * @dev Safely transfers ERC20 tokens from a sender to this contract
     * @param token Address of the ERC20 token
     * @param from Address to transfer from
     * @param amount Amount of tokens to transfer
     */
    function safeTransferFromERC20(
        address token,
        address from,
        uint256 amount
    ) internal {
        if (token == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (from == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (amount == 0) revert LifeSignalErrors.InvalidAmount();

        IERC20(token).safeTransferFrom(from, address(this), amount);
    }

    /**
     * @dev Safely transfers ERC721 NFT from a sender to this contract
     * @param token Address of the ERC721 token
     * @param from Address to transfer from
     * @param tokenId Token ID to transfer
     */
    function safeTransferFromERC721(
        address token,
        address from,
        uint256 tokenId
    ) internal {
        if (token == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (from == address(0)) revert LifeSignalErrors.ZeroAddress();

        try IERC721(token).safeTransferFrom(from, address(this), tokenId) {
            // Transfer successful
        } catch {
            revert LifeSignalErrors.AssetTransferFailed();
        }
    }

    /**
     * @dev Safely transfers ERC1155 tokens from a sender to this contract
     * @param token Address of the ERC1155 token
     * @param from Address to transfer from
     * @param tokenId Token ID to transfer
     * @param amount Amount of tokens to transfer
     */
    function safeTransferFromERC1155(
        address token,
        address from,
        uint256 tokenId,
        uint256 amount
    ) internal {
        if (token == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (from == address(0)) revert LifeSignalErrors.ZeroAddress();
        if (amount == 0) revert LifeSignalErrors.InvalidAmount();

        try IERC1155(token).safeTransferFrom(from, address(this), tokenId, amount, "") {
            // Transfer successful
        } catch {
            revert LifeSignalErrors.AssetTransferFailed();
        }
    }

    /**
     * @dev Checks if an address has sufficient balance for a given asset
     * @param asset Asset to check balance for
     * @param account Address to check balance of
     * @return bool True if sufficient balance exists
     */
    function hasBalance(Types.Asset memory asset, address account) internal view returns (bool) {
        if (asset.assetType == Types.AssetType.ETH) {
            return account.balance >= asset.amount;
        } else if (asset.assetType == Types.AssetType.ERC20) {
            return IERC20(asset.tokenAddress).balanceOf(account) >= asset.amount;
        } else if (asset.assetType == Types.AssetType.ERC721) {
            return IERC721(asset.tokenAddress).ownerOf(asset.tokenId) == account;
        } else if (asset.assetType == Types.AssetType.ERC1155) {
            return IERC1155(asset.tokenAddress).balanceOf(account, asset.tokenId) >= asset.amount;
        }
        return false;
    }

    /**
     * @dev Gets the balance of an asset for a given account
     * @param asset Asset to get balance for
     * @param account Address to get balance of
     * @return uint256 Balance amount
     */
    function getBalance(Types.Asset memory asset, address account) internal view returns (uint256) {
        if (asset.assetType == Types.AssetType.ETH) {
            return account.balance;
        } else if (asset.assetType == Types.AssetType.ERC20) {
            return IERC20(asset.tokenAddress).balanceOf(account);
        } else if (asset.assetType == Types.AssetType.ERC721) {
            return IERC721(asset.tokenAddress).ownerOf(asset.tokenId) == account ? 1 : 0;
        } else if (asset.assetType == Types.AssetType.ERC1155) {
            return IERC1155(asset.tokenAddress).balanceOf(account, asset.tokenId);
        }
        return 0;
    }
} 