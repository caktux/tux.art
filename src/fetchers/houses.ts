
import { ethers } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'
import { shortAddress, emptyHouse } from '../utils/nfts'

import sortBy from 'lodash/sortBy'


export async function getHouse(provider: any, houseId: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const house = await contract.houses(houseId).catch((e: any) => {
    console.warn(`In contract.houses`, e.message)
  })

  if (!house || !house.name)
    return emptyHouse

  const totalActive = await contract.totalActiveHouseAuctions(houseId).catch((e: any) => {
    console.warn(`In totalActiveHouseAuctions of ${house.name}`, e.message)
  })

  const shortCurator = await shortAddress(house.curator, provider)

  const newHouse = {
    id: houseId,
    name: house.name,
    rank: house.rank,
    curator: house.curator,
    shortCurator: shortCurator,
    fee: house.fee / 100,
    preApproved: house.preApproved,
    bids: house.bids.toNumber(),
    sales: house.sales.toNumber(),
    total: house.total,
    feesTotal: house.feesTotal,
    activeAuctions: totalActive
  }

  return newHouse
}


export async function getActiveHouses(provider: any, limit: number, from: string, minimum?: number) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const totalHouses = await contract.totalActiveHouses().catch((e: any) => {
    console.warn(`In totalActiveHouses`, e.message)
  })

  if (!totalHouses || totalHouses.length === 0)
    return [0, []]

  const houseIDs = await contract.getActiveHouses(from, limit * 2).catch((e: any) => {
    console.warn(`In contract.getActiveHouses`, e.message)
  })

  if (!houseIDs)
    return [0, []]

  let houses = [] as any

  for (let i = 0; i < houseIDs.length; i++) {
    const houseId = houseIDs[i]

    if (houseId.eq(0))
      break

    const totalActive = await contract.totalActiveHouseAuctions(houseId).catch((e: any) => {
      console.warn(`In totalActiveHouseAuctions`, e.message)
    })

    if (minimum && totalActive < minimum)
      continue

    const house = await contract.houses(houseId).catch((e: any) => {
      console.warn(`In contract.houses`, e.message)
    })

    const shortCurator = await shortAddress(house.curator, provider)

    const houseCreators = await contract.getHouseCreators(houseId).catch((e: any) => {
      console.warn(`In getHouseCreators`, e.message)
    })

    let creators = []

    for (const address of houseCreators) {
      const shortCreator = await shortAddress(address, provider)
      creators.push({
        address: address,
        shortAddress: shortCreator
      })
    }

    const newHouse = {
      id: houseId,
      name: house.name,
      rank: house.rank,
      creators: creators,
      curator: house.curator,
      shortCurator: shortCurator,
      fee: house.fee / 100,
      preApproved: house.preApproved,
      bids: house.bids.toNumber(),
      sales: house.sales.toNumber(),
      total: house.total,
      feesTotal: house.feesTotal,
      activeAuctions: totalActive
    }
    houses.push(newHouse)

    if (houses.length >= limit)
      break
  }

  return [totalHouses.toNumber(), houses]
}


export async function getRankedHouses(provider: any, limit: number, from: string, minimum?: number, getCreators?: boolean) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const totalHouses = await contract.totalHouses().catch((e: any) => {
    console.warn(`In totalHouses`, e.message)
  })

  if (!totalHouses)
    return [0, []]

  const houseIDs = await contract.getRankedHouses(from, limit).catch((e: any) => {
    console.warn(`In contract.getRankedHouses`, e.message)
  })

  if (!houseIDs)
    return [0, []]

  let houses = [] as any

  for (let i = 0; i < houseIDs.length; i++) {
    const houseId = houseIDs[i]
    if (houseId.eq(0))
      break

    const house = await contract.houses(houseId).catch((e: any) => {
      console.warn(`In contract.houses`, e.message)
    })

    const totalActive = await contract.totalActiveHouseAuctions(houseId).catch((e: any) => {
      console.warn(`In totalActiveHouseAuctions of ${house.name}`, e.message)
    })

    if (minimum && totalActive < minimum)
      continue

    const shortCurator = await shortAddress(house.curator, provider)

    let creators = []
    if (getCreators) {
      const houseCreators = await contract.getHouseCreators(houseId).catch((e: any) => {
        console.warn(`In getHouseCreators`, e.message)
      })
      for (const address of houseCreators) {
        const shortCreator = await shortAddress(address, provider)
        creators.push({
          address: address,
          shortAddress: shortCreator
        })
      }
    }

    const newHouse = {
      id: houseId,
      name: house.name,
      rank: house.rank,
      creators: creators,
      curator: house.curator,
      shortCurator: shortCurator,
      fee: house.fee / 100,
      preApproved: house.preApproved,
      bids: house.bids.toNumber(),
      sales: house.sales.toNumber(),
      total: house.total,
      feesTotal: house.feesTotal,
      activeAuctions: totalActive
    }
    houses.push(newHouse)

    if (houses.length >= limit)
      break
  }

  return [totalHouses.toNumber(), houses]
}


export async function getCreatorHouses(provider: any, creator: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const houseIDs = await contract.getCreatorHouses(creator).catch((e: any) => {
    console.warn(`In getCreatorHouses`, e.message)
  })

  if (!houseIDs)
    return []

  let houses = [] as any

  for (const houseId of houseIDs) {
    const house = await contract.houses(houseId).catch((e: any) => {
      console.warn(`In contract.houses`, e.message)
    })
    if (!house.name)
      break
    const shortCurator = await shortAddress(house.curator, provider)
    const newHouse = {
      id: houseId,
      name: house.name,
      rank: house.rank,
      curator: house.curator,
      shortCurator: shortCurator,
      fee: house.fee / 100,
      preApproved: house.preApproved,
      bids: house.bids.toNumber(),
      sales: house.sales.toNumber(),
      total: house.total,
      feesTotal: house.feesTotal
    }
    houses.push(newHouse)
  }

  houses = sortBy(houses, ['bids', 'sales']).reverse()

  return houses
}


export async function getCuratorHouses(provider: any, curator: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const houseIDs = await contract.getCuratorHouses(curator).catch((e: any) => {
    console.warn(`In getCuratorHouses`, e.message)
  })

  if (!houseIDs)
    return []

  let houses = [] as any

  for (const houseId of houseIDs) {
    const house = await contract.houses(houseId).catch((e: any) => {
      console.warn(`In contract.houses`, e.message)
    })

    if (!house.name)
      break

    const houseCreators = await contract.getHouseCreators(houseId).catch((e: any) => {
      console.warn(`In getHouseCreators`, e.message)
    })
    let creators = []
    for (const address of houseCreators) {
      const shortCreator = await shortAddress(address, provider)
      creators.push({
        address: address,
        shortAddress: shortCreator
      })
    }

    const houseQueue = await contract.getHouseQueue(houseId).catch((e: any) => {
      console.warn(`In getHouseQueue`, e.message)
    })

    const shortCurator = await shortAddress(house.curator, provider)

    const newHouse = {
      id: houseId,
      name: house.name,
      rank: house.rank,
      curator: house.curator,
      shortCurator: shortCurator,
      fee: house.fee / 100,
      preApproved: house.preApproved,
      bids: house.bids.toNumber(),
      sales: house.sales.toNumber(),
      total: house.total,
      feesTotal: house.feesTotal,
      queue: houseQueue,
      creators: creators
    }
    houses.push(newHouse)
  }

  houses = sortBy(houses, ['bids', 'sales', 'feesTotal']).reverse()

  return houses
}
