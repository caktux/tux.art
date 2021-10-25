
import { ethers } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'
import { shortAddress } from '../utils/nfts'


export async function getTokenOffers(provider: any, params: any) {
  const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

  const encoded = ethers.utils.defaultAbiCoder.encode([ 'address', 'uint256' ], [ params.contract, params.tokenId ])
  const hashed = ethers.utils.keccak256(encoded)
  const offerIDs = await contract.getTokenOffers(hashed).catch((e: any) => {
    console.warn(`In getTokenOffers`, e.message)
  })

  if (!offerIDs)
    return []

  let offers = [] as any
  for (let i = offerIDs.length - 1; i >= 0; i--) {
    const offer = await contract.offers(offerIDs[i].toString()).catch((e: any) => {
      console.warn(`In contract.offers of ${offerIDs[i]}`, e.message)
    })
    const from = offer.from ? await shortAddress(offer.from, provider) : ''
    const offerWithID = {
      id: offerIDs[i].toString(),
      shortFrom: from,
      ...offer
    }
    offers.push(offerWithID)
  }

  return offers
}
