
import {
  useMemo,
  useState,
  useEffect,
  useContext,
  createContext
} from 'react'
import type { ReactNode } from 'react'

import { create, Options } from 'ipfs-http-client'
import type { IPFS } from 'ipfs-core-types'
// import IPFS from 'ipfs-core'

type IPFSContext = { ipfs: IPFS<{}> | null; ipfsHost: string; peerCount: number; } | null

const UseIPFSContext = createContext<IPFSContext>(null)

const multiaddrs = [
  ['/ip4/127.0.0.1/tcp/45005', 'http://127.0.0.1:48084'],
  ['/ip4/127.0.0.1/tcp/5001', 'http://127.0.0.1:8080'],
  ['/ip4/127.0.0.1/tcp/5002', 'http://127.0.0.1:9090'],
]

const connectIPFS = async (setIpfs: any, setIpfsHost: any) => {
  // Check for local IPFS node
  let localIpfs = null as any
  for (const multiaddr of multiaddrs) {
    // Try local gateway first
    try {
      const res = await fetch(`${multiaddr[1]}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`)

      if (res.status !== 200)
        continue

      localIpfs = multiaddr
      setIpfsHost(multiaddr[1])
      console.log(`Using local gateway at ${multiaddr[1]}`)
      break
    } catch(e: any) {
      console.warn(e.message)
    }
  }

  if (!localIpfs)
    return

  try {
    const http = create(localIpfs[0] as Options)
    let isOnline = await http.isOnline()

    if (isOnline) {
      setIpfs(http)
      console.log(`Found local IPFS node at ${localIpfs[0]}`)
      // ipfsHost = multiaddr[1]
      // setIpfsHost(localIpfs[1])
      // setIpfsProvider('local')
      // const config = await http.config.getAll()
      // console.log(config)
      return
    }

    // Fallback to built-in IPFS node
    // const builtinIpfs = await IPFS.create()
    // isOnline = await builtinIpfs.isOnline()
    //
    // if (isOnline) {
    //   setIpfs(builtinIpfs)
    //   setIpfsProvider('jsipfs')
    //   console.log('Using built-in IPFS node')
    //   await localIpfs.config.profiles.apply('default-networking')
    //   // await localIpfs.config.profiles.apply('test')
    //   // await localIpfs.swarm.connect('/ip4/127.0.0.1/tcp/44005')
    //   // const config = await localIpfs.config.getAll()
    //   // console.log(await localIpfs.config.profiles.list())
    // }
  }
  catch(e: any) {
    console.warn(e.message)
  }
  return
}


export const useIPFS = () => {
  const ipfsContext = useContext(UseIPFSContext)

  if (ipfsContext === null) {
    throw new Error(
      `useIPFS() can only be used inside of <UseIPFSProvider />
       please declare it at a higher level.`
    )
  }

  const { ipfs, ipfsHost, peerCount } = ipfsContext

  return useMemo(() => {
    return { ipfs, ipfsHost, peerCount }
  }, [ipfs, ipfsHost, peerCount])
}


export function UseIPFSProvider({ children }: { children: ReactNode } ) {
  const ipfsContext = useContext(UseIPFSContext)

  if (ipfsContext !== null) {
    throw new Error('<UseIPFSProvider /> has already been declared.')
  }

  const [ ipfs, setIpfs] = useState<IPFS | null>(null)
  const [ ipfsHost, setIpfsHost] = useState('https://dweb.link')
  const [ peerCount, setPeerCount ] = useState(0)
  const [ started, setStarted ] = useState(false)
  // const [ ipfsProvider, setIpfsProvider ] = useState('')

  useEffect(() => {
    let peerCountInterval = null as any

    if (ipfs === null && !started) {
      connectIPFS(setIpfs, setIpfsHost) // , setIpfsProvider)
      setStarted(true)
    } else if (started) {
      const checkPeerCount = async () => {
        if (!ipfs)
          return
        try {
          const peerInfos = await ipfs.swarm.peers()
          setPeerCount(peerInfos.length)
        }
        catch (e: any) {
          console.warn(e.message)
        }
      }
      peerCountInterval = setInterval(checkPeerCount, 5000)
    }

    return function cleanup() {
      clearInterval(peerCountInterval)
    }
  }, [
    ipfs,
    started,
    setIpfs,
    setIpfsHost,
    // setIpfsProvider,
    setPeerCount
  ])

  return (
    <UseIPFSContext.Provider
      value={{
        ipfs,
        ipfsHost,
        peerCount
      }}
    >
      { children }
    </UseIPFSContext.Provider>
  )
}
