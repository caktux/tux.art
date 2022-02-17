
import { ethers } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'


export async function getAuctionBids(provider: any, auctionId: number) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const bidIDs = await contract.getAuctionBids(auctionId).catch((e: any) => {
    console.warn(`In getAuctionBids of ${auctionId}`, e.message)
  })

  if (!bidIDs)
    return []

  let bids = [] as any
  for (let i = bidIDs.length - 1; i >= 0; i--) {
    const bid = await contract.bids(bidIDs[i].toString()).catch((e: any) => {
      console.warn(`In contract.bids of ${auctionId}`, e.message)
    })

    bids.push(bid)
  }

  return bids
}
