
import { ethers, BigNumber } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'

export const NFTSTORAGE_KEY = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDBkMjkxMTQ2ZTky',
                               'MDNhQTY3NDUyNTk3QzMxNTAxRDM0YzlhZjc0RjciLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MT',
                               'YzMjM3OTE3MjE2OSwibmFtZSI6IlR1eCJ9.GVTHBlFiKfQq0dvmJnJOsDh83cDTXMSerf_nmQHgS9g'].join('')

export const PINATA_API = 'https://api.pinata.cloud/pinning/pinByHash'
export const PINATA_API_KEY = '4f1ea2dd8fa6b2de182b'
export const PINATA_SECRET_KEY = '390e366d2f2b95849f1de2db1dd0089fc3488b0c854170f0793f8921fad71539'

export const emptyHouse = {
  id: '',
  name: '',
  curator: '',
  shortCurator: '',
  fee: 0,
  preApproved: false,
  bids: 0,
  sales: 0,
  feesTotal: 0
}

export const emptyToken = {
  metadata: {},
  props: {
    src: '',
    uri: '',
    previewUri: '',
    owner: '',
    creator: '',
    loaded: false,
    isVideo: false,
    title: '',
    description: '',
    createdBy: ''
  }
}

export const emptyAuction = {
  tokenContract: '',
  tokenOwner: '',
  tokenId: '',
  duration: BigNumber.from(0),
  reservePrice: BigNumber.from(0),
  houseId: '',
  fee: 0,
  approved: false,
  firstBidTime: BigNumber.from(0),
  amount: BigNumber.from(0),
  bidder: '',
  created: BigNumber.from(0)
}

export const emptyCountdown = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
}


export const pinToPinata = async (cid: string) => {
  return await fetch(PINATA_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY
    },
    body: JSON.stringify({
      hashToPin: cid
    })
  })
  .then(response => response.json())
  .then(data => {
    return data
  })
  .catch((error) => {
    console.warn('Error pinning on Pinata', error)
    return false
  })
}


export const timeRemaining = (endtime: number) => {
  const remaining = endtime * 1000 - new Date().valueOf()
  const seconds = ('0' + Math.floor((remaining / 1000) % 60)).slice(-2)
  const minutes = ('0' + Math.floor((remaining / 1000 / 60) % 60)).slice(-2)
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24)
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))

  return {
    remaining: remaining > 0 ? remaining : 0,
    days: remaining > 0 ? days : 0,
    hours: remaining > 0 ? hours : 0,
    minutes: remaining > 0 ? minutes : 0,
    seconds: remaining > 0 ? seconds : 0
  }
}

export function shortAddress(longAddress: string, provider: any) {
  const setAddress = async () => {
    const shortAddress = `${longAddress.slice(0, 4)}...${longAddress.slice(longAddress.length - 4)}`

    if (!provider)
      return shortAddress

    const contract = new ethers.Contract(AUCTIONS, Auctions, provider)

    const account = await contract.accounts(longAddress).catch((e: any) => {
      console.warn(`In contract.accounts`, e.message)
    })

    if (account && account.name)
      return account.name

    try {
      const resolvedName = await provider.lookupAddress(longAddress)
      if (resolvedName)
        return resolvedName
    } catch(e) {}

    return shortAddress
  }
  return setAddress()
}
