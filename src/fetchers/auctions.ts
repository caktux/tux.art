
import { ethers } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'
import { shortAddress } from '../utils/nfts'

import sortBy from 'lodash/sortBy'


export async function getTokenAuction(provider: any, params: any) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const encoded = ethers.utils.defaultAbiCoder.encode([ 'address', 'uint256' ], [ params.contract, params.tokenId ])
  const hashed = ethers.utils.keccak256(encoded)

  const auctionId = await contract.tokenAuction(hashed).catch((e: any) => {
    console.warn(`In tokenAuction of ${params.contract}:${params.tokenId}`, e.message)
  })

  if (auctionId.eq(0))
    return null

  const auction = await contract.auctions(auctionId).catch((e: any) => {
    console.warn(`In contract.auctions of ${params.contract}:${params.tokenId}`, e.message)
  })

  const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''

  const auctionWithID = {id: auctionId.toString(), ownedBy: ownedBy, ...auction}

  return auctionWithID
}


export async function getActiveHouseAuctions(provider: any, house: any, limit: number, from: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  let auctions = [] as any

  if (!house.activeAuctions || house.activeAuctions.eq(0))
    return auctions

  const auctionIDs = await contract.getHouseAuctions(house.id, from, limit).catch((e: any) => {
    console.warn(`In getHouseAuctions`, e.message)
  })

  if (!auctionIDs)
    return auctions

  for (let i = 0; i < limit; i++) {
    if (auctionIDs[i].eq(0))
      break

    const auction = await contract.auctions(auctionIDs[i]).catch((e: any) => {
      console.warn(`In contract.auctions of ${house.name}`, e.message)
    })

    const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''

    const auctionWithID = {id: auctionIDs[i].toString(), ownedBy: ownedBy, ...auction}

    if (auction.approved)
      auctions.push(auctionWithID)
  }

  return [house.activeAuctions, auctions]
}


export async function getActiveAuctions(provider: any, limit: number, from: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const total = await contract.totalActiveAuctions().catch((e: any) => {
    console.warn(`In totalActiveAuctions`, e.message)
  })

  if (!total)
    return [0, []]

  const auctionIDs = await contract.getAuctions(from, limit).catch((e: any) => {
    console.warn(`In getAuctions`, e.message)
  })

  if (!auctionIDs)
    return [0, []]

  let auctions = [] as any

  for (let i = 0; i < limit; i++) {
    if (auctionIDs[i].eq(0))
      break

    const auction = await contract.auctions(auctionIDs[i]).catch((e: any) => {
      console.warn(`In contract.auctions`, e.message)
    })

    const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''

    const auctionWithID = {id: auctionIDs[i].toString(), ownedBy: ownedBy, ...auction}

    if (auction.approved)
      auctions.push(auctionWithID)
  }

  return [total, auctions]
}


export async function getTopAuctions(provider: any, limit: number, from: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const total = await contract.totalCreators().catch((e: any) => {
    console.warn(`In totalCreators`, e.message)
  })

  const creators = await contract.getRankedCreators(from, limit).catch((e: any) => {
      console.warn(`In contract.getRankedCreators`, e.message)
  })

  if (!creators)
    return []

  let auctions = [] as any

  for (let i = 0; i < limit; i++) {
    const creator = creators[i]

    if (creator === ethers.constants.AddressZero)
      break

    const auctionIDs = await contract.getSellerAuctions(creator).catch((e: any) => {
      console.warn(`In getSellerAuctions`, e.message)
    })

    if (!auctionIDs || auctionIDs.length === 0)
      continue

    for (let a = 0; a < auctionIDs.length; a++) {
      const auction = await contract.auctions(auctionIDs[a]).catch((e: any) => {
        console.warn(`In contract.auctions`, e.message)
      })

      if (!auction.approved || (auction.firstBidTime.gt(0) && auction.firstBidTime.mul(1000).add(auction.duration.mul(1000)).lte(Date.now())))
        continue

      const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''

      const auctionWithID = {id: auctionIDs[a].toString(), ownedBy: ownedBy, ...auction}

      auctions.push(auctionWithID)
      break
    }
  }

  return [total, auctions]
}


export async function getSellerAuctions(provider: any, creator: string, limit: number, offset: number) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const auctionIDs = await contract.getSellerAuctions(creator).catch((e: any) => {
    console.warn(`In getSellerAuctions`, e.message)
  })

  if (!auctionIDs)
    return [0, []]

  let auctions = [] as any

  for (let i = auctionIDs.length - offset - 1; i >= 0; i--) {
    const auction = await contract.auctions(auctionIDs[i]).catch((e: any) => {
      console.warn(`In contract.auctions`, e.message)
    })

    const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''

    const auctionWithID = {id: auctionIDs[i].toString(), ownedBy: ownedBy, ...auction}

    if (auction.approved)
      auctions.push(auctionWithID)

    if (auctions.length >= limit)
      break
  }

  auctions = sortBy(auctions, [(a) => {
    return (!a.bidder ? 31536000000 : (a.firstBidTime.toNumber() - a.duration.toNumber()))
  }]).reverse()

  return [auctionIDs.length, auctions]
}


export async function getBidderAuctions(provider: any, bidder: string, limit: number, offset: number) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const auctionIDs = await contract.getBidderAuctions(bidder).catch((e: any) => {
    console.warn(`In getBidderAuctions`, e.message)
  })

  if (!auctionIDs)
    return [0, []]

  let auctions = [] as any

  for (let i = auctionIDs.length - offset - 1; i >= 0; i--) {
    const auction = await contract.auctions(auctionIDs[i]).catch((e: any) => {
      console.warn(`In contract.auctions`, e.message)
    })

    const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''

    const auctionWithID = {id: auctionIDs[i].toString(), ownedBy: ownedBy, ...auction}

    if (auction.approved)
      auctions.push(auctionWithID)

    if (auctions.length >= limit)
      break
  }

  auctions = sortBy(auctions, [(a) => {
    return (!a.bidder ? 31536000000 : (a.firstBidTime.toNumber() - a.duration.toNumber()))
  }]).reverse()

  return [auctionIDs.length, auctions]
}


export async function getPreviousAuctions(provider: any, params: any) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const encoded = ethers.utils.defaultAbiCoder.encode([ 'address', 'uint256' ], [ params.contract, params.tokenId ])
  const hashed = ethers.utils.keccak256(encoded)

  const auctionIDs = await contract.getPreviousAuctions(hashed).catch((e: any) => {
    console.warn(`In getPreviousAuctions`, e.message)
  })

  if (!auctionIDs)
    return []

  let auctions = [] as any

  for (let i = auctionIDs.length - 1; i >= 0; i--) {
    const auction = await contract.auctions(auctionIDs[i]).catch((e: any) => {
      console.warn(`In contract.auctions of ${auctionIDs[i]}`, e.message)
    })

    const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''
    const wonBy = auction.amount.gt(0) ? await shortAddress(auction.bidder, provider) : ''

    const auctionWithID = {
      id: auctionIDs[i].toString(),
      ownedBy: ownedBy,
      wonBy: wonBy,
      ...auction
    }

    auctions.push(auctionWithID)
  }

  return auctions
}


export async function getHouseQueue(provider: any, house: any, limit: number, offset: number) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const auctionIDs = await contract.getHouseQueue(house.id).catch((e: any) => {
    console.warn(`In getHouseQueue`, e.message)
  })

  let auctions = [] as any

  if (!auctionIDs)
    return auctions

  for (let i = auctionIDs.length - offset - 1; i >= 0; i--) {
    const auction = await contract.auctions(auctionIDs[i]).catch((e: any) => {
      console.warn(`In contract.auctions`, e.message)
    })

    const ownedBy = auction.tokenOwner ? await shortAddress(auction.tokenOwner, provider) : ''

    const auctionWithID = {id: auctionIDs[i].toString(), ownedBy: ownedBy, ...auction}

    auctions.push(auctionWithID)

    if (auctions.length >= limit)
      break
  }

  return [auctions.length, auctions]
}
