
import { ethers } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'
import { shortAddress } from '../utils/nfts'


export async function getRankedCollectors(provider: any, limit: number, from: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const totalCollectors = await contract.totalCollectors().catch((e: any) => {
    console.warn(`In totalCollectors`, e.message)
  })

  if (!totalCollectors)
    return [0, []]

  const addresses = await contract.getRankedCollectors(from, limit).catch((e: any) => {
      console.warn(`In contract.getRankedCollectors`, e.message)
  })

  if (!addresses)
    return [0, []]

  let collectors = [] as any

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]

    if (!address || address === ethers.constants.AddressZero)
      break

    const collectorStats = await contract.collectorStats(address).catch((e: any) => {
      console.warn(`In contract.collectorStats`, e.message)
    })

    const short = await shortAddress(address, provider)
    const collector = {
      rank: i,
      shortAddress: short,
      address: address,
      bids: collectorStats.bids.toNumber(),
      sales: collectorStats.sales.toNumber(),
      bought: collectorStats.bought.toNumber(),
      totalSold: collectorStats.totalSold.toString(),
      totalSpent: collectorStats.totalSpent.toString()
    }
    collectors.push(collector)
  }

  return [totalCollectors.toNumber(), collectors]
}
