
import { ethers } from 'ethers'
import { ERC721 } from '../abi/ERC721'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'
import { getTokenAuction } from './auctions'
import { shortAddress } from '../utils/nfts'


export async function getRankedCreators(provider: any, limit: number, from: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const totalCreators = await contract.totalCreators().catch((e: any) => {
    console.warn(`In totalCreators`, e.message)
  })

  if (!totalCreators)
    return [0, []]

  const addresses = await contract.getRankedCreators(from, limit).catch((e: any) => {
      console.warn(`In contract.getRankedCreators`, e.message)
  })

  if (!addresses)
    return [0, []]

  let creators = [] as any

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]

    if (!address || address === ethers.constants.AddressZero)
      break

    const creatorStats = await contract.creatorStats(address).catch((e: any) => {
      console.warn(`In contract.creatorStats`, e.message)
    })

    const short = await shortAddress(address, provider)
    const creator = {
      rank: i,
      shortAddress: short,
      address: address,
      bids: creatorStats.bids.toNumber(),
      sales: creatorStats.sales.toNumber(),
      total: creatorStats.total.toString() || 0
    }
    creators.push(creator)
  }

  return [totalCreators.toNumber(), creators]
}


export async function getCreatorTokens(provider: any, address: string, account: string, limit: number, offset: number) {
  const contract = new ethers.Contract(address, ERC721, provider)

  const tokenIDs = await contract.creatorTokens(account).catch((e: any) => {
    console.warn(`In creatorTokens`, e.message)
  })

  if (!tokenIDs)
    return [0, []]

  let tokens = []

  for (let i = tokenIDs.length - offset - 1; i >= 0; i--) {
    const tokenId = tokenIDs[i]

    const auction = await getTokenAuction(provider, {
      contract: address,
      tokenId: tokenId
    })

    tokens.push({tokenId, auction})

    if (tokens.length >= limit)
      break
  }

  return [tokenIDs.length, tokens]
}
