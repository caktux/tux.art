
import { ethers } from 'ethers'
import { ERC721 } from '../abi/ERC721'
import { getTokenAuction } from './auctions'


export async function getLatestNFTs(provider: any, tokenContract: string, limit: number, offset: number) {
  const contract = new ethers.Contract(tokenContract, ERC721, provider)

  const totalSupply = await contract.totalSupply().catch((e: any) => {
    console.warn(`In totalSupply of ${tokenContract}`, e.message)
  })

  const total = totalSupply ? totalSupply.toNumber() : 0

  let tokens = [] as any

  for (let i = total - offset - 1; i >= 0; i--) {
    const tokenId = await contract.tokenByIndex(i).catch((e: any) => {
      console.warn('In tokenByIndex', e.message)
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

  return [totalSupply, tokens]
}
