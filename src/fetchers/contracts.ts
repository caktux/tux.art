
import { ethers } from 'ethers'
import { ERC721 } from '../abi/ERC721'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'


export async function getRankedContracts(provider: any, limit: number, from: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const totalContracts = await contract.totalContracts().catch((e: any) => {
    console.warn(`In totalContracts`, e.message)
  })

  let contracts = [] as any

  if (!totalContracts)
    return [0, contracts]

  const addresses = await contract.getRankedContracts(from, limit).catch((e: any) => {
    console.warn(`In contract.getRankedContracts`, e.message)
  })

  if (!addresses)
    return [0, contracts]

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]

    if (!address || address === ethers.constants.AddressZero)
      break

    const tokenContract = await contract.contracts(address).catch((e: any) => {
      console.warn(`In contract.contracts`, e.message)
    })
    if (!tokenContract.name)
      break

    contracts.push(tokenContract)
  }

  return [totalContracts.toNumber(), contracts]
}

export async function getTokenContract(provider: any, address: string) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const tokenContract = await contract.contracts(address).catch((e: any) => {
    console.warn(`In contract.contracts`, e.message)
  })

  return tokenContract
}

export async function getContractOwner(provider: any, address: string) {
    const collection = new ethers.Contract(address, ERC721, provider)
    const owner = await collection.owner().catch((e: any) => {})
    return owner
}
