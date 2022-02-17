
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'

import { Link } from 'react-router-dom'

import { shortAddress } from '../utils/nfts'


export default function Address(props: any) {
  const { provider } = useEthereum()

  const [ fetched, setFetched ] = useState(false)
  const [ address, setAddress ] = useState(`${props.address.slice(0, 4)}...${props.address.slice(props.address.length - 4)}`)

  const mounted = useRef(true)

  useEffect(() => {
    const fetchAddress = async () => {
      if (!provider || fetched || !props.address || !mounted.current)
        return

      setFetched(true)

      const address = props.address ? await shortAddress(props.address, provider) : ''

      if (!mounted.current)
        return

      setAddress(address)
    }
    fetchAddress()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Link to={ `/address/${props.address}` }>
      { props.prefix } { address }
    </Link>
  )
}
