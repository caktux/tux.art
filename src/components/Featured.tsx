
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'

import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { getFeatured } from '../fetchers/featured'
import { getActiveAuctions } from '../fetchers/auctions'
import { getActiveAuctionsGraph } from '../fetchers/auctions-graph'
import FeaturedItem from './FeaturedItem'

import { emptyAuction } from '../utils/nfts'


export const Featured = (props: any) => {
  const { provider } = useEthereum()

  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ auction, setAuction ] = useState(emptyAuction)
  const [ graphAvailable, setGraphAvailable ] = useState(true)

  const mounted = useRef(true)


  const updateAuction = (auction: any) => {
    if (!mounted.current)
      return

    if (!auction) {
      const fetchLatestAuction = async () => {
        let total = 0
        let auctions = []
        let timedOut = false
        if (graphAvailable)
          [total, auctions, timedOut] = await getActiveAuctionsGraph(1, 0)
        else
          [total, auctions] = await getActiveAuctions(provider, 1, '0')

        if (!mounted.current)
          return

        if (timedOut) {
          [total, auctions] = await getActiveAuctions(provider, 1, '0')
          setGraphAvailable(false)
        }

        if (!mounted.current)
          return

        if (!auctions || auctions.length === 0) {
          setLoaded(true)
          return
        }

        latestAuction(auctions[0], total)
      }
      fetchLatestAuction()
      return
    }

    setAuction(auction)

    setLoaded(true)
  }

  const latestAuction = (auction: any, total: number) => {
    if (!mounted.current)
      return

    setAuction(auction)

    setLoaded(true)
  }

  useEffect(() => {
    const fetchAuction = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      const auction = await getFeatured(provider, true)

      if (!mounted.current)
        return

      updateAuction(auction)
    }
    fetchAuction()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      <Row className='justify-content-sm-center mb-4'>
        <Col sm='11' xl='10' className='featuredContainer'>

            <FeaturedItem
              auction={auction}
              tokenId={auction.tokenId}
              address={auction.tokenContract}
              loaded={loaded} />

            { loaded && !auction &&
              <Container fluid>
                <Alert variant='dark' className='text-center'>
                  No featured or latest auction could be found
                </Alert>
              </Container>
            }

        </Col>
      </Row>
    </>
  )
}
