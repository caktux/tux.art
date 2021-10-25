
import { ethers } from 'ethers'
import { ERC721 } from '../abi/ERC721'
import { getTokenAuction } from './auctions'


export async function getOwnedNFTs(provider: any, tokenContract: string, account: string, limit: number, offset: number) {
  const contract = new ethers.Contract(tokenContract, ERC721, provider)

  const balanceOf = await contract.balanceOf(account).catch((e: any) => {
    console.warn('In balanceOf', e.message)
  })

  const balance = balanceOf ? balanceOf.toNumber() : 0

  let tokens = []

  for (let i = balance - offset - 1; i >= 0; i--) {
    const tokenId = await contract.tokenOfOwnerByIndex(account, i).catch((e: any) => {
      console.warn('In tokenOfOwnerByIndex', e.message)
    })

    if (!tokenId)
      continue

    const auction = await getTokenAuction(provider, {
      contract: tokenContract,
      tokenId: tokenId
    })

    tokens.push({tokenId, auction})

    if (tokens.length >= limit)
      break
  }

  return [balance, tokens]
}
