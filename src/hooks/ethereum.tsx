
import {
  useMemo,
  useContext,
  createContext
} from 'react'

import { ethers } from 'ethers'

const UseEthereumContext = createContext(null)

export const useEthereum = () => {
  const ethContext = useContext(UseEthereumContext)

  if (ethContext === null) {
    throw new Error(
      `useEthereum() can only be used inside of <UseEthereumProvider />
       please declare it at a higher level.`
    )
  }

  const { provider } = ethContext

  return useMemo(() => {
    return { provider }
  }, [provider])
}

export function UseEthereumProvider({ children }: any) {
  const ethContext = useContext(UseEthereumContext)

  if (ethContext !== null) {
    throw new Error('<UseEthereum /> has already been declared.')
  }

  // let provider = null as any
  // if (process.env.NODE_ENV !== 'production')
  //   provider = ethers.getDefaultProvider('http://localhost:8545')
  // else
  const provider = ethers.getDefaultProvider('homestead', {
    alchemy: 'Z8JNiWNLZTHZoKDcy3F35IvyMw7CPOM9',
    etherscan: 'TAKHV99M3FA3878H8KV9W9T9XIW9SR2C2F',
    infura: '94d0e160138c4b2b8dda74c503432245',
    pocket: '6150d20f08bcf4003449d22d'
  })

  return (
    <UseEthereumContext.Provider
      value={{provider} as any}
    >
      { children }
    </UseEthereumContext.Provider>
  )
}
