
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useIPFS } from '../hooks/ipfs'

import { Link } from 'react-router-dom'

import Placeholder from 'react-bootstrap/Placeholder'

import { fetchMetadata } from '../fetchers/metadata'
import { emptyToken } from '../utils/nfts'


export default function AuctionItem(props: any) {
  const { provider } = useEthereum()
  const { ipfs, ipfsHost } = useIPFS()

  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ token, setToken ] = useState(emptyToken as any)

  const mounted = useRef(true)

  const updateToken = (token: any) => {
    if (!mounted.current)
      return
    setToken(token)
  }

  useEffect(() => {
    const fetchToken = async () => {
      if (!props.loaded && mounted.current) {
        setLoaded(false)
        setFetched(false)
        updateToken(emptyToken)
        return
      }
      if (!provider || !props.tokenId || fetched || loaded || !mounted.current)
        return

      setFetched(true)

      const fetchedToken = await fetchMetadata(provider, ipfs, ipfsHost, props)

      if (!mounted.current)
        return

      if (!fetchedToken) {
        console.warn(`Whoopsied on ${props.tokenId}`)
        setLoaded(true)
        return
      }

      updateToken(fetchedToken)

      setLoaded(true)
    }
    fetchToken()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      { token.props.title ?
        <Link to={ `/nft/${props.address}/${props.tokenId}` }>
          { token.props.title }
        </Link> :
        <Placeholder as='span' animation='wave'>
          <Placeholder xs={2} />
        </Placeholder> }
    </>
  )
}
