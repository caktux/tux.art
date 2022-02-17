
import { ethers } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { TuxERC20 } from '../abi/TuxERC20'
import { AUCTIONS, TUXTOKEN } from '../constants/contracts'


export async function getFeaturedContains(provider: any, auctionId: string) {
  const contract = new ethers.Contract(TUXTOKEN, TuxERC20, provider)

  const contains = await contract.getFeaturedContains(auctionId).catch((e: any) => {
    console.warn('In getFeaturedContains', e.message)
  })

  return contains
}


export async function getNextFeaturedTime(provider: any) {
  const contract = new ethers.Contract(TUXTOKEN, TuxERC20, provider)

  const nextFeaturedTime = await contract.getNextFeaturedTime().catch((e: any) => {
    console.warn('In getNextFeaturedTime', e.message)
  })

  return nextFeaturedTime ? nextFeaturedTime.toNumber() : 0
}


export async function getFeatured(provider: any, front = false) {
  const contract = new ethers.Contract(TUXTOKEN, TuxERC20, provider)
  const auctionsContract = new ethers.Contract(AUCTIONS, Auctions, provider)

  if (front) {
    const nextFeaturedTime = await contract.getNextFeaturedTime().catch((e: any) => {
      console.warn('In getNextFeaturedTime', e.message)
    })
    if (nextFeaturedTime.mul(1000).lte(Date.now() - 86400))
      return null
  }

  const featured = await contract.featured().catch((e: any) => {
    console.warn('In featured', e.message)
  })

  const auction = await auctionsContract.auctions(featured).catch((e: any) => {
    console.warn(`In contract.auctions`, e.message)
  })

  if (!auction || auction.tokenId.eq(0))
    return null

  const auctionWithID = {
    id: featured.toString(),
    ...auction
  }

  return auctionWithID
}


export async function getFeaturedQueue(provider: any, limit: number, from: string) {
  const contract = new ethers.Contract(TUXTOKEN, TuxERC20, provider)
  const auctionsContract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const total = await contract.getFeaturedLength().catch((e: any) => {
    console.warn(`In getFeaturedLength`, e.message)
  })
  const auctionIDs = await contract.getFeatured(from, limit).catch((e: any) => {
    console.warn(`In getFeatured`, e.message)
  })

  let auctions = [] as any

  if (!auctionIDs)
    return auctions

  for (let i = 0; i < limit; i++) {
    const auction = await auctionsContract.auctions(auctionIDs[i]).catch((e: any) => {
      console.warn(`In contract.auctions`, e.message)
    })

    if (auction.tokenId.eq(0))
      break

    const price = await contract.getFeaturedPrice(auctionIDs[i]).catch((e: any) => {
      console.warn(`In getFeaturedPrice`, e.message)
    })

    const auctionWithID = {
      id: auctionIDs[i].toString(),
      featuredPrice: price,
      ...auction
    }

    if (auction.approved)
      auctions.push(auctionWithID)

    if (auctions.length >= limit)
      break
  }

  return [total, auctions]
}
